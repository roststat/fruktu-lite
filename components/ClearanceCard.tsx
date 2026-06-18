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
    <div className="flex flex-col rounded-[10px] border border-green-600/20 bg-card p-3 shadow-sm">
      <Link
        href={`/product/${product.id}`}
        className="flex aspect-square items-center justify-center rounded-[10px] bg-green-600/5 text-5xl"
      >
        {product.icon}
      </Link>
      <span className="mt-2 inline-flex w-fit items-center gap-1 rounded-[10px] bg-green-600 px-2 py-0.5 text-xs font-bold text-white">
        🏷️ Зелёный ценник
      </span>
      <Link
        href={`/product/${product.id}`}
        className="mt-2 line-clamp-2 text-sm font-semibold hover:text-primary-dark"
      >
        {product.name}
      </Link>
      <p className="mt-1 text-xs text-muted">{product.clearance.reason}</p>
      <p className="mt-1 text-sm">
        <span className="font-bold text-green-700">
          {product.clearance.price} ₽
        </span>{" "}
        <span className="text-muted line-through">
          {product.price} ₽
        </span>{" "}
        / {product.unit}
      </p>

      <div className="mt-3">
        {quantity === 0 ? (
          <button
            onClick={() => addItem(cartId, getDefaultQuantity(product))}
            className="w-full rounded-[10px] bg-green-600 px-3 py-2 text-sm font-semibold text-white"
          >
            В список
          </button>
        ) : (
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between rounded-[10px] bg-green-600/10 px-2 py-1">
              <button
                onClick={() => setQuantity(cartId, round(quantity - step))}
                className="h-7 w-7 rounded-[10px] bg-white text-green-700 shadow-sm"
              >
                −
              </button>
              <span className="text-sm font-bold text-green-700">
                {formatQuantity(product, quantity)}
              </span>
              <button
                onClick={() => setQuantity(cartId, round(quantity + step))}
                className="h-7 w-7 rounded-[10px] bg-white text-green-700 shadow-sm"
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
  );
}
