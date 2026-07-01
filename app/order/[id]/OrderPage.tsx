"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getCartProductById, formatQuantity, getQuantityStep, getItemWeightKg } from "@/data/catalog";
import AddToOrderModal from "@/components/AddToOrderModal";
import { saveActiveOrder } from "@/components/Header";

const round = (n: number) => Math.round(n * 10) / 10;

const FREE_DELIVERY_THRESHOLD = 3000;
const DELIVERY_COST = 300;
const FREE_DELIVERY_WEIGHT_LIMIT = 15;

const STATUS_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  new:        { label: "Новый",         color: "bg-blue-100 text-blue-700",   icon: "🆕" },
  confirmed:  { label: "Подтверждён",   color: "bg-yellow-100 text-yellow-700", icon: "✅" },
  assembling: { label: "Собирается",    color: "bg-orange-100 text-orange-700", icon: "🧺" },
  delivering: { label: "Доставляется",  color: "bg-purple-100 text-purple-700", icon: "🚚" },
  done:       { label: "Выполнен",      color: "bg-green-100 text-green-700",  icon: "🎉" },
  cancelled:  { label: "Отменён",       color: "bg-red-100 text-red-700",     icon: "❌" },
};

type OrderItem = { productId: string; quantity: number };

type Order = {
  id: string;
  items: OrderItem[];
  itemsCount: number;
  estimatedTotal: string;
  phone: string;
  address: string;
  comment: string | null;
  status: string;
  messengerPlatform: string | null;
  messengerChatId: string | null;
  createdAt: string;
  updatedAt: string;
};

const TELEGRAM_BOT_USERNAME = "fruktu_bot";

export default function OrderPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  // editable fields
  const [items, setItems] = useState<OrderItem[]>([]);
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [comment, setComment] = useState("");

  const load = useCallback(async () => {
    const res = await fetch(`/api/orders/${id}`);
    if (!res.ok) { setLoading(false); return; }
    const data: Order = await res.json();
    setOrder(data);
    setItems(data.items);
    setPhone(data.phone);
    setAddress(data.address);
    setComment(data.comment ?? "");
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

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
  const goodsTotal = editing ? computedTotal : Math.round(Number(order?.estimatedTotal ?? 0));
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

  const handleAddItems = async (newItems: OrderItem[]) => {
    if (!order) return;
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
      body: JSON.stringify({
        items: merged,
        itemsCount: merged.length,
        estimatedTotal: mergedTotal,
      }),
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
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          {["done", "cancelled"].includes(order.status) ? (
            <Link href="/catalog" className="mb-2 inline-block text-sm text-muted hover:text-primary-dark">
              ← В каталог
            </Link>
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

      {!["done", "cancelled"].includes(order.status) && (
        <div className="mb-6 rounded-[16px] border border-primary/20 bg-primary/5 p-4 text-sm text-primary-dark">
          <p>Мы начали собирать ваш заказ. После смены статуса на «Собран» появится окончательная стоимость заказа, и можно будет оплатить онлайн.</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-3 rounded-[10px] bg-primary px-4 py-2 text-sm font-bold text-white"
          >
            ➕ Добавить к заказу
          </button>
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
                <span className="text-2xl">{product.icon}</span>
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

      {/* Messenger notifications */}
      <section className="mb-6 rounded-[16px] border border-black/5 bg-white p-4">
        <h2 className="mb-1 font-bold">Уведомления о заказе</h2>
        {order.messengerPlatform === "telegram" && order.messengerChatId ? (
          <p className="flex items-center gap-2 text-sm text-primary-dark">
            <span aria-hidden>✅</span>
            Подключены уведомления в Telegram
          </p>
        ) : (
          <>
            <p className="mb-3 text-sm text-muted">
              Подключите Telegram — пришлём сообщение, когда заказ подтвердят, соберут и привезут.
            </p>
            <a
              href={`https://t.me/${TELEGRAM_BOT_USERNAME}?start=order_${order.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-[10px] bg-[#229ED9] px-4 py-2.5 text-sm font-bold text-white"
            >
              ✈️ Подключить Telegram
            </a>
          </>
        )}
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
