"use client";

import Link from "next/link";
import {
  Product,
  getDefaultQuantity,
  getQuantityStep,
  formatQuantity,
  getClearanceCartId,
} from "@/data/catalog";
import { useList } from "@/context/ListContext";

const round = (n: number) => Math.round(n * 10) / 10;

export default function ClearanceCard({ product }: { product: Product }) {
  const { getQuantity, setQuantity, addItem } = useList();
  if (!product.clearance) return null;

  const cartId = getClearanceCartId(product.id);
  const quantity = getQuantity(cartId);
  const step = getQuantityStep(product);
  const itemPrice = Math.round(product.clearance.price * quantity);

  return (
    <div className="flex flex-col">
      <Link href={`/product/${product.id}`} className="relative block aspect-square rounded-[16px] bg-white overflow-hidden">
        <div className="flex h-full items-center justify-center text-7xl sm:text-8xl">
          {product.icon}
        </div>
        <span className="absolute left-2 top-2 rounded-[20px] bg-green-600 px-2.5 py-1 text-[11px] font-bold text-white">
          🏷️ Зелёный ценник
        </span>
        <span className="absolute bottom-2 left-2 rounded-[8px] bg-white px-2.5 py-1 text-sm font-bold shadow-sm">
          <span className="text-green-700">{product.clearance.price} ₽</span>
          <span className="ml-1 text-xs text-muted line-through">{product.price} ₽</span>
          <span className="text-xs text-muted">/{product.unit}</span>
        </span>
      </Link>

      <div className="flex flex-1 flex-col p-3 pt-2">
        <Link
          href={`/product/${product.id}`}
          className="line-clamp-2 text-sm font-semibold leading-snug hover:text-primary-dark"
        >
          {product.name}
        </Link>
        <p className="mt-1 text-xs text-muted">{product.clearance.reason}</p>

        <div className="mt-auto pt-3">
          {quantity === 0 ? (
            <button
              onClick={() => addItem(cartId, getDefaultQuantity(product))}
              className="w-full rounded-[10px] bg-green-600 py-2.5 text-sm font-semibold text-white"
            >
              В список
            </button>
          ) : (
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between rounded-[10px] bg-green-600/10 px-2 py-1.5">
                <button
                  onClick={() => setQuantity(cartId, round(quantity - step))}
                  className="h-8 w-8 rounded-[8px] bg-white text-lg text-green-700 shadow-sm"
                >
                  −
                </button>
                <span className="text-sm font-bold text-green-700">
                  {formatQuantity(product, quantity)}
                </span>
                <button
                  onClick={() => setQuantity(cartId, round(quantity + step))}
                  className="h-8 w-8 rounded-[8px] bg-white text-lg text-green-700 shadow-sm"
                >
                  +
                </button>
              </div>
              <p className="text-center text-xs font-semibold text-green-700">
                {itemPrice} ₽
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
