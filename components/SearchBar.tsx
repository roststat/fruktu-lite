"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { categories, products, textMatchesQuery } from "@/data/catalog";

export default function SearchBar({ className = "" }: { className?: string }) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return { products: [], categories: [] };

    const matchedProducts = products
      .filter((p) => textMatchesQuery(p.name, q))
      .slice(0, 5);

    const matchedCategories = categories
      .filter((c) => textMatchesQuery(c.name, q))
      .slice(0, 3);

    return { products: matchedProducts, categories: matchedCategories };
  }, [query]);

  useEffect(() => {
    if (!focused) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [focused]);

  const hasSuggestions =
    focused &&
    query.trim().length > 0 &&
    (suggestions.products.length > 0 || suggestions.categories.length > 0);

  const goToCategory = (categoryId: string) => {
    setQuery("");
    setFocused(false);
    router.push(`/catalog?category=${categoryId}`);
  };

  const goToProduct = (productName: string) => {
    setQuery("");
    setFocused(false);
    router.push(`/catalog?q=${encodeURIComponent(productName)}`);
  };

  const goToSearch = (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    setQuery("");
    setFocused(false);
    router.push(`/catalog?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setFocused(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter") goToSearch(query);
        }}
        placeholder="Название товара или категории"
        className="w-full rounded-[10px] border border-black/10 bg-white px-4 py-2.5 text-sm shadow-sm outline-none focus:border-primary"
      />
      {hasSuggestions && (
        <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-[10px] border border-black/5 bg-white shadow-lg">
          {suggestions.categories.length > 0 && (
            <div className="border-b border-black/5 p-2">
              <p className="px-2 pb-1 text-xs font-semibold uppercase text-muted">
                Категории
              </p>
              {suggestions.categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => goToCategory(c.id)}
                  className="flex w-full items-center gap-2 rounded-[10px] px-2 py-2 text-left text-sm hover:bg-primary/5"
                >
                  <span className="text-lg">{c.icon}</span>
                  <span>{c.name}</span>
                </button>
              ))}
            </div>
          )}
          {suggestions.products.length > 0 && (
            <div className="p-2">
              <p className="px-2 pb-1 text-xs font-semibold uppercase text-muted">
                Товары
              </p>
              {suggestions.products.map((p) => (
                <button
                  key={p.id}
                  onClick={() => goToProduct(p.name)}
                  className="flex w-full items-center justify-between gap-2 rounded-[10px] px-2 py-2 text-left text-sm hover:bg-primary/5"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-lg">{p.icon}</span>
                    <span>{p.name}</span>
                  </span>
                  <span className="text-muted">
                    {p.price} ₽/{p.unit}
                  </span>
                </button>
              ))}
            </div>
          )}
          <button
            onClick={() => goToSearch(query)}
            className="flex w-full items-center justify-center gap-2 border-t border-black/5 px-2 py-2.5 text-sm font-semibold text-primary-dark hover:bg-primary/5"
          >
            🔍 Показать все товары по запросу «{query.trim()}»
          </button>
        </div>
      )}
    </div>
  );
}
