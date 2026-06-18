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
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3">
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

          <div className="hidden flex-1 items-center gap-2 md:flex md:max-w-md">
            <CategoryMenu />
            <SearchBar />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden items-center gap-2 md:flex">
              <span className="rounded-[10px] bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary-dark">
                г. Ялта
              </span>
              <button
                onClick={() => setZoneOpen(true)}
                className="rounded-[10px] bg-accent/20 px-3 py-1.5 text-sm font-semibold text-accent hover:bg-accent/30"
              >
                Зона доставки
              </button>
            </div>
            <a
              href="tel:+79790474734"
              className="hidden rounded-[10px] bg-primary px-3 py-1.5 text-sm font-semibold text-white md:inline-block"
            >
              +7 979 047-47-34
            </a>
          </div>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <span className="shrink-0 rounded-[10px] bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary-dark">
            г. Ялта
          </span>
          <button
            onClick={() => setZoneOpen(true)}
            className="shrink-0 rounded-[10px] bg-accent/20 px-3 py-1.5 text-xs font-semibold text-accent"
          >
            Зона доставки
          </button>
          <a
            href="tel:+79790474734"
            className="ml-auto shrink-0 rounded-[10px] bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary-dark"
          >
            +7 979 047-47-34
          </a>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <CategoryMenu />
          <SearchBar />
        </div>
      </div>

      <DeliveryZoneModal open={zoneOpen} onClose={() => setZoneOpen(false)} />
    </header>
  );
}
