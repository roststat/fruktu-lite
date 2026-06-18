import { getClearanceProducts } from "@/data/catalog";
import ClearanceCard from "./ClearanceCard";

export default function ClearanceSection() {
  const items = getClearanceProducts();

  return (
    <section className="rounded-[10px] border border-green-600/20 bg-green-600/5 p-3">
      <div className="mb-3 flex items-center gap-2">
        <span className="rounded-[10px] bg-green-600 px-2.5 py-1 text-xs font-bold text-white">
          🏷️ Зелёные ценники
        </span>
        <h2 className="text-sm font-bold">
          Скоро испортятся — отдаём дешевле
        </h2>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted">
          Сейчас таких товаров нет — но они могут появиться в любой момент 🍃
        </p>
      ) : (
        <div className="flex flex-nowrap gap-3 overflow-x-auto pb-1">
          {items.map((product) => (
            <div key={product.id} className="w-44 shrink-0">
              <ClearanceCard product={product} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
