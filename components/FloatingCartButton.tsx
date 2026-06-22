"use client";

import { useEffect, useRef, useState } from "react";
import { useList } from "@/context/ListContext";

export default function FloatingCartButton() {
  const { totalCount, totalQuantity, openList } = useList();
  const [justAdded, setJustAdded] = useState(false);
  const prevQuantityRef = useRef(totalQuantity);

  useEffect(() => {
    if (totalQuantity > prevQuantityRef.current) {
      setJustAdded(true);
      const timer = setTimeout(() => setJustAdded(false), 1500);
      prevQuantityRef.current = totalQuantity;
      return () => clearTimeout(timer);
    }
    prevQuantityRef.current = totalQuantity;
  }, [totalQuantity]);

  return (
    <div className="fixed bottom-5 right-5 z-40 flex items-center gap-2">
      <span
        className={`rounded-[10px] px-3 py-1.5 text-xs font-bold shadow-md transition-colors ${
          justAdded
            ? "bg-primary text-white"
            : "bg-white text-primary-dark"
        }`}
      >
        {justAdded ? "Добавлено ✓" : "Список"}
      </span>
      <button
        onClick={openList}
        aria-label="Открыть список покупок"
        className={`relative flex h-24 w-24 items-center justify-center rounded-full border-2 border-primary bg-white text-4xl shadow-lg shadow-primary/20 transition hover:border-primary-dark hover:bg-primary/15 hover:shadow-xl ${
          justAdded ? "animate-cart-bump" : ""
        }`}
      >
        <span aria-hidden>🛒</span>
        {totalCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-7 min-w-7 items-center justify-center rounded-[10px] border-2 border-white bg-tomato px-1 text-sm font-bold text-white">
            {totalCount}
          </span>
        )}
      </button>
    </div>
  );
}
