import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import {
  sendTelegramMessage,
  answerCallbackQuery,
  buildConnectedMessage,
  buildStatusMessage,
  SITE_URL,
} from "@/lib/telegram";

export async function POST(request: Request) {
  const secret = request.headers.get("x-telegram-bot-api-secret-token");
  if (secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return new Response("unauthorized", { status: 401 });
  }

  const update = await request.json();

  // ── Inline-кнопка «Отменить заказ» ──────────────────────────────────────
  if (update.callback_query) {
    const cq = update.callback_query;
    const chatId = cq.from.id as number;
    const data: string = cq.data ?? "";

    if (data.startsWith("cancel:")) {
      const orderId = data.slice("cancel:".length);
      const [order] = await db.select().from(orders).where(eq(orders.id, orderId));

      if (!order) {
        await answerCallbackQuery(cq.id, "Заказ не найден.");
        return Response.json({ ok: true });
      }

      if (["done", "cancelled", "delivering"].includes(order.status)) {
        await answerCallbackQuery(cq.id, "Этот заказ уже нельзя отменить.");
        return Response.json({ ok: true });
      }

      await db
        .update(orders)
        .set({ status: "cancelled", updatedAt: new Date() })
        .where(eq(orders.id, orderId));

      await answerCallbackQuery(cq.id, "Заказ отменён.");
      const { text, buttons } = buildStatusMessage(orderId, "cancelled", [], order.estimatedTotal);
      await sendTelegramMessage(chatId, text, buttons);
    }

    return Response.json({ ok: true });
  }

  // ── Обычное сообщение ────────────────────────────────────────────────────
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
      `Привет! Это бот «Схожу на рынок».\n\nЧтобы получать уведомления о заказе, откройте страницу заказа на сайте и нажмите «Подключить Telegram».\n\n🛒 <a href="${SITE_URL}/catalog">Перейти в каталог</a>`
    );
    return Response.json({ ok: true });
  }

  const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
  if (!order) {
    await sendTelegramMessage(chatId, "Не нашли такой заказ. Проверьте ссылку или оформите новый заказ на сайте.");
    return Response.json({ ok: true });
  }

  // Привязываем чат к заказу
  await db
    .update(orders)
    .set({ messengerPlatform: "telegram", messengerChatId: String(chatId), updatedAt: new Date() })
    .where(eq(orders.id, orderId));

  const items = order.items as { productId: string; quantity: number }[];
  const { text: connectedText, buttons: connectedButtons } = buildConnectedMessage(
    order.id, items, order.estimatedTotal, order.status, order.finalTotal, order.finalWeight
  );

  // Для завершённых/активных статусов шлём приветствие + отдельное статусное сообщение
  if (["assembled", "delivering", "done", "cancelled"].includes(order.status)) {
    const { text: statusText, buttons: statusButtons } = buildStatusMessage(
      order.id, order.status, items, order.estimatedTotal, order.finalWeight, order.finalTotal
    );
    await sendTelegramMessage(chatId, connectedText);
    await sendTelegramMessage(chatId, statusText, statusButtons);
  } else {
    await sendTelegramMessage(chatId, connectedText, connectedButtons);
  }

  return Response.json({ ok: true });
}
