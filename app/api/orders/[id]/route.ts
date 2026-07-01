import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  sendTelegramMessage,
  buildStatusMessage,
  buildItemsAddedMessage,
  STATUS_LABELS,
} from "@/lib/telegram";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [order] = await db.select().from(orders).where(eq(orders.id, id));
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(order);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const allowed = [
    "items", "itemsCount", "estimatedTotal",
    "phone", "address", "comment", "status",
    "finalWeight", "finalTotal", "paymentStatus",
  ] as const;

  const patch: Record<string, unknown> = { updatedAt: new Date() };
  for (const key of allowed) {
    if (!(key in body)) continue;
    if (key === "estimatedTotal" || key === "finalTotal" || key === "finalWeight") {
      patch[key] = body[key] !== null && body[key] !== undefined ? String(body[key]) : null;
    } else {
      patch[key] = body[key];
    }
  }

  const [existing] = await db.select().from(orders).where(eq(orders.id, id));
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [order] = await db.update(orders).set(patch).where(eq(orders.id, id)).returning();

  const hasTelegram = order.messengerPlatform === "telegram" && order.messengerChatId;

  // Уведомление при смене статуса
  if (
    typeof body.status === "string" &&
    body.status !== existing.status &&
    hasTelegram
  ) {
    const label = STATUS_LABELS[order.status];
    if (label) {
      const { text, buttons } = buildStatusMessage(
        order.id,
        order.status,
        order.items as { productId: string; quantity: number }[],
        order.estimatedTotal,
        order.finalWeight,
        order.finalTotal
      );
      await sendTelegramMessage(order.messengerChatId!, text, buttons);
    }
  }

  // Уведомление при добавлении товаров (items изменились, статус не менялся)
  if (
    body.items &&
    !body.status &&
    hasTelegram
  ) {
    const prevIds = new Set((existing.items as { productId: string }[]).map((i) => i.productId));
    const addedItems = (body.items as { productId: string; quantity: number }[]).filter(
      (i) => !prevIds.has(i.productId)
    );
    if (addedItems.length > 0) {
      const newTotal = Math.round(Number(order.estimatedTotal));
      const { text, buttons } = buildItemsAddedMessage(
        order.id,
        addedItems,
        order.items as { productId: string; quantity: number }[],
        newTotal
      );
      await sendTelegramMessage(order.messengerChatId!, text, buttons);
    }
  }

  return NextResponse.json(order);
}
