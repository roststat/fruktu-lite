"use client";

import { useState } from "react";
import Link from "next/link";
import { type Order } from "@/lib/db/schema";

// Highlight linked (supplementary) orders prominently
function LinkedOrderBadge({ orderId }: { orderId: string }) {
  return (
    <div className="mb-2 flex items-center gap-2 rounded-[10px] border border-orange-300 bg-orange-50 px-3 py-2 text-sm font-bold text-orange-700">
      <span>🔗</span>
      <span>Дополнение к заказу</span>
      <Link href={`/order/${orderId}`} className="ml-auto text-xs font-semibold text-primary-dark underline hover:no-underline">
        Открыть основной
      </Link>
    </div>
  );
}
import { getCartProductById, formatQuantity, isWeightProduct } from "@/data/catalog";
import AdminCatalogPicker from "./AdminCatalogPicker";


const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  new:        { label: "Новый",        color: "bg-blue-100 text-blue-700" },
  confirmed:  { label: "Подтверждён",  color: "bg-yellow-100 text-yellow-700" },
  assembling: { label: "Собирается",   color: "bg-orange-100 text-orange-700" },
  assembled:  { label: "Собран",       color: "bg-emerald-100 text-emerald-700" },
  delivering: { label: "Доставляется", color: "bg-purple-100 text-purple-700" },
  done:       { label: "Выполнен",     color: "bg-green-100 text-green-700" },
  cancelled:  { label: "Отменён",      color: "bg-red-100 text-red-700" },
};

const STATUS_ORDER = ["new", "confirmed", "assembling", "assembled", "delivering", "done", "cancelled"];

type OrderItem = { productId: string; quantity: number };
type FactItem  = { productId: string; factQty: number };

function round1(n: number) { return Math.round(n * 10) / 10; }

