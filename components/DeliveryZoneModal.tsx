"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export default function DeliveryZoneModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="my-8 w-full max-w-md rounded-[10px] bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between">
          <h2 className="text-lg font-bold">Зона доставки</h2>
          <button
            onClick={onClose}
            className="rounded-[10px] p-1 text-muted hover:bg-black/5"
            aria-label="Закрыть"
          >
            ✕
          </button>
        </div>
        <p className="mb-4 text-sm text-muted">
          Доставляем по г. Ялта и ближайшим посёлкам в течение часа после
          подтверждения заказа.
        </p>
        <div className="flex h-48 items-center justify-center rounded-[10px] bg-primary/10 text-center text-sm text-primary-dark">
          Карта зоны доставки
          <br />
          (г. Ялта)
        </div>
        <p className="mt-4 text-sm text-muted">
          Стоимость доставки по Ялте — 300 ₽. При заказе от 3000 ₽ и общим
          весом до 15 кг доставка бесплатная.
        </p>
        <a
          href="tel:+79790474734"
          className="mt-4 block rounded-[10px] bg-primary px-4 py-2.5 text-center text-sm font-semibold text-white"
        >
          Уточнить по телефону: +7 979 047-47-34
        </a>
      </div>
    </div>,
    document.body
  );
}
