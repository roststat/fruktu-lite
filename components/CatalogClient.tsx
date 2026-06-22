"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  products,
  getCategoryById,
  productMatchesCategory,
  textMatchesQuery,
  CLEARANCE_CATEGORY_ID,
  ALL_CATEGORY_ID,
} from "@/data/catalog";
import ProductCard from "./ProductCard";
import ClearanceCard from "./ClearanceCard";
import ClearanceSection from "./ClearanceSection";
import CategoryMenu from "./CategoryMenu";

export default function CatalogClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category");
  const searchQuery = searchParams.get("q")?.trim().toLowerCase() ?? "";
  const [activeCategory, setActiveCategory] = useState<string | null>(
    initialCategory
  );
  const [clearanceOn, setClearanceOn] = useState(false);

  const isDefaultCategory = !activeCategory || activeCategory === ALL_CATEGORY_ID;
  const activeCategoryObj = activeCategory
    ? getCategoryById(activeCategory)
    : null;

  const base = searchQuery
    ? products.filter((p) => textMatchesQuery(p.name, searchQuery))
    : activeCategory && activeCategory !== ALL_CATEGORY_ID
      ? products.filter((p) => productMatchesCategory(p, activeCategory))
      : products;

  const filtered = base.filter((p) => {
    if (clearanceOn && !p.clearance) return false;
    return true;
  });

  const showClearanceCards = clearanceOn || activeCategory === CLEARANCE_CATEGORY_ID;

  const clearSearch = () => router.push("/catalog");

  const showAllClearance = () => {
    setActiveCategory(ALL_CATEGORY_ID);
    router.push(`/catalog?category=${ALL_CATEGORY_ID}`);
  };

  useEffect(() => {
    setActiveCategory(initialCategory);
  }, [initialCategory]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="mb-4 text-2xl font-extrabold">Каталог</h1>

      {!searchQuery && !activeCategoryObj && (
        <div className="mb-6">
          <ClearanceSection />
        </div>
      )}

      <div
        className="sticky z-30 -mx-4 mb-4 border-b border-black/5 bg-background/95 px-4 py-2 backdrop-blur"
        style={{ top: "var(--header-height, 0px)" }}
      >
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
            />
          </div>
          {(searchQuery || (activeCategory && activeCategory !== ALL_CATEGORY_ID)) && (
            <button
              onClick={searchQuery ? clearSearch : () => setActiveCategory(null)}
              className="shrink-0 rounded-[10px] bg-primary/10 px-3 py-2 text-sm font-bold text-primary-dark"
            >
              Все ✕
            </button>
          )}
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <button
          onClick={() => setClearanceOn((v) => !v)}
          className={`rounded-[10px] px-3 py-2 text-sm font-bold transition-colors ${
            clearanceOn
              ? "bg-green-600 text-white"
              : "bg-green-600/10 text-green-700 hover:bg-green-600/15"
          }`}
        >
          🏷️ {isDefaultCategory ? "ЗЕЛЁНЫЙ КАТАЛОГ" : "УЦЕНКА"}
        </button>

        {clearanceOn && !isDefaultCategory && (
          <button
            onClick={showAllClearance}
            className="ml-1 text-sm font-semibold text-primary-dark underline hover:text-primary"
          >
            Показать все товары с уценкой
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3">
        {filtered.map((product) =>
          showClearanceCards ? (
            <ClearanceCard key={product.id} product={product} />
          ) : (
            <ProductCard key={product.id} product={product} />
          )
        )}
      </div>

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
