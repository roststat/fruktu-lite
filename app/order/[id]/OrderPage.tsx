"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getCartProductById, formatQuantity, getQuantityStep, getItemWeightKg } from "@/data/catalog";
import AddToOrderModal from "@/components/AddToOrderModal";
import { saveActiveOrder } from "@/components/Header";

const round = (n: number) => Math.round(n * 10) / 10;

const FREE_DELIVERY_THRESHOLD = 3000;
const DELIVERY_COST = 300;
const FREE_DELIVERY_WEIGHT_LIMIT = 15;

const STATUS_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  new:        { label: "Новый",         color: "bg-blue-100 text-blue-700",     icon: "🆕" },
  confirmed:  { label: "Подтверждён",   color: "bg-yellow-100 text-yellow-700", icon: "✅" },
  assembling: { label: "Собирается",    color: "bg-orange-100 text-orange-700", icon: "🧺" },
  assembled:  { label: "Собран",        color: "bg-emerald-100 text-emerald-700", icon: "📦" },
  delivering: { label: "Доставляется",  color: "bg-purple-100 text-purple-700", icon: "🚚" },
  done:       { label: "Выполнен",      color: "bg-green-100 text-green-700",   icon: "🎉" },
  cancelled:  { label: "Отменён",       color: "bg-red-100 text-red-700",       icon: "❌" },
};

type OrderItem = { productId: string; quantity: number };

type AdminChangeEntry = {
  kind: "added" | "removed" | "qty_changed";
  productId: string;
  productName: string;
  unit: string;
  from?: number;
  to?: number;
};

type AdminChangeEvent = {
  ts: string;
  prevTotal: number;
  newTotal: number;
  entries: AdminChangeEntry[];
};

type LinkedOrder = {
  id: string;
  status: string;
  estimatedTotal: string;
  finalTotal: string | null;
  finalWeight: string | null;
  items: OrderItem[];
  itemsCount: number;
  createdAt: string;
};

type Order = {
  id: string;
  items: OrderItem[];
  itemsCount: number;
  estimatedTotal: string;
  finalWeight: string | null;
  finalTotal: string | null;
  paymentStatus: string | null;
  phone: string;
  address: string;
  comment: string | null;
  status: string;
  adminChanges: AdminChangeEvent[] | null;
  linkedOrderId: string | null;
  linkedOrders: LinkedOrder[];
  messengerPlatform: string | null;
  messengerChatId: string | null;
  createdAt: string;
  updatedAt: string;
};

const TELEGRAM_BOT_USERNAME = "fruktu_bot";

