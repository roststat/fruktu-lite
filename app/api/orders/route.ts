import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { eq, and, isNotNull, desc } from "drizzle-orm";
import { sendTelegramMessage, buildConnectedMessage } from "@/lib/telegram";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { items, itemsCount, estimatedTotal, phone, address, comment } = body;

  if (!items || !phone || !address) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Ищем предыдущий заказ этого телефона с привязанным Telegram
  const [prevWithTg] = await db
    .select()
    .from(orders)
    .where(
      and(
        eq(orders.phone, phone),
        eq(orders.messengerPlatform, "telegram"),
        isNotNull(orders.messengerChatId)
      )
    )
    .orderBy(desc(orders.createdAt))
    .limit(1);

  // Ищем неоплаченный собранный заказ того же телефона
  const [assembledOrder] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.phone, phone), eq(orders.status, "assembled")))
    .orderBy(desc(orders.createdAt))
    .limit(1);

  const linkedOrderId = assembledOrder?.paymentStatus !== "paid" ? (assembledOrder?.id ?? null) : null;

  const messengerPlatform = prevWithTg ? "telegram" : null;
  const messengerChatId = prevWithTg?.messengerChatId ?? null;

  const [order] = await db.insert(orders).values({
    items,
    itemsCount,
    estimatedTotal: String(estimatedTotal),
    phone,
    address,
    comment: comment || null,
    messengerPlatform,
    messengerChatId,
    linkedOrderId,
  }).returning();

  // Уведомляем в Telegram о новом заказе
  if (messengerChatId) {
    const { text, buttons } = buildConnectedMessage(
      order.id,
      order.items as { productId: string; quantity: number }[],
      order.estimatedTotal,
      order.status
    );
    await sendTelegramMessage(
      messengerChatId,
      `🛒 <b>Новый заказ создан!</b>\n\n${text}`,
      buttons
    );
  }

  return NextResponse.json({ id: order.id, linkedOrderId });
}
