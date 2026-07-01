"use client";

import Link from "next/link";
import Image from "next/image";
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
  const effectivePrice = product.discount ? product.discount.price : product.price;
  const itemPrice = Math.round(effectivePrice * quantity);

  return (
    <div className="flex flex-col">
      {/* Фото */}
      <Link href={`/product/${product.id}`} className="relative block aspect-square rounded-[16px] bg-white overflow-hidden">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-contain p-2"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-7xl sm:text-8xl">
            {product.icon}
          </div>
        )}
        {product.discount && (
          <span className="absolute left-2 top-2 rounded-[20px] bg-tomato px-2 py-0.5 text-[11px] font-bold text-white">
            −{product.discount.percent}%
          </span>
        )}
      </Link>

      {/* Описание */}
      <div className="flex flex-1 flex-col px-1 pt-2">
        {/* Цена */}
        <div className="mb-1 flex items-baseline gap-1.5">
          {product.discount ? (
            <>
              <span className="text-base font-extrabold text-tomato">
                {product.discount.price} ₽
              </span>
              <span className="text-xs text-muted line-through">
                {product.price} ₽
              </span>
            </>
          ) : (
            <span className="text-base font-extrabold text-foreground">
              {product.price} ₽
            </span>
          )}
          <span className="text-xs text-muted">/ {product.unit}</span>
        </div>

        {/* Название */}
        <Link
          href={`/product/${product.id}`}
          className="line-clamp-2 text-xs text-muted leading-snug hover:text-foreground"
        >
          {product.name}
        </Link>

        {/* Кнопка */}
        <div className="mt-auto pt-2">
          {quantity === 0 ? (
            <button
              onClick={() => addItem(product.id, getDefaultQuantity(product))}
              className="w-full rounded-[10px] bg-primary py-2 text-sm font-semibold text-white"
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
