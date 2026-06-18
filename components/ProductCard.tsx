"use client";

import Link from "next/link";
import {
  Product,
  formatQuantity,
  getDefaultQuantity,
  getQuantityStep,
} from "@/data/catalog";
import { useList } from "@/context/ListContext";

const round = (n: number) => Math.round(n * 10) / 10;

export default function ProductCard({ product }: { product: Product }) {
  const { getQuantity, setQuantity, addItem } = useList();
  const quantity = getQuantity(product.id);
  const step = getQuantityStep(product);
  const itemPrice = Math.round(product.price * quantity);

  return (
    <div className="flex flex-col rounded-[10px] border border-black/5 bg-card p-3 shadow-sm">
      <Link
        href={`/product/${product.id}`}
        className="flex aspect-square items-center justify-center rounded-[10px] bg-primary/5 text-5xl"
      >
        {product.icon}
      </Link>
      {product.seasonal && (
        <span className="mt-2 inline-flex w-fit items-center gap-1 rounded-[10px] bg-accent/20 px-2 py-0.5 text-xs font-semibold text-accent">
          🌱 сезон
        </span>
      )}
      <Link
        href={`/product/${product.id}`}
        className="mt-2 line-clamp-2 text-sm font-semibold hover:text-primary-dark"
      >
        {product.name}
      </Link>
      <p className="mt-1 text-sm text-muted">
        {product.price} ₽ / {product.unit}
      </p>

      <div className="mt-3">
        {quantity === 0 ? (
          <button
            onClick={() => addItem(product.id, getDefaultQuantity(product))}
            className="w-full rounded-[10px] bg-primary px-3 py-2 text-sm font-semibold text-white"
          >
            В список
          </button>
        ) : (
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between rounded-[10px] bg-primary/10 px-2 py-1">
              <button
                onClick={() => setQuantity(product.id, round(quantity - step))}
                className="h-7 w-7 rounded-[10px] bg-white text-primary-dark shadow-sm"
              >
                −
              </button>
              <span className="text-sm font-bold text-primary-dark">
                {formatQuantity(product, quantity)}
              </span>
              <button
                onClick={() => setQuantity(product.id, round(quantity + step))}
                className="h-7 w-7 rounded-[10px] bg-white text-primary-dark shadow-sm"
              >
                +
              </button>
            </div>
            <p className="text-center text-xs font-semibold text-primary-dark">
              {itemPrice} ₽
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
