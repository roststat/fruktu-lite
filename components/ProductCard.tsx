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
    <div className="flex flex-col rounded-[16px] border border-black/5 bg-card overflow-hidden">
      <Link href={`/product/${product.id}`} className="relative block aspect-square bg-white">
        <div className="flex h-full items-center justify-center text-7xl sm:text-8xl">
          {product.icon}
        </div>
        {product.seasonal && (
          <span className="absolute left-2 top-2 rounded-[20px] bg-accent/90 px-2.5 py-1 text-[11px] font-bold text-white">
            🌱 сезон
          </span>
        )}
        <span className="absolute bottom-2 left-2 rounded-[8px] bg-white px-2.5 py-1 text-sm font-bold text-foreground shadow-sm">
          {product.price} ₽/{product.unit}
        </span>
      </Link>

      <div className="flex flex-1 flex-col p-3 pt-2">
        <Link
          href={`/product/${product.id}`}
          className="line-clamp-2 text-sm font-semibold leading-snug hover:text-primary-dark"
        >
          {product.name}
        </Link>

        <div className="mt-auto pt-3">
          {quantity === 0 ? (
            <button
              onClick={() => addItem(product.id, getDefaultQuantity(product))}
              className="w-full rounded-[10px] bg-primary py-2.5 text-sm font-semibold text-white"
            >
              В список
            </button>
          ) : (
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between rounded-[10px] bg-primary/10 px-2 py-1.5">
                <button
                  onClick={() => setQuantity(product.id, round(quantity - step))}
                  className="h-8 w-8 rounded-[8px] bg-white text-lg text-primary-dark shadow-sm"
                >
                  −
                </button>
                <span className="text-sm font-bold text-primary-dark">
                  {formatQuantity(product, quantity)}
                </span>
                <button
                  onClick={() => setQuantity(product.id, round(quantity + step))}
                  className="h-8 w-8 rounded-[8px] bg-white text-lg text-primary-dark shadow-sm"
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
    </div>
  );
}
