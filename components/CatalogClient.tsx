"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  products,
  getCategoryById,
  productMatchesCategory,
  textMatchesQuery,
  CLEARANCE_CATEGORY_ID,
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

  const activeCategoryObj = activeCategory
    ? getCategoryById(activeCategory)
    : null;

  const filtered = searchQuery
    ? products.filter((p) => textMatchesQuery(p.name, searchQuery))
    : activeCategory
      ? products.filter((p) => productMatchesCategory(p, activeCategory))
      : products;

  const clearSearch = () => router.push("/catalog");

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

      {(searchQuery || activeCategoryObj) && (
        <div
          className="sticky z-30 -mx-4 mb-6 border-b border-black/5 bg-background/95 px-4 py-2 backdrop-blur"
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
                        : `${activeCategoryObj!.icon} ${activeCategoryObj!.name}`}
                    </span>
                  </span>
                }
              />
            </div>
            <button
              onClick={searchQuery ? clearSearch : () => setActiveCategory(null)}
              className="shrink-0 rounded-[10px] bg-primary/10 px-3 py-2 text-sm font-bold text-primary-dark"
            >
              Все ✕
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3">
        {filtered.map((product) =>
          activeCategory === CLEARANCE_CATEGORY_ID ? (
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
            : "В этой категории пока нет товаров."}
        </p>
      )}
    </div>
  );
}