function FactTable({
  planItems,
  factMap,
  onChange,
}: {
  planItems: OrderItem[];
  factMap: Record<string, number>;
  onChange: (productId: string, val: number) => void;
}) {
  let planTotal = 0, factTotal = 0;

  return (
    <div className="mt-3 overflow-x-auto rounded-[12px] border border-black/5">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-black/5 bg-black/2 text-xs text-muted">
            <th className="px-3 py-2 text-left font-semibold">Товар</th>
            <th className="px-3 py-2 text-right font-semibold">Ед.</th>
            <th className="px-3 py-2 text-right font-semibold">Цена</th>
            <th className="px-3 py-2 text-right font-semibold">План</th>
            <th className="px-3 py-2 text-right font-semibold">Сумма план</th>
            <th className="px-3 py-2 text-right font-semibold">Факт</th>
            <th className="px-3 py-2 text-right font-semibold">Сумма факт</th>
          </tr>
        </thead>
        <tbody>
          {planItems.map((item) => {
            const entry = getCartProductById(item.productId);
            if (!entry) return null;
            const { product, price } = entry;
            const isKg = isWeightProduct(product);
            const planQty = item.quantity;
            const factQty = factMap[item.productId] ?? planQty;
            const planSum = Math.round(price * planQty);
            const factSum = Math.round(price * factQty);
            planTotal += planSum;
            factTotal += factSum;

            const diff = factQty - planQty;
            const diffColor = diff > 0 ? "text-emerald-600" : diff < 0 ? "text-red-500" : "text-muted";

            return (
              <tr key={item.productId} className="border-b border-black/5 last:border-0">
                <td className="px-3 py-2 font-medium">{product.name}</td>
                <td className="px-3 py-2 text-right text-muted">{product.unit}</td>
                <td className="px-3 py-2 text-right text-muted">{price} ₽</td>
                <td className="px-3 py-2 text-right">
                  {formatQuantity(product, planQty)}
                </td>
                <td className="px-3 py-2 text-right text-muted">{planSum} ₽</td>
                <td className="px-3 py-2 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <input
                      type="number"
                      step={isKg ? "0.1" : "1"}
                      min="0"
                      value={factQty}
                      onChange={(e) => onChange(item.productId, Number(e.target.value))}
                      className="w-20 rounded-[8px] border border-black/10 px-2 py-1 text-right text-sm outline-none focus:border-primary"
                    />
                    {diff !== 0 && (
                      <span className={`text-xs font-semibold ${diffColor}`}>
                        {diff > 0 ? "+" : ""}{isKg ? round1(diff) : diff}
                      </span>
                    )}
                  </div>
                </td>
                <td className={`px-3 py-2 text-right font-semibold ${diff < 0 ? "text-red-500" : diff > 0 ? "text-emerald-600" : ""}`}>
                  {factSum} ₽
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-black/10 bg-black/2 font-bold">
            <td colSpan={4} className="px-3 py-2 text-right text-muted text-xs">Итого:</td>
            <td className="px-3 py-2 text-right">{planTotal} ₽</td>
            <td className="px-3 py-2"></td>
            <td className={`px-3 py-2 text-right ${factTotal !== planTotal ? "text-primary-dark" : ""}`}>
              {factTotal} ₽
              {factTotal !== planTotal && (
                <span className={`ml-1 text-xs ${factTotal > planTotal ? "text-emerald-600" : "text-red-500"}`}>
                  ({factTotal > planTotal ? "+" : ""}{factTotal - planTotal} ₽)
                </span>
              )}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function OrderRow({ order, onUpdate }: { order: Order; onUpdate: (o: Order) => void }) {
  const [status, setStatus] = useState(order.status);
  const [saving, setSaving] = useState(false);
  const [showItems, setShowItems] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);

  const planItems = (order.items as OrderItem[]) ?? [];
  const savedFact = (order.factItems as FactItem[] | null) ?? [];

  // factMap: productId → factQty (initialized from saved factItems or plan)
  const [factMap, setFactMap] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    for (const item of planItems) {
      const saved = savedFact.find((f) => f.productId === item.productId);
      map[item.productId] = saved ? saved.factQty : item.quantity;
    }
    return map;
  });

  const info = STATUS_LABELS[status] ?? { label: status, color: "bg-gray-100 text-gray-700" };
  const isAssembling = status === "assembling";

  // Compute totals from factMap
  const { factTotal, factWeight } = planItems.reduce(
    (acc, item) => {
      const entry = getCartProductById(item.productId);
      if (!entry) return acc;
      const { product, price } = entry;
      const qty = factMap[item.productId] ?? item.quantity;
      acc.factTotal += Math.round(price * qty);
      if (isWeightProduct(product)) acc.factWeight += qty;
      return acc;
    },
    { factTotal: 0, factWeight: 0 }
  );

  const save = async (overrides: Record<string, unknown> = {}) => {
    setSaving(true);
    const factItems: FactItem[] = planItems.map((item) => ({
      productId: item.productId,
      factQty: factMap[item.productId] ?? item.quantity,
    }));
    const body: Record<string, unknown> = {
      status,
      factItems,
      ...overrides,
    };
    const res = await fetch(`/api/orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const updated = await res.json();
    setSaving(false);
    onUpdate(updated);
    setStatus(updated.status);
  };

  const markAssembled = () =>
    save({
      status: "assembled",
      finalWeight: round1(factWeight),
      finalTotal: factTotal,
    });

  const addProduct = async (productId: string, qty: number) => {
    const currentItems = (order.items as OrderItem[]) ?? [];
    const merged = [...currentItems];
    const idx = merged.findIndex((i) => i.productId === productId);
    if (idx >= 0) {
      merged[idx] = { ...merged[idx], quantity: round1(merged[idx].quantity + qty) };
    } else {
      merged.push({ productId, quantity: qty });
    }
    const newTotal = merged.reduce((sum, item) => {
      const entry = getCartProductById(item.productId);
      return entry ? sum + Math.round(entry.price * item.quantity) : sum;
    }, 0);
    const res = await fetch(`/api/orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: merged, itemsCount: merged.length, estimatedTotal: newTotal }),
    });
    const updated = await res.json();
    onUpdate(updated);
    setFactMap((m) => ({ ...m, [productId]: qty }));
    setShowAddProduct(false);
  };

  return (
    <div className={`rounded-[16px] border p-4 ${order.linkedOrderId ? "border-orange-300 bg-orange-50/40" : "border-black/5 bg-white"}`}>
      {order.linkedOrderId && <LinkedOrderBadge orderId={order.linkedOrderId} />}
      {/* Header row */}
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <Link href={`/order/${order.id}`} className="font-mono text-xs text-muted hover:underline">
            {order.id}
          </Link>
          <p className="mt-0.5 text-sm font-semibold">{order.phone} · {order.address}</p>
          <p className="mt-0.5 text-xs text-muted">
            {new Date(order.createdAt).toLocaleString("ru")} · {order.itemsCount} позиций
          </p>
        </div>
        <span className={`shrink-0 rounded-[8px] px-2.5 py-1 text-xs font-bold ${info.color}`}>
          {info.label}
        </span>
      </div>

      {/* Suммary row */}
      <div className="mb-3 flex flex-wrap gap-4 text-sm">
        <div>
          <p className="text-xs text-muted">Примерная сумма</p>
          <p className="font-bold">~{Math.round(Number(order.estimatedTotal))} ₽</p>
        </div>
        {order.finalTotal && (
          <div>
            <p className="text-xs text-muted">Итоговая сумма</p>
            <p className="font-bold text-primary-dark">{Math.round(Number(order.finalTotal))} ₽</p>
          </div>
        )}
        {order.finalWeight && (
          <div>
            <p className="text-xs text-muted">Точный вес</p>
            <p className="font-bold">{round1(Number(order.finalWeight))} кг</p>
          </div>
        )}
        <button
          onClick={() => setShowItems((v) => !v)}
          className="ml-auto text-sm font-semibold text-primary-dark hover:underline"
        >
          {showItems ? "Скрыть состав ↑" : "Состав / план-факт ↓"}
        </button>
      </div>

      {/* Plan/fact table */}
      {showItems && (
        <FactTable
          planItems={planItems}
          factMap={factMap}
          onChange={(id, val) => setFactMap((m) => ({ ...m, [id]: val }))}
        />
      )}

      {/* Add product */}
      {!["done", "cancelled"].includes(order.status) && (
        <>
          <button
            onClick={() => setShowAddProduct((v) => !v)}
            className="mt-2 text-sm font-semibold text-primary-dark hover:underline"
          >
            {showAddProduct ? "Скрыть ↑" : "➕ Добавить товар к заказу"}
          </button>
          {showAddProduct && (
            <AdminCatalogPicker
              existingItems={(order.items as OrderItem[]) ?? []}
              onAdd={addProduct}
              onClose={() => setShowAddProduct(false)}
            />
          )}
        </>
      )}

      {/* Status controls */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-[10px] border border-black/10 px-3 py-2 text-sm outline-none focus:border-primary"
        >
          {STATUS_ORDER.map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]?.label ?? s}</option>
          ))}
        </select>
        <button
          onClick={() => save()}
          disabled={saving || status === order.status}
          className="rounded-[10px] bg-primary px-3 py-2 text-sm font-semibold text-white disabled:opacity-40"
        >
          {saving ? "…" : "Сохранить статус"}
        </button>
      </div>

      {/* Assembled block */}
      {(isAssembling || status === "assembling") && (
        <div className="mt-3 rounded-[12px] border border-emerald-200 bg-emerald-50 p-3">
          <p className="mb-1 text-xs font-bold text-emerald-700">📦 Готово к сборке</p>
          <p className="mb-2 text-xs text-emerald-700">
            Откройте состав выше, введите фактические значения. Система посчитает итого автоматически.
          </p>
          <div className="mb-2 flex gap-6 text-sm text-emerald-800">
            <span>⚖️ Факт вес: <b>{round1(factWeight)} кг</b></span>
            <span>💰 Факт сумма: <b>{factTotal} ₽</b></span>
          </div>
          <button
            onClick={markAssembled}
            disabled={saving}
            className="rounded-[10px] bg-emerald-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-40"
          >
            {saving ? "…" : "Собран → уведомить клиента"}
          </button>
        </div>
      )}

      {order.comment && (
        <p className="mt-2 text-xs text-muted">💬 {order.comment}</p>
      )}
    </div>
  );
}

