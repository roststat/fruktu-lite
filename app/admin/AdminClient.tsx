"use client";

import { useState } from "react";
import Link from "next/link";
import { type Order } from "@/lib/db/schema";

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

function OrderRow({ order, onUpdate }: { order: Order; onUpdate: (o: Order) => void }) {
  const [status, setStatus] = useState(order.status);
  const [finalWeight, setFinalWeight] = useState(order.finalWeight ?? "");
  const [finalTotal, setFinalTotal] = useState(order.finalTotal ?? "");
  const [saving, setSaving] = useState(false);

  const info = STATUS_LABELS[status] ?? { label: status, color: "bg-gray-100 text-gray-700" };
  const isAssembling = status === "assembling";

  const save = async (overrides: Record<string, unknown> = {}) => {
    setSaving(true);
    const body: Record<string, unknown> = { status, ...overrides };
    if (finalWeight) body.finalWeight = Number(finalWeight);
    if (finalTotal) body.finalTotal = Number(finalTotal);
    const res = await fetch(`/api/orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const updated = await res.json();
    setSaving(false);
    onUpdate(updated);
    setStatus(updated.status);
    setFinalWeight(updated.finalWeight ?? "");
    setFinalTotal(updated.finalTotal ?? "");
  };

  const markAssembled = () => save({ status: "assembled" });

  return (
    <div className="rounded-[16px] border border-black/5 bg-white p-4">
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

      <div className="mb-3 flex flex-wrap gap-2">
        <div>
          <p className="mb-0.5 text-xs text-muted">Примерная сумма</p>
          <p className="text-sm font-bold">~{Math.round(Number(order.estimatedTotal))} ₽</p>
        </div>
        {order.finalTotal && (
          <div className="ml-4">
            <p className="mb-0.5 text-xs text-muted">Итоговая сумма</p>
            <p className="text-sm font-bold text-primary-dark">{Math.round(Number(order.finalTotal))} ₽</p>
          </div>
        )}
        {order.finalWeight && (
          <div className="ml-4">
            <p className="mb-0.5 text-xs text-muted">Точный вес</p>
            <p className="text-sm font-bold">{Math.round(Number(order.finalWeight) * 10) / 10} кг</p>
          </div>
        )}
      </div>

      {/* Смена статуса */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
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

      {/* Финальный вес и сумма — для assembled */}
      {(isAssembling || status === "assembled") && (
        <div className="rounded-[12px] border border-emerald-200 bg-emerald-50 p-3">
          <p className="mb-2 text-xs font-bold text-emerald-700">📦 Внести точные данные после сборки</p>
          <div className="flex flex-wrap gap-2">
            <div>
              <label className="mb-1 block text-xs text-muted">Точный вес (кг)</label>
              <input
                type="number"
                step="0.1"
                value={finalWeight}
                onChange={(e) => setFinalWeight(e.target.value)}
                placeholder="напр. 4.3"
                className="w-28 rounded-[10px] border border-black/10 px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">Итоговая сумма (₽)</label>
              <input
                type="number"
                value={finalTotal}
                onChange={(e) => setFinalTotal(e.target.value)}
                placeholder="напр. 1850"
                className="w-28 rounded-[10px] border border-black/10 px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={markAssembled}
                disabled={saving || !finalWeight || !finalTotal}
                className="rounded-[10px] bg-emerald-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-40"
              >
                {saving ? "…" : "Собран → уведомить клиента"}
              </button>
            </div>
          </div>
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
    filter === "active" ? active.includes(o.status) :
    filter === "done" ? o.status === "done" :
    filter === "cancelled" ? o.status === "cancelled" :
    true
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-extrabold">Панель заказов</h1>

      <div className="mb-4 flex gap-2">
        {[
          { key: "active", label: "Активные" },
          { key: "done",   label: "Выполненные" },
          { key: "cancelled", label: "Отменённые" },
          { key: "all",    label: "Все" },
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
