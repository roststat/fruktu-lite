"use client";

import { useList } from "@/context/ListContext";
import {
  getProductById,
  formatQuantity,
  getDefaultQuantity,
  getQuantityStep,
} from "@/data/catalog";

const round = (n: number) => Math.round(n * 10) / 10;

export default function AddToListControl({
  productId,
}: {
  productId: string;
}) {
  const { getQuantity, setQuantity, addItem } = useList();
  const quantity = getQuantity(productId);
  const product = getProductById(productId);
  if (!product) return null;

  const step = getQuantityStep(product);
  const itemPrice = Math.round(product.price * quantity);

  if (quantity === 0) {
    return (
      <button
        onClick={() => addItem(productId, getDefaultQuantity(product))}
        className="w-full rounded-[10px] bg-primary px-4 py-3 text-sm font-bold text-white sm:w-fit"
      >
        Добавить в список
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex w-fit items-center gap-3 rounded-[10px] bg-primary/10 px-3 py-2">
        <button
          onClick={() => setQuantity(productId, round(quantity - step))}
          className="h-9 w-9 rounded-[10px] bg-white text-lg text-primary-dark shadow-sm"
        >
          −
        </button>
        <span className="w-16 text-center text-lg font-bold text-primary-dark">
          {formatQuantity(product, quantity)}
        </span>
        <button
          onClick={() => setQuantity(productId, round(quantity + step))}
          className="h-9 w-9 rounded-[10px] bg-white text-lg text-primary-dark shadow-sm"
        >
          +
        </button>
      </div>
      <span className="text-lg font-bold text-primary-dark">
        {itemPrice} ₽
      </span>
    </div>
  );
}
