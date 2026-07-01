"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  products,
  categories,
  getCategoryById,
  productMatchesCategory,
  textMatchesQuery,
  CLEARANCE_CATEGORY_ID,
  ALL_CATEGORY_ID,
} from "@/data/catalog";
import ProductCard from "./ProductCard";
import ClearanceCard from "./ClearanceCard";
import CategoryMenu from "./CategoryMenu";

export default function CatalogClient({ embedded = false }: { embedded?: boolean } = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlCategory = embedded ? null : searchParams.get("category");
  const urlSearchQuery = embedded ? "" : (searchParams.get("q")?.trim().toLowerCase() ?? "");

  // Embedded mode uses local state; non-embedded reads directly from URL (no sync lag)
  const [embeddedCategory, setEmbeddedCategory] = useState<string | null>(null);
  const [embeddedSearch, setEmbeddedSearch] = useState("");
  const activeCategory = embedded ? embeddedCategory : urlCategory;
  const searchQuery = embedded ? embeddedSearch.trim().toLowerCase() : urlSearchQuery;

  const [clearanceOn, setClearanceOn] = useState(false);
  const [discountOn, setDiscountOn] = useState(false);

  const handleCategorySelect = (id: string) => {
    setClearanceOn(false);
    setDiscountOn(false);
    if (embedded) setEmbeddedCategory(id);
    else router.push(`/catalog?category=${id}`);
  };

  const isDefaultCategory = !activeCategory || activeCategory === ALL_CATEGORY_ID;
  const activeCategoryObj = activeCategory ? getCategoryById(activeCategory) : null;

  const base = searchQuery
    ? products.filter((p) => textMatchesQuery(p.name, searchQuery))
    : activeCategory && activeCategory !== ALL_CATEGORY_ID
      ? products.filter((p) => productMatchesCategory(p, activeCategory))
      : products;

  const filtered = base.filter((p) => {
    if (clearanceOn && !p.clearance) return false;
    if (discountOn && !p.discount) return false;
    return true;
  });

  const showClearanceCards = clearanceOn || activeCategory === CLEARANCE_CATEGORY_ID;

  const clearSearch = () => router.push("/catalog");

  const showAllClearance = () => {
    if (embedded) setEmbeddedCategory(ALL_CATEGORY_ID);
    else router.push(`/catalog?category=${ALL_CATEGORY_ID}`);
  };

  const showAllDiscount = () => {
    if (embedded) setEmbeddedCategory(ALL_CATEGORY_ID);
    else router.push(`/catalog?category=${ALL_CATEGORY_ID}`);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      {!embedded && <h1 className="mb-4 text-2xl font-extrabold">Каталог</h1>}

      <div
        className="sticky z-30 -mx-4 mb-4 border-b border-black/5 bg-background/95 px-4 py-2 backdrop-blur"
        style={{ top: embedded ? "0px" : "var(--header-height, 0px)" }}
      >
        {embedded && (
          <input
            type="search"
            value={embeddedSearch}
            onChange={(e) => setEmbeddedSearch(e.target.value)}
            placeholder="Поиск товара…"
            className="mb-2 w-full rounded-[10px] border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
          />
        )}
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <CategoryMenu
              label={
                <span className="flex w-full items-center gap-2 truncate">
                  <span aria-hidden>☰</span>
                  <span className="truncate">
                    {searchQuery
                      ? `🔍 «${searchQuery}»`
                      : activeCategoryObj
                        ? `${activeCategoryObj.icon} ${activeCategoryObj.name}`
                        : "🛒 Все товары"}
                  </span>
                </span>
              }
              onSelectCategory={handleCategorySelect}
            />
          </div>
          {(searchQuery || (activeCategory && activeCategory !== ALL_CATEGORY_ID)) && (
            <button
              onClick={() => {
                if (embedded) { setEmbeddedSearch(""); setEmbeddedCategory(null); setClearanceOn(false); setDiscountOn(false); }
                else if (searchQuery) clearSearch();
                else router.push("/catalog");
              }}
              className="shrink-0 rounded-[10px] bg-primary/10 px-3 py-2 text-sm font-bold text-primary-dark"
            >
              Все ✕
            </button>
          )}
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <button
          onClick={() => setDiscountOn((v) => !v)}
          className={`rounded-[10px] px-3 py-2 text-sm font-bold transition-colors ${
            discountOn
              ? "bg-tomato text-white"
              : "bg-tomato/10 text-tomato hover:bg-tomato/15"
          }`}
        >
          🔥 СКИДКИ
        </button>
        <button
          onClick={() => setClearanceOn((v) => !v)}
          className={`rounded-[10px] px-3 py-2 text-sm font-bold transition-colors ${
            clearanceOn
              ? "bg-green-600 text-white"
              : "bg-green-600/10 text-green-700 hover:bg-green-600/15"
          }`}
        >
          🏷️ УЦЕНКА
        </button>

        {discountOn && !isDefaultCategory && (
          <button
            onClick={showAllDiscount}
            className="ml-1 text-sm font-semibold text-primary-dark underline hover:text-primary"
          >
            Показать все товары со скидкой
          </button>
        )}
        {clearanceOn && !isDefaultCategory && (
          <button
            onClick={showAllClearance}
            className="ml-1 text-sm font-semibold text-primary-dark underline hover:text-primary"
          >
            Показать все товары с уценкой
          </button>
        )}
      </div>

      {isDefaultCategory && !searchQuery && !clearanceOn && !discountOn ? (
        categories.map((cat) => {
          const catProducts = filtered.filter((p) => productMatchesCategory(p, cat.id));
          if (catProducts.length === 0) return null;
          return (
            <div key={cat.id} className="mb-8">
              <h2 className="mb-3 flex items-center gap-2 text-lg font-extrabold text-foreground">
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
              </h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {catProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          );
        })
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filtered.map((product) =>
            showClearanceCards ? (
              <ClearanceCard key={product.id} product={product} />
            ) : (
              <ProductCard key={product.id} product={product} />
            )
          )}
        </div>
      )}

      {filtered.length === 0 && (
        <p className="py-12 text-center text-muted">
          {searchQuery
            ? "По вашему запросу ничего не найдено."
            : "Подходящих товаров не нашлось — попробуйте отключить фильтры."}
        </p>
      )}
    </div>
  );
}