function AdminChanges({ changes }: { changes: AdminChangeEvent[] }) {
  const [open, setOpen] = useState(false);
  const total = changes.reduce((n, e) => n + e.entries.length, 0);
  return (
    <section className="mb-6 rounded-[16px] border border-amber-200 bg-amber-50 overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between p-4 text-left"
      >
        <span className="font-bold text-amber-800">📋 Корректировки в заказе</span>
        <span className="flex items-center gap-2 text-sm font-semibold text-amber-700">
          <span className="rounded-full bg-amber-200 px-2 py-0.5 text-xs font-bold">{total}</span>
          <span>{open ? "↑" : "↓"}</span>
        </span>
      </button>
      {open && (
        <div className="flex flex-col gap-3 px-4 pb-4">
          {[...changes].reverse().map((event, i) => {
            const totalDiff = event.newTotal - event.prevTotal;
            return (
              <div key={i} className="rounded-[12px] bg-white border border-amber-100 p-3">
                <p className="mb-2 text-xs text-amber-700 font-semibold">
                  {new Date(event.ts).toLocaleString("ru")}
                  {totalDiff !== 0 && (
                    <span className={`ml-2 font-bold ${totalDiff > 0 ? "text-emerald-600" : "text-red-500"}`}>
                      {totalDiff > 0 ? "+" : ""}{totalDiff} ₽ ({event.prevTotal} → {event.newTotal} ₽)
                    </span>
                  )}
                </p>
                <ul className="flex flex-col gap-1">
                  {event.entries.map((e, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm">
                      {e.kind === "added" && <span className="mt-0.5 shrink-0 text-emerald-600">➕</span>}
                      {e.kind === "removed" && <span className="mt-0.5 shrink-0 text-red-500">➖</span>}
                      {e.kind === "qty_changed" && <span className="mt-0.5 shrink-0 text-blue-600">✏️</span>}
                      <span>
                        <span className="font-semibold">{e.productName}</span>
                        {e.kind === "added" && <span className="text-muted"> — добавлен ({e.to} {e.unit})</span>}
                        {e.kind === "removed" && <span className="text-muted"> — убран из заказа</span>}
                        {e.kind === "qty_changed" && <span className="text-muted"> — количество: {e.from} → {e.to} {e.unit}</span>}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default function OrderPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [statusNotif, setStatusNotif] = useState<{ label: string; icon: string; color: string } | null>(null);
  const prevStatusRef = useRef<string | null>(null);
  const notifTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // editable fields
  const [items, setItems] = useState<OrderItem[]>([]);
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [comment, setComment] = useState("");

  const load = useCallback(async () => {
    const res = await fetch(`/api/orders/${id}`);
    if (!res.ok) { setLoading(false); return; }
    const data: Order = await res.json();
    // Detect status change (skip on initial load when prevStatusRef is null)
    if (prevStatusRef.current !== null && prevStatusRef.current !== data.status) {
      const info = STATUS_LABELS[data.status];
      if (info) {
        if (notifTimerRef.current) clearTimeout(notifTimerRef.current);
        setStatusNotif(info);
        notifTimerRef.current = setTimeout(() => setStatusNotif(null), 6000);
      }
    }
    prevStatusRef.current = data.status;
    setOrder(data);
    setItems(data.items);
    setPhone(data.phone);
    setAddress(data.address);
    setComment(data.comment ?? "");
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  // Polling every 15s for live updates (status, items, changes)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!editing) load();
    }, 15000);
    return () => clearInterval(interval);
  }, [load, editing]);

  // Save/clear active order in localStorage so catalog can show the "заказ в работе" banner
  useEffect(() => {
    if (!order) return;
    saveActiveOrder({ id: order.id, status: order.status });
  }, [order?.id, order?.status]);

  const computedTotal = items.reduce((sum, item) => {
    const entry = getCartProductById(item.productId);
    if (!entry) return sum;
    return sum + Math.round(entry.price * item.quantity);
  }, 0);

  const totalWeight = items.reduce((sum, item) => {
    const entry = getCartProductById(item.productId);
    return entry ? sum + getItemWeightKg(entry.product, item.quantity) : sum;
  }, 0);
  const isOverWeightLimit = totalWeight > FREE_DELIVERY_WEIGHT_LIMIT;
  const hasFinal = order?.finalTotal != null;
  const goodsTotal = hasFinal
    ? Math.round(Number(order!.finalTotal))
    : editing ? computedTotal : Math.round(Number(order?.estimatedTotal ?? 0));
  const deliveryCost =
    items.length === 0 ? 0
    : isOverWeightLimit ? DELIVERY_COST
    : goodsTotal >= FREE_DELIVERY_THRESHOLD ? 0
    : DELIVERY_COST;
  const grandTotal = goodsTotal + deliveryCost;

  const handleSave = async () => {
    setSaving(true);
    await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items,
        itemsCount: items.length,
        estimatedTotal: computedTotal,
        phone,
        address,
        comment,
      }),
    });
    await load();
    setSaving(false);
    setEditing(false);
  };

  const handleAddLinkedOrder = async (newItems: OrderItem[]) => {
    if (!order) return;
    const total = newItems.reduce((sum, item) => {
      const entry = getCartProductById(item.productId);
      return entry ? sum + Math.round(entry.price * item.quantity) : sum;
    }, 0);
    await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: newItems,
        itemsCount: newItems.length,
        estimatedTotal: total,
        phone: order.phone,
        address: order.address,
        comment: order.comment,
        linkedOrderId: order.id,
      }),
    });
    await load();
  };

  const handleAddItems = async (newItems: OrderItem[]) => {
    if (!order) return;
    if (order.status === "assembled") {
      await handleAddLinkedOrder(newItems);
      return;
    }
    const merged = [...order.items];
    for (const newItem of newItems) {
      const idx = merged.findIndex((i) => i.productId === newItem.productId);
      if (idx >= 0) {
        merged[idx] = { ...merged[idx], quantity: merged[idx].quantity + newItem.quantity };
      } else {
        merged.push(newItem);
      }
    }
    const mergedTotal = merged.reduce((sum, item) => {
      const entry = getCartProductById(item.productId);
      return entry ? sum + Math.round(entry.price * item.quantity) : sum;
    }, 0);
    await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: merged, itemsCount: merged.length, estimatedTotal: mergedTotal }),
    });
    await load();
  };

  const handleCancel = async () => {
    if (!confirm("Точно отменить заказ?")) return;
    setCancelling(true);
    await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "cancelled" }),
    });
    await load();
    setCancelling(false);
  };

  const setQty = (productId: string, qty: number) => {
    if (qty <= 0) {
      setItems((prev) => prev.filter((i) => i.productId !== productId));
    } else {
      setItems((prev) => prev.map((i) => i.productId === productId ? { ...i, quantity: qty } : i));
    }
  };

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-muted">Загружаем заказ…</p>
    </div>
  );

  if (!order) return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <span className="text-5xl">🤔</span>
      <p className="text-lg font-bold">Заказ не найден</p>
      <Link href="/catalog" className="rounded-[10px] bg-primary px-4 py-2 text-sm font-semibold text-white">
        В каталог
      </Link>
    </div>
  );

  const statusInfo = STATUS_LABELS[order.status] ?? STATUS_LABELS.new;
  const displayItems = editing ? items : order.items;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Status change popup notification */}
      {statusNotif && (
        <div
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-in fade-in slide-in-from-bottom-4 duration-300"
          onClick={() => setStatusNotif(null)}
        >
          <div className={`flex items-center gap-3 rounded-2xl px-5 py-4 shadow-xl ring-1 ring-black/10 ${statusNotif.color} cursor-pointer`}>
            <span className="text-2xl">{statusNotif.icon}</span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide opacity-70">Статус заказа изменился</p>
              <p className="text-base font-bold">{statusNotif.label}</p>
            </div>
            <button className="ml-2 text-lg opacity-50 hover:opacity-100">×</button>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          {["done", "cancelled", "delivering"].includes(order.status) ? (
            <Link href="/catalog" className="mb-2 inline-block text-sm text-muted hover:text-primary-dark">
              ← В каталог
            </Link>
          ) : order.status === "assembled" ? (
            <span className="mb-2 inline-block text-sm text-muted">Заказ ожидает оплаты</span>
          ) : (
            <button
              onClick={() => setShowAddModal(true)}
              className="mb-2 inline-block text-sm font-semibold text-primary-dark hover:underline"
            >
              ← Добавить товар из каталога
            </button>
          )}
          <h1 className="text-2xl font-extrabold text-foreground">Заказ</h1>
          <p className="mt-0.5 font-mono text-xs text-muted">{order.id}</p>
        </div>
        <span className={`mt-6 shrink-0 rounded-[10px] px-3 py-1.5 text-sm font-bold ${statusInfo.color}`}>
          {statusInfo.icon} {statusInfo.label}
        </span>
      </div>

      {/* Dates */}
      <div className="mb-4 flex gap-6 text-sm text-muted">
        <span>Создан: {new Date(order.createdAt).toLocaleString("ru")}</span>
        {order.updatedAt !== order.createdAt && (
          <span>Обновлён: {new Date(order.updatedAt).toLocaleString("ru")}</span>
        )}
      </div>

      {/* Linked to assembled order banner */}
      {order.linkedOrderId && (
        <div className="mb-6 rounded-[16px] border border-amber-200 bg-amber-50 p-4 text-sm">
          <p className="font-bold text-amber-800">⚠️ У вас есть неоплаченный собранный заказ</p>
          <p className="mt-1 text-amber-700">Этот заказ будет доставлен вместе с ним одним рейсом. Оплатить нужно оба.</p>
          <Link
            href={`/order/${order.linkedOrderId}`}
            className="mt-3 inline-block rounded-[10px] bg-amber-500 px-4 py-2 text-sm font-bold text-white"
          >
            💳 Перейти к оплате первого заказа
          </Link>
        </div>
      )}

      {/* Telegram CTA — prominent, shown for all active orders */}
      {!["done", "cancelled"].includes(order.status) && (
        order.messengerPlatform === "telegram" && order.messengerChatId ? (
          <div className="mb-6 flex items-center gap-3 rounded-[16px] border border-[#229ED9]/30 bg-[#229ED9]/8 p-4">
            <span className="text-2xl">✅</span>
            <div>
              <p className="font-bold text-[#1a7aab]">Telegram подключён</p>
              <p className="text-sm text-[#1a7aab]/80">Вы получите уведомление при любом изменении заказа.</p>
            </div>
          </div>
        ) : (
          <div className="mb-6 rounded-[16px] border-2 border-[#229ED9] bg-[#229ED9]/5 p-4">
            <div className="mb-3 flex items-start gap-3">
              <span className="mt-0.5 text-2xl">✈️</span>
              <div>
                <p className="font-extrabold text-foreground">Подключите Telegram — не закрывайте заказ!</p>
                <p className="mt-1 text-sm text-muted">
                  Здесь появится окончательная стоимость и кнопка оплаты после сборки.
                  Но если закроете страницу — подключите Telegram, чтобы не пропустить уведомление.
                </p>
              </div>
            </div>
            <ul className="mb-4 flex flex-col gap-1 pl-9 text-sm text-muted">
              <li>🔔 Статус заказа в реальном времени</li>
              <li>💰 Окончательная стоимость после сборки</li>
              <li>📦 Уведомление когда заказ едет к вам</li>
            </ul>
            <a
              href={`https://t.me/${TELEGRAM_BOT_USERNAME}?start=order_${order.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center gap-2 rounded-[12px] bg-[#229ED9] py-3 text-base font-bold text-white shadow-sm"
            >
              ✈️ Подключить Telegram и следить за заказом
            </a>
            <p className="mt-2 text-center text-xs text-muted">
              Или оставайтесь на этой странице — она обновляется автоматически каждые 15 секунд
            </p>
          </div>
        )
      )}

      {order.status === "assembled" && (() => {
        const linked = order.linkedOrders ?? [];
        const thisTotal = Math.round(Number(order.finalTotal ?? order.estimatedTotal));
        const linkedAssembledTotal = linked
          .filter((lo) => lo.status === "assembled")
          .reduce((s, lo) => s + Math.round(Number(lo.finalTotal ?? lo.estimatedTotal)), 0);
        const grandTotal = thisTotal + linkedAssembledTotal;
        const allAssembled = linked.every((lo) => lo.status === "assembled");
        const readyToPay = linked.length === 0 || allAssembled;
        return (
          <div className="mb-6 rounded-[16px] border border-emerald-200 bg-emerald-50 p-4">
            <p className="font-bold text-emerald-700">📦 Заказ собран и готов к оплате!</p>
            {order.finalWeight && (
              <p className="mt-1 text-sm text-emerald-700">⚖️ Точный вес: <b>{Math.round(Number(order.finalWeight) * 10) / 10} кг</b></p>
            )}

            {linked.length > 0 && (
              <div className="mt-3 rounded-[10px] border border-emerald-300 bg-white p-3">
                <div className="flex flex-col gap-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted">Часть 1 (этот заказ)</span>
                    <span className="font-semibold">{thisTotal} ₽</span>
                  </div>
                  {linked.map((lo, i) => {
                    const loTotal = Math.round(Number(lo.finalTotal ?? lo.estimatedTotal));
                    const loAssembled = lo.status === "assembled";
                    return (
                      <div key={lo.id} className="flex items-center justify-between">
                        <span className="text-muted flex items-center gap-1.5">
                          Часть {i + 2} ({lo.itemsCount} поз.)
                          <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${loAssembled ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-700"}`}>
                            {loAssembled ? "Собрана" : "Собирается"}
                          </span>
                        </span>
                        <span className={`font-semibold ${loAssembled ? "" : "text-muted"}`}>
                          {loAssembled ? "" : "~"}{loTotal} ₽
                        </span>
                      </div>
                    );
                  })}
                  <div className="flex justify-between border-t border-black/10 pt-1.5 font-bold text-foreground">
                    <span>Итого{!allAssembled ? " (пока)" : ""}</span>
                    <span>{grandTotal} ₽</span>
                  </div>
                </div>
                {!allAssembled && (
                  <p className="mt-2 text-xs text-orange-600">⏳ Ждём когда соберут все части — тогда откроется оплата</p>
                )}
                <p className="mt-1 text-xs text-emerald-700">🚚 Доставка всех частей одним рейсом</p>
              </div>
            )}

            {linked.length === 0 && (
              <p className="mt-1 text-sm text-emerald-700">💰 Итоговая сумма: <b>{thisTotal} ₽</b></p>
            )}

            {readyToPay ? (
              <Link
                href={`/order/${order.id}/pay`}
                className="mt-3 inline-flex w-full items-center justify-center rounded-[12px] bg-emerald-600 py-3 text-base font-bold text-white"
              >
                💳 Оплатить {grandTotal} ₽
              </Link>
            ) : (
              <div className="mt-3 w-full rounded-[12px] bg-black/10 py-3 text-center text-sm font-bold text-muted">
                Оплата откроется когда все части собраны
              </div>
            )}

            <button
              onClick={() => setShowAddModal(true)}
              className="mt-2 w-full rounded-[12px] border border-emerald-300 bg-white py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
            >
              ➕ Добавить ещё товары (доставим вместе)
            </button>
          </div>
        );
      })()}

      {!["done", "cancelled", "assembled", "delivering"].includes(order.status) && (
        <div className="mb-6 rounded-[16px] border border-primary/20 bg-primary/5 p-4 text-sm text-primary-dark">
          <p>Мы начали собирать ваш заказ. После сборки появится окончательная стоимость и кнопка оплаты.</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-3 rounded-[10px] bg-primary px-4 py-2 text-sm font-bold text-white"
          >
            ➕ Добавить к заказу
          </button>
        </div>
      )}

      {order.status === "delivering" && (
        <div className="mb-6 rounded-[16px] border border-orange-200 bg-orange-50 p-4 text-sm text-orange-800">
          <p className="font-bold">🚚 Заказ уже едет к вам!</p>
          <p className="mt-1">Добавить товары в этот заказ уже нельзя. Можно оформить новый — доставим отдельным рейсом.</p>
          <Link
            href="/catalog"
            className="mt-3 inline-block rounded-[10px] bg-orange-500 px-4 py-2 text-sm font-bold text-white"
          >
            Оформить новый заказ
          </Link>
        </div>
      )}

      {/* Contact info */}
      <section className="mb-6 rounded-[16px] border border-black/5 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-bold">Контактные данные</h2>
          {!editing && (
            <button onClick={() => setEditing(true)} className="text-sm font-semibold text-primary-dark hover:underline">
              Редактировать
            </button>
          )}
        </div>
        {editing ? (
          <div className="flex flex-col gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted">Телефон</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-[10px] border border-black/10 px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted">Адрес доставки</label>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full rounded-[10px] border border-black/10 px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted">Комментарий</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={2}
                className="w-full rounded-[10px] border border-black/10 px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
          </div>
        ) : (
          <dl className="flex flex-col gap-2 text-sm">
            <div className="flex gap-2">
              <dt className="w-28 shrink-0 text-muted">Телефон</dt>
              <dd className="font-semibold">{order.phone}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-28 shrink-0 text-muted">Адрес</dt>
              <dd className="font-semibold">{order.address}</dd>
            </div>
            {order.comment && (
              <div className="flex gap-2">
                <dt className="w-28 shrink-0 text-muted">Комментарий</dt>
                <dd>{order.comment}</dd>
              </div>
            )}
          </dl>
        )}
      </section>

      {/* Items */}
      <section className="mb-6 rounded-[16px] border border-black/5 bg-white p-4">
        <h2 className="mb-3 font-bold">Состав заказа</h2>
        <ul className="flex flex-col gap-3">
          {displayItems.map((item) => {
            const entry = getCartProductById(item.productId);
            if (!entry) return null;
            const { product, price, isClearance } = entry;
            const step = getQuantityStep(product);
            const itemPrice = Math.round(price * item.quantity);
            return (
              <li key={item.productId} className={`flex items-center gap-3 rounded-[10px] border p-3 ${isClearance ? "border-green-600/20 bg-green-600/5" : "border-black/5"}`}>
                <div className="relative h-12 w-12 shrink-0 rounded-[8px] bg-white overflow-hidden">
                  {product.image ? (
                    <Image src={product.image} alt={product.name} fill sizes="48px" className="object-contain p-1" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-2xl">{product.icon}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{product.name}</p>
                  <p className="text-xs text-muted">{price} ₽/{product.unit} · {itemPrice} ₽</p>
                </div>
                {editing ? (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setQty(item.productId, round(item.quantity - step))}
                      className="h-7 w-7 rounded-[10px] bg-primary/10 text-primary-dark"
                    >−</button>
                    <span className="w-14 text-center text-sm font-semibold">
                      {formatQuantity(product, item.quantity)}
                    </span>
                    <button
                      onClick={() => setQty(item.productId, round(item.quantity + step))}
                      className="h-7 w-7 rounded-[10px] bg-primary/10 text-primary-dark"
                    >+</button>
                  </div>
                ) : (
                  <span className="shrink-0 text-sm font-semibold">{formatQuantity(product, item.quantity)}</span>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {/* Admin changes history */}
      {order.adminChanges && order.adminChanges.length > 0 && (
        <AdminChanges changes={order.adminChanges} />
      )}

      {/* Totals */}
      <section className="mb-6 rounded-[16px] border border-black/5 bg-white p-4">
        <h2 className="mb-3 font-bold">Итого</h2>
        <div className="flex items-center justify-between text-sm text-muted">
          <span>Товаров</span>
          <span>{order.itemsCount} позиций · ~{goodsTotal} ₽</span>
        </div>
        <div className="mt-1 flex items-center justify-between text-sm text-muted">
          <span>Общий вес</span>
          <span className={isOverWeightLimit ? "font-semibold text-tomato" : ""}>~{round(totalWeight)} кг</span>
        </div>
        <div className="mt-1 flex items-center justify-between text-sm text-muted">
          <span>Доставка по Ялте</span>
          {deliveryCost === 0
            ? <span className="font-semibold text-primary-dark">Бесплатно 🎉</span>
            : <span>+{DELIVERY_COST} ₽</span>}
        </div>
        <div className="mt-1 flex items-center justify-between border-t border-black/5 pt-2">
          <span className="text-sm text-muted">Итого с доставкой</span>
          <span className="text-xl font-extrabold text-primary-dark">~{grandTotal} ₽</span>
        </div>
        {deliveryCost > 0 && (
          <p className="mt-1 text-xs text-muted">
            {isOverWeightLimit
              ? `Доставка платная: вес заказа превышает ${FREE_DELIVERY_WEIGHT_LIMIT} кг`
              : `Бесплатная доставка при заказе от ${FREE_DELIVERY_THRESHOLD} ₽ и весом до ${FREE_DELIVERY_WEIGHT_LIMIT} кг`}
          </p>
        )}
        <p className="mt-1 text-xs text-muted">Точная сумма уточняется после сборки</p>
      </section>

      {/* Actions */}
      {editing ? (
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 rounded-[10px] bg-primary py-3 text-sm font-bold text-white disabled:opacity-60"
          >
            {saving ? "Сохраняем…" : "Сохранить изменения"}
          </button>
          <button
            onClick={() => { setEditing(false); setItems(order.items); setPhone(order.phone); setAddress(order.address); setComment(order.comment ?? ""); }}
            className="rounded-[10px] bg-black/5 px-4 py-3 text-sm font-semibold text-muted"
          >
            Отмена
          </button>
        </div>
      ) : !["done", "cancelled"].includes(order.status) && (
        <button
          onClick={handleCancel}
          disabled={cancelling}
          className="w-full rounded-[10px] bg-red-50 py-3 text-sm font-bold text-red-600 disabled:opacity-60"
        >
          {cancelling ? "Отменяем…" : "Отменить заказ"}
        </button>
      )}

      {showAddModal && (
        <AddToOrderModal onClose={() => setShowAddModal(false)} onConfirm={handleAddItems} />
      )}
    </div>
  );
}
