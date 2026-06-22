import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { sendTelegramMessage } from "@/lib/telegram";

const STATUS_LABELS: Record<string, string> = {
  confirmed: "✅ Подтверждён",
  assembling: "🧺 Собирается",
  delivering: "🚚 Доставляется",
  done: "🎉 Выполнен",
  cancelled: "❌ Отменён",
};

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [order] = await db.select().from(orders).where(eq(orders.id, id));
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(order);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const allowed = ["items", "itemsCount", "estimatedTotal", "phone", "address", "comment", "status"] as const;
  const patch: Record<string, unknown> = { updatedAt: new Date() };
  for (const key of allowed) {
    if (key in body) patch[key] = key === "estimatedTotal" ? String(body[key]) : body[key];
  }

  const [existing] = await db.select().from(orders).where(eq(orders.id, id));
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [order] = await db.update(orders).set(patch).where(eq(orders.id, id)).returning();

  if (
    typeof body.status === "string" &&
    body.status !== existing.status &&
    order.messengerPlatform === "telegram" &&
    order.messengerChatId
  ) {
    const label = STATUS_LABELS[order.status];
    if (label) {
      await sendTelegramMessage(order.messengerChatId, `Статус вашего заказа изменился: ${label}`);
    }
  }

  return NextResponse.json(order);
}
