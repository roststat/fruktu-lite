"use client";

import { useState } from "react";
import {
  products as allProducts,
  categories,
  getCategoryById,
  productMatchesCategory,
  textMatchesQuery,
  isWeightProduct,
  ALL_CATEGORY_ID,
} from "@/data/catalog";
import Image from "next/image";

type OrderItem = { productId: string; quantity: number };

function round1(n: number) { return Math.round(n * 10) / 10; }

export default function AdminCatalogPicker({
  existingItems,
  onAdd,
  onClose,
}: {
  existingItems: OrderItem[];
  onAdd: (productId: string, qty: number) => Promise<void>;
  onClose: () => void;
}) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState<string | null>(null);

  const activeCatObj = activeCategory ? getCategoryById(activeCategory) : null;

  const visible = query.trim()
    ? allProducts.filter((p) => textMatchesQuery(p.name, query.trim().toLowerCase()))
    : activeCategory && activeCategory !== ALL_CATEGORY_ID
      ? allProducts.filter((p) => productMatchesCategory(p, activeCategory))
      : allProducts;

  const handleSelect = (productId: string) => {
    if (selected === productId) { setSelected(null); return; }
    setSelected(productId);
    const prod = allProducts.find((p) => p.id === productId)!;
    const existing = existingItems.find((i) => i.productId === productId);
    setQty(existing ? existing.quantity : isWeightProduct(prod) ? 0.5 : 1);
  };

  const handleAdd = async (productId: string) => {
    setAdding(productId);
    await onAdd(productId, qty);
    setSelected(null);
    setAdding(null);
  };

  return (
    <div className="mt-3 rounded-[12px] border border-primary/20 bg-primary/5 p-3">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-bold text-primary-dark">➕ Добавить товар к заказу</p>
        <button onClick={onClose} className="text-xs text-muted hover:text-foreground">✕ закрыть</button>
      </div>

      {/* Search */}
      <input
        type="search"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setActiveCategory(null); setSelected(null); }}
        placeholder="Поиск…"
        className="mb-3 w-full rounded-[10px] border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
      />

      {/* Category tabs */}
      {!query.trim() && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          <button
            onClick={() => { setActiveCategory(null); setSelected(null); }}
            className={`rounded-[8px] px-2.5 py-1 text-xs font-semibold transition-colors ${
              !activeCategory ? "bg-primary text-white" : "bg-white text-muted hover:bg-primary/10"
            }`}
          >
            Все
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => { setActiveCategory(c.id); setSelected(null); }}
              className={`rounded-[8px] px-2.5 py-1 text-xs font-semibold transition-colors ${
                activeCategory === c.id ? "bg-primary text-white" : "bg-white text-muted hover:bg-primary/10"
              }`}
            >
              {c.icon} {c.name}
            </button>
          ))}
        </div>
      )}

      {/* Subcategory tabs */}
      {!query.trim() && activeCatObj && activeCatObj.subcategories && activeCatObj.subcategories.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5 pl-2 border-l-2 border-primary/20">
          <button
            onClick={() => setActiveCategory(activeCatObj.id)}
            className={`rounded-[8px] px-2.5 py-1 text-xs font-medium transition-colors ${
              activeCategory === activeCatObj.id ? "bg-primary/20 text-primary-dark font-semibold" : "bg-white text-muted hover:bg-primary/10"
            }`}
          >
            Все {activeCatObj.name}
          </button>
          {activeCatObj.subcategories.map((s) => (
            <button
              key={s.id}
              onClick={() => { setSelected(null); setActiveCategory(s.id); }}
              className={`rounded-[8px] px-2.5 py-1 text-xs font-medium transition-colors ${
                activeCategory === s.id ? "bg-primary/20 text-primary-dark font-semibold" : "bg-white text-muted hover:bg-primary/10"
              }`}
            >
              {s.icon} {s.name}
            </button>
          ))}
        </div>
      )}

      {/* Product grid */}
      <div className="max-h-[420px] overflow-y-auto">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {visible.map((p) => {
            const isKg = isWeightProduct(p);
            const inOrder = existingItems.some((i) => i.productId === p.id);
            const isSelected = selected === p.id;

            return (
              <div
                key={p.id}
                className={`relative flex flex-col rounded-[12px] border bg-white transition-all ${
                  isSelected ? "border-primary shadow-md" : "border-black/5 hover:border-primary/30"
                }`}
              >
                {/* Image / icon */}
                <button
                  onClick={() => handleSelect(p.id)}
                  className="relative block aspect-square overflow-hidden rounded-t-[12px] bg-primary/5"
                >
                  {p.image ? (
                    <Image src={p.image} alt={p.name} fill sizes="150px" className="object-cover" />
                  ) : (
                    <span className="flex h-full items-center justify-center text-4xl">{p.icon}</span>
                  )}
                  {inOrder && (
                    <span className="absolute right-1 top-1 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-white">
                      ✓ в заказе
                    </span>
                  )}
                </button>

                <div className="flex flex-1 flex-col p-2">
                  <p className="line-clamp-2 text-xs font-semibold leading-snug">{p.name}</p>
                  <p className="mt-0.5 text-xs text-muted">{p.price} ₽/{p.unit}</p>

                  {isSelected ? (
                    <div className="mt-2 flex flex-col gap-1.5">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setQty((v) => Math.max(isKg ? 0.1 : 1, round1(v - (isKg ? 0.1 : 1))))}
                          className="h-7 w-7 rounded-[8px] bg-primary/10 text-primary-dark text-sm font-bold"
                        >−</button>
                        <input
                          type="number"
                          step={isKg ? "0.1" : "1"}
                          min={isKg ? "0.1" : "1"}
                          value={qty}
                          onChange={(e) => setQty(Number(e.target.value))}
                          className="w-14 rounded-[8px] border border-black/10 px-1 py-1 text-center text-sm outline-none focus:border-primary"
                        />
                        <button
                          onClick={() => setQty((v) => round1(v + (isKg ? 0.1 : 1)))}
                          className="h-7 w-7 rounded-[8px] bg-primary/10 text-primary-dark text-sm font-bold"
                        >+</button>
                      </div>
                      <p className="text-center text-xs font-bold text-primary-dark">
                        {Math.round(p.price * qty)} ₽
                      </p>
                      <button
                        onClick={() => handleAdd(p.id)}
                        disabled={adding === p.id}
                        className="rounded-[8px] bg-primary py-1.5 text-xs font-bold text-white disabled:opacity-60"
                      >
                        {adding === p.id ? "…" : inOrder ? "Обновить" : "Добавить"}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleSelect(p.id)}
                      className="mt-auto rounded-[8px] bg-primary/10 py-1.5 text-xs font-semibold text-primary-dark hover:bg-primary/20"
                    >
                      {inOrder ? "✓ изменить" : "Выбрать"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {visible.length === 0 && (
          <p className="py-8 text-center text-sm text-muted">Ничего не найдено</p>
        )}
      </div>
    </div>
  );
}
