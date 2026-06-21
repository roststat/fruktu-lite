"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { categories } from "@/data/catalog";

export default function CategoryMenu({ label }: { label?: React.ReactNode } = {}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  const goToCategory = (id: string | null) => {
    setOpen(false);
    router.push(id ? `/catalog?category=${id}` : "/catalog");
  };

  return (
    <div ref={rootRef} className={`relative ${label ? "w-full" : "shrink-0"}`}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-2 rounded-[10px] bg-primary px-4 py-3 text-base font-semibold text-white${label ? " w-full" : ""}`}
      >
        {label ?? (
          <>
            <span aria-hidden>☰</span>
            <span className="hidden sm:inline">Каталог</span>
          </>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 w-64 max-h-[70vh] overflow-y-auto rounded-[10px] bg-white p-2 shadow-xl">
          <button
            onClick={() => goToCategory(null)}
            className="w-full rounded-[10px] px-3 py-2 text-left text-sm font-semibold text-primary-dark hover:bg-primary/10"
          >
            Все товары
          </button>
          {categories.map((c) => (
            <div key={c.id}>
              <button
                onClick={() => goToCategory(c.id)}
                className="w-full rounded-[10px] px-3 py-2 text-left text-sm font-semibold text-primary-dark hover:bg-primary/10"
              >
                {c.icon} {c.name}
              </button>
              {c.subcategories && c.subcategories.length > 0 && (
                <div className="ml-4 flex flex-col border-l border-black/5 pl-2">
                  {c.subcategories.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => goToCategory(s.id)}
                      className="rounded-[10px] px-3 py-2 text-left text-sm font-medium text-muted hover:bg-primary/10"
                    >
                      {s.icon} {s.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
