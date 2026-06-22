import { getClearanceProducts } from "@/data/catalog";
import ClearanceCard from "./ClearanceCard";

export default function ClearanceSection() {
  const items = getClearanceProducts();

  return (
    <section className="rounded-[10px] border border-green-600/20 bg-green-600/5 p-3">
      <div className="mb-1 flex items-center gap-2">
        <span className="rounded-[10px] bg-green-600 px-2.5 py-1 text-xs font-bold text-white">
          🏷️ Зелёный каталог
        </span>
        <h2 className="text-sm font-bold">Уценённые товары</h2>
      </div>
      <p className="mb-3 text-xs text-muted">
        Эти товары не идеальны по внешнему виду, но абсолютно свежие и пригодны к использованию — поэтому отдаём со скидкой.
      </p>

      {items.length === 0 ? (
        <p className="text-sm text-muted">
          Сейчас таких товаров нет — но они могут появиться в любой момент 🍃
        </p>
      ) : (
        <div className="flex flex-nowrap gap-4 overflow-x-auto pb-1">
          {items.map((product) => (
            <div key={product.id} className="w-56 shrink-0">
              <ClearanceCard product={product} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
