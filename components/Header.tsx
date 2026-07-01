"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import SearchBar from "./SearchBar";
import CategoryMenu from "./CategoryMenu";
import DeliveryZoneModal from "./DeliveryZoneModal";
import LogoIcon from "./LogoIcon";

export type ActiveOrderInfo = { id: string; status: string };

export function saveActiveOrder(info: ActiveOrderInfo | null) {
  if (info && !["done", "cancelled"].includes(info.status)) {
    localStorage.setItem("fruktu_active_order", JSON.stringify(info));
  } else {
    localStorage.removeItem("fruktu_active_order");
  }
}

function useActiveOrder(isOrderPage: boolean) {
  const [activeOrder, setActiveOrder] = useState<ActiveOrderInfo | null>(null);
  useEffect(() => {
    if (isOrderPage) return;
    try {
      const raw = localStorage.getItem("fruktu_active_order");
      setActiveOrder(raw ? JSON.parse(raw) : null);
    } catch { setActiveOrder(null); }
  }, [isOrderPage]);
  return activeOrder;
}

export default function Header() {
  const [zoneOpen, setZoneOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const pathname = usePathname();
  const isOrderPage = pathname?.startsWith("/order/");
  const activeOrder = useActiveOrder(isOrderPage);

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
            <LogoIcon size={40} />
            <span className="flex flex-col leading-tight">
              <span className="text-lg font-extrabold text-primary-dark">Схожу на рынок</span>
              <span className="flex items-center gap-1 text-[11px] font-semibold text-accent">
                <span aria-hidden>🏅</span>
                Честный продавец
              </span>
            </span>
          </Link>

          <div className="flex items-center gap-3 shrink-0">
            <span className="hidden text-sm font-semibold text-foreground sm:inline">
              г. Ялта
            </span>
            <button
              onClick={() => setZoneOpen(true)}
              className="hidden text-sm font-semibold text-accent hover:underline sm:inline"
            >
              Зона доставки
            </button>
            <a
              href="tel:+79790474734"
              className="flex items-center gap-1.5 text-sm font-semibold text-primary-dark underline underline-offset-2 hover:text-primary"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 shrink-0">
                <path fillRule="evenodd" d="M1.5 4.5a3 3 0 0 1 3-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 0 1-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 0 0 6.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 0 1 1.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 0 1-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5Z" clipRule="evenodd" />
              </svg>
              +7 979 047-47-34
            </a>
          </div>
        </div>

        {!isOrderPage && activeOrder && (
          <Link
            href={`/order/${activeOrder.id}`}
            className="flex items-center justify-between gap-2 rounded-[10px] bg-primary/10 px-3 py-2 text-sm font-semibold text-primary-dark hover:bg-primary/20"
          >
            <span>🧺 Заказ в работе — вернуться к заказу</span>
            <span aria-hidden>→</span>
          </Link>
        )}

        {!isOrderPage && (
          <div className="flex items-center gap-2">
            <CategoryMenu />
            <SearchBar />
          </div>
        )}
      </div>

      <DeliveryZoneModal open={zoneOpen} onClose={() => setZoneOpen(false)} />
    </header>
  );
}
