import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export default async function PayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [order] = await db.select().from(orders).where(eq(orders.id, id));
  if (!order) notFound();

  if (!["assembled", "delivering"].includes(order.status)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <span className="text-5xl">🔒</span>
        <p className="text-lg font-bold">Оплата недоступна</p>
        <p className="text-sm text-muted">Заказ ещё не собран или уже оплачен.</p>
        <Link href={`/order/${id}`} className="rounded-[10px] bg-primary px-4 py-2 text-sm font-semibold text-white">
          ← К заказу
        </Link>
      </div>
    );
  }

  const amount = Math.round(Number(order.finalTotal ?? order.estimatedTotal));

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <Link href={`/order/${id}`} className="mb-6 inline-block text-sm text-muted hover:text-primary-dark">
        ← К заказу
      </Link>

      <div className="rounded-[20px] border border-black/5 bg-white p-6 text-center shadow-sm">
        <span className="text-5xl">💳</span>
        <h1 className="mt-4 text-2xl font-extrabold">Оплата заказа</h1>
        <p className="mt-1 font-mono text-xs text-muted">{order.id}</p>

        <div className="mt-6 rounded-[12px] bg-primary/5 px-4 py-4">
          <p className="text-sm text-muted">Сумма к оплате</p>
          <p className="mt-1 text-4xl font-extrabold text-primary-dark">{amount} ₽</p>
          {order.finalWeight && (
            <p className="mt-1 text-sm text-muted">
              Вес заказа: {Math.round(Number(order.finalWeight) * 10) / 10} кг
            </p>
          )}
        </div>

        <div className="mt-8 rounded-[12px] border border-dashed border-primary/30 bg-primary/5 p-6">
          <p className="text-lg font-bold text-primary-dark">Эквайринг скоро будет</p>
          <p className="mt-2 text-sm text-muted">
            Онлайн-оплата подключается. Сейчас оператор свяжется с вами для подтверждения.
          </p>
        </div>

        <Link
          href={`/order/${id}`}
          className="mt-6 block rounded-[10px] bg-black/5 py-3 text-sm font-semibold text-muted"
        >
          Вернуться к заказу
        </Link>
      </div>
    </div>
  );
}
