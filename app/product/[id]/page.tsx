import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  getCategoryById,
  getProductById,
  getRelatedProducts,
} from "@/data/catalog";
import ProductCard from "@/components/ProductCard";
import AddToListControl from "@/components/AddToListControl";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = getProductById(id);

  if (!product) notFound();

  const category = getCategoryById(product.categoryId);
  const related = getRelatedProducts(product);

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      {category && (
        <Link
          href={`/catalog?category=${category.id}`}
          className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-primary-dark"
        >
          ← {category.icon} {category.name}
        </Link>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-[10px] bg-primary/5 text-9xl">
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
              priority
            />
          ) : (
            product.icon
          )}
        </div>

        <div className="flex flex-col gap-4">
          {product.seasonal && (
            <span className="inline-flex w-fit items-center gap-1 rounded-[10px] bg-accent/20 px-3 py-1 text-sm font-semibold text-accent">
              🌱 сейчас сезон
            </span>
          )}
          <h1 className="text-2xl font-extrabold">{product.name}</h1>
          <p className="text-2xl font-bold text-primary-dark">
            {product.price} ₽{" "}
            <span className="text-base font-normal text-muted">
              / {product.unit}
            </span>
          </p>
          <p className="text-sm text-muted">
            Итоговая сумма заказа будет подтверждена после сборки на рынке —
            возможны небольшие отклонения по весу.
          </p>

          <AddToListControl productId={product.id} />
        </div>
      </div>

      {related.length > 0 && (
        <div className="mt-12">
          <h2 className="mb-4 text-lg font-bold">С этим товаром покупают</h2>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {related.map((p) => (
              <div key={p.id} className="w-44 shrink-0">
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