export default function AdminClient({ orders: initialOrders }: { orders: Order[] }) {
  const [ordersList, setOrdersList] = useState(initialOrders);
  const [filter, setFilter] = useState<string>("active");

  const updateOrder = (updated: Order) => {
    setOrdersList((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
  };

  const active = ["new", "confirmed", "assembling", "assembled", "delivering"];
  const visible = ordersList.filter((o) =>
    filter === "active"    ? active.includes(o.status) :
    filter === "done"      ? o.status === "done" :
    filter === "cancelled" ? o.status === "cancelled" :
    true
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-extrabold">Панель заказов</h1>

      <div className="mb-4 flex gap-2">
        {[
          { key: "active",    label: `Активные (${ordersList.filter(o => active.includes(o.status)).length})` },
          { key: "done",      label: "Выполненные" },
          { key: "cancelled", label: "Отменённые" },
          { key: "all",       label: "Все" },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`rounded-[10px] px-3 py-2 text-sm font-semibold transition-colors ${
              filter === key ? "bg-primary text-white" : "bg-black/5 text-muted hover:bg-black/10"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="py-12 text-center text-muted">Нет заказов</p>
      ) : (
        <div className="flex flex-col gap-4">
          {visible.map((o) => (
            <OrderRow key={o.id} order={o} onUpdate={updateOrder} />
          ))}
        </div>
      )}
    </div>
  );
}
