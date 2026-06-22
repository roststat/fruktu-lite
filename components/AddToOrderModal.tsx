"use client";

import { Suspense, useState } from "react";
import { useList } from "@/context/ListContext";
import CatalogClient from "./CatalogClient";

export default function AddToOrderModal({
  onClose,
  onConfirm,
}: {
  onClose: () => void;
  onConfirm: (items: { productId: string; quantity: number }[]) => Promise<void>;
}) {
  const { items, totalCount, totalPrice, clearList } = useList();
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    setSubmitting(true);
    await onConfirm(items);
    clearList();
    setSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <div className="flex items-center justify-between border-b border-black/5 bg-white px-4 py-3">
        <h2 className="text-lg font-bold">Добавить к заказу</h2>
        <button onClick={onClose} className="rounded-[10px] p-1 text-muted hover:bg-black/5">✕</button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <Suspense fallback={null}>
          <CatalogClient embedded />
        </Suspense>
      </div>

      {totalCount > 0 && (
        <div className="border-t border-black/5 bg-white p-4">
          <button
            onClick={handleConfirm}
            disabled={submitting}
            className="w-full rounded-[10px] bg-primary py-3 text-sm font-bold text-white disabled:opacity-60"
          >
            {submitting ? "Добавляем…" : `Добавить к заказу (${totalCount} · ${totalPrice} ₽)`}
          </button>
        </div>
      )}
    </div>
  );
}
