"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useList } from "@/context/ListContext";
import { getCartProductById, formatQuantity, getQuantityStep } from "@/data/catalog";

const round = (n: number) => Math.round(n * 10) / 10;

const FREE_DELIVERY_THRESHOLD = 3000;
const DELIVERY_COST = 300;
const FREE_DELIVERY_WEIGHT_LIMIT = 15;

export default function ListDrawer() {
  const router = useRouter();
  const {
    items,
    isOpen,
    closeList,
    setQuantity,
    totalPrice,
    totalCount,
    totalWeight,
    removedItems,
    restoreItem,
    clearRemoved,
    clearList,
  } = useList();

  const [showRemoved, setShowRemoved] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [isOpen]);

  // reset form when drawer opens fresh
  useEffect(() => {
    if (isOpen) setShowForm(false);
  }, [isOpen]);

  if (!isOpen) return null;

  const isOverWeightLimit = totalWeight > FREE_DELIVERY_WEIGHT_LIMIT;
  const deliveryCost =
    items.length === 0 ? 0
    : isOverWeightLimit ? DELIVERY_COST
    : totalPrice >= FREE_DELIVERY_THRESHOLD ? 0
    : DELIVERY_COST;
  const grandTotal = totalPrice + deliveryCost;

  const handleSubmit = async () => {
    if (!phone.trim() || !address.trim()) return;
    setSubmitting(true);
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items,
        itemsCount: totalCount,
        estimatedTotal: grandTotal,
        phone: phone.trim(),
        address: address.trim(),
        comment: comment.trim() || null,
      }),
    });
    const data = await res.json();
    clearList?.();
    setSubmitting(false);
    closeList();
    router.push(`/order/${data.id}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
      <div className="absolute inset-0" onClick={closeList} aria-hidden="true" />
      <div className="relative flex h-full w-full max-w-md flex-col bg-white shadow-xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-black/5 p-4">
          <h2 className="text-lg font-bold">Мой список</h2>
          <div className="flex items-center gap-3">
            {removedItems.length > 0 && (
              <button
                onClick={() => setShowRemoved((v) => !v)}
                className="rounded-[10px] bg-black/5 px-3 py-1 text-xs font-semibold text-muted hover:bg-black/10"
              >
                Удалённые ({removedItems.length})
              </button>
            )}
            <button onClick={closeList} className="rounded-[10px] p-1 text-muted hover:bg-black/5">✕</button>
          </div>
        </div>

        {/* Restored items */}
        {showRemoved && removedItems.length > 0 && (
          <div className="border-b border-black/5 bg-background p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-semibold text-muted">Недавно удалённые</p>
              <button onClick={() => { clearRemoved(); setShowRemoved(false); }} className="text-xs text-muted underline">Очистить</button>
            </div>
            <ul className="flex flex-col gap-2">
              {removedItems.map((item) => {
                const entry = getCartProductById(item.productId);
                if (!entry) return null;
                return (
                  <li key={item.productId} className="flex items-center gap-3 rounded-[10px] border border-black/5 bg-white p-2">
                    <span className="text-xl">{entry.product.icon}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{entry.product.name}</p>
                      <p className="text-xs text-muted">{formatQuantity(entry.product, item.quantity)}</p>
                    </div>
                    <button onClick={() => restoreItem(item.productId)} className="shrink-0 rounded-[10px] bg-primary/10 px-3 py-1 text-xs font-bold text-primary-dark">
                      Вернуть
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Items list */}
        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-muted">
              <span className="text-4xl">🧺</span>
              <p>Список пока пуст.</p>
              <p className="text-sm">Добавляйте товары из каталога — мы сходим на рынок и купим всё для вас.</p>
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {items.map((item) => {
                const entry = getCartProductById(item.productId);
                if (!entry) return null;
                const { product, price, isClearance } = entry;
                const step = getQuantityStep(product);
                const itemPrice = Math.round(price * item.quantity);
                return (
                  <li key={item.productId} className={`flex items-center gap-3 rounded-[10px] border p-3 ${isClearance ? "border-green-600/20 bg-green-600/5" : "border-black/5"}`}>
                    <span className="text-2xl">{product.icon}</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{product.name}</p>
                      {isClearance && (
                        <span className="mb-0.5 inline-flex w-fit items-center gap-1 rounded-[10px] bg-green-600 px-1.5 py-0.5 text-[10px] font-bold text-white">🏷️ Зелёный ценник</span>
                      )}
                      <p className="text-xs text-muted">{price} ₽/{product.unit} · {itemPrice} ₽</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setQuantity(item.productId, round(item.quantity - step))} className="h-7 w-7 rounded-[10px] bg-primary/10 text-primary-dark">−</button>
                      <span className="w-12 text-center text-sm font-semibold">{formatQuantity(product, item.quantity)}</span>
                      <button onClick={() => setQuantity(item.productId, round(item.quantity + step))} className="h-7 w-7 rounded-[10px] bg-primary/10 text-primary-dark">+</button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-black/5 p-4">
            {/* Totals */}
            <div className="mb-1 flex items-center justify-between text-sm text-muted">
              <span>Товаров: {totalCount}</span>
              <span>{totalPrice} ₽</span>
            </div>
            <div className="mb-1 flex items-center justify-between text-sm text-muted">
              <span>Общий вес</span>
              <span className={isOverWeightLimit ? "font-semibold text-tomato" : ""}>~{round(totalWeight)} кг</span>
            </div>
            <div className="mb-1 flex items-center justify-between text-sm text-muted">
              <span>Доставка по Ялте</span>
              {deliveryCost === 0
                ? <span className="font-semibold text-primary-dark">Бесплатно 🎉</span>
                : <span>+{DELIVERY_COST} ₽</span>}
            </div>
            <div className="mb-3 flex items-center justify-between border-t border-black/5 pt-2">
              <span className="text-sm text-muted">Итого с доставкой<br /><span className="text-xs">после сборки сумма может уточниться</span></span>
              <span className="text-xl font-extrabold text-primary-dark">{grandTotal} ₽</span>
            </div>

            {/* Order form */}
            {showForm ? (
              <div className="flex flex-col gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-muted">Телефон *</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+7 900 000-00-00"
                    className="w-full rounded-[10px] border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-muted">Адрес доставки *</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="ул. Пушкина, д. 1, кв. 5"
                    className="w-full rounded-[10px] border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-muted">Комментарий</label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Время доставки, особые пожелания…"
                    rows={2}
                    className="w-full rounded-[10px] border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-primary"
                  />
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !phone.trim() || !address.trim()}
                  className="w-full rounded-[10px] bg-primary py-3 text-sm font-bold text-white disabled:opacity-50"
                >
                  {submitting ? "Оформляем…" : "Отправить заказ"}
                </button>
                <button onClick={() => setShowForm(false)} className="text-center text-xs text-muted hover:underline">
                  Назад
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowForm(true)}
                className="w-full rounded-[10px] bg-primary py-3 text-sm font-bold text-white"
              >
                Оформить заказ
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
