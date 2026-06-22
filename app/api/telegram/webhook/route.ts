import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { sendTelegramMessage } from "@/lib/telegram";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://fruktu.ru";

export async function POST(request: Request) {
  const secret = request.headers.get("x-telegram-bot-api-secret-token");
  if (secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return new Response("unauthorized", { status: 401 });
  }

  const update = await request.json();
  const message = update.message;
  if (!message?.text) return Response.json({ ok: true });

  const chatId = message.chat.id as number;
  const text = message.text as string;

  if (!text.startsWith("/start")) return Response.json({ ok: true });

  const payload = text.split(" ")[1] ?? "";
  const orderId = payload.startsWith("order_") ? payload.slice("order_".length) : null;

  if (!orderId) {
    await sendTelegramMessage(
      chatId,
      "Привет! Это бот «Схожу на рынок». Чтобы получать уведомления о заказе, откройте страницу заказа на сайте и нажмите «Подключить Telegram»."
    );
    return Response.json({ ok: true });
  }

  const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
  if (!order) {
    await sendTelegramMessage(chatId, "Не нашли такой заказ.");
    return Response.json({ ok: true });
  }

  await db
    .update(orders)
    .set({ messengerPlatform: "telegram", messengerChatId: String(chatId), updatedAt: new Date() })
    .where(eq(orders.id, orderId));

  await sendTelegramMessage(
    chatId,
    `Готово! Теперь вы будете получать уведомления о статусе заказа (${order.itemsCount} товаров на ~${order.estimatedTotal} ₽) прямо здесь.`,
    [[{ text: "📋 Открыть заказ", url: `${SITE_URL}/order/${orderId}` }]]
  );

  return Response.json({ ok: true });
}
