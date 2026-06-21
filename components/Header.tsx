"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import SearchBar from "./SearchBar";
import CategoryMenu from "./CategoryMenu";
import DeliveryZoneModal from "./DeliveryZoneModal";

export default function Header() {
  const [zoneOpen, setZoneOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const updateHeight = () => {
      document.documentElement.style.setProperty("--header-height", `${el.offsetHeight}px`);
    };
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-40 border-b border-black/5 bg-background/95 backdrop-blur"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <Link href="/catalog" className="flex items-center gap-2 shrink-0">
            <span className="text-2xl">🧺</span>
            <span className="flex flex-col leading-tight">
              <span className="text-lg font-extrabold text-primary-dark">Схожу на рынок</span>
              <span className="flex items-center gap-1 rounded-[10px] bg-accent/15 px-2 py-0.5 text-[11px] font-bold text-accent">
                <span aria-hidden>🏅</span>
                Честный продавец
              </span>
            </span>
          </Link>

          <div className="flex items-center gap-2 shrink-0">
            <span className="hidden rounded-[10px] bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary-dark sm:inline">
              г. Ялта
            </span>
            <button
              onClick={() => setZoneOpen(true)}
              className="hidden rounded-[10px] bg-accent/20 px-3 py-1.5 text-sm font-semibold text-accent hover:bg-accent/30 sm:inline-block"
            >
              Зона доставки
            </button>
            <a
              href="tel:+79790474734"
              className="rounded-[10px] bg-primary px-3 py-1.5 text-sm font-semibold text-white"
            >
              +7 979 047-47-34
            </a>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <CategoryMenu />
          <SearchBar />
        </div>
      </div>

      <DeliveryZoneModal open={zoneOpen} onClose={() => setZoneOpen(false)} />
    </header>
  );
}
