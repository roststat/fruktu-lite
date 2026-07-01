import { getCartProductById, formatQuantity, getItemWeightKg } from "@/data/catalog";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://fruktu.ru";

type InlineButton = { text: string; url?: string; callback_data?: string };

export async function sendTelegramMessage(
  chatId: number | string,
  text: string,
  buttons?: InlineButton[][]
) {
  if (!BOT_TOKEN) return;
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      reply_markup: buttons ? { inline_keyboard: buttons } : undefined,
    }),
  });
}

export async function answerCallbackQuery(callbackQueryId: string, text?: string) {
  if (!BOT_TOKEN) return;
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ callback_query_id: callbackQueryId, text }),
  });
}

export const STATUS_LABELS: Record<string, string> = {
  new:        "🆕 Новый",
  confirmed:  "✅ Подтверждён",
  assembling: "🧺 Собирается",
  assembled:  "📦 Собран",
  delivering: "🚚 Доставляется",
  done:       "🎉 Выполнен",
  cancelled:  "❌ Отменён",
};

type OrderItem = { productId: string; quantity: number };

export function buildOrderItemsText(items: OrderItem[]): string {
  const lines: string[] = [];
  for (const item of items) {
    const entry = getCartProductById(item.productId);
    if (!entry) continue;
    const { product, price } = entry;
    const qty = formatQuantity(product, item.quantity);
    const sum = Math.round(price * item.quantity);
    lines.push(`• ${product.name} — ${qty} · ${sum} ₽`);
  }
  return lines.length > 0 ? lines.join("\n") : "—";
}

export function calcOrderWeight(items: OrderItem[]): number {
  return items.reduce((sum, item) => {
    const entry = getCartProductById(item.productId);
    return entry ? sum + getItemWeightKg(entry.product, item.quantity) : sum;
  }, 0);
}

/** Кнопки для активного заказа */
export function orderButtons(orderId: string): InlineButton[][] {
  return [
    [{ text: "🔗 Открыть заказ на сайте", url: `${SITE_URL}/order/${orderId}` }],
    [{ text: "❌ Отменить заказ", callback_data: `cancel:${orderId}` }],
  ];
}

/** Кнопки для оплаты */
export function paymentButtons(orderId: string): InlineButton[][] {
  return [
    [{ text: "💳 Перейти к оплате", url: `${SITE_URL}/order/${orderId}/pay` }],
  ];
}

/** Сообщение при подключении: состав + статус + кнопки */
export function buildConnectedMessage(
  orderId: string,
  items: OrderItem[],
  estimatedTotal: string | number,
  status: string
): { text: string; buttons: InlineButton[][] } {
  const statusLabel = STATUS_LABELS[status] ?? status;
  const weight = Math.round(calcOrderWeight(items) * 10) / 10;
  const text =
    `✅ <b>Telegram подключён к заказу!</b>\n\n` +
    `<b>📋 Состав заказа:</b>\n${buildOrderItemsText(items)}\n\n` +
    `⚖️ Примерный вес: ~${weight} кг\n` +
    `💰 Примерная сумма: <b>~${Math.round(Number(estimatedTotal))} ₽</b>\n` +
    `📦 Статус: <b>${statusLabel}</b>\n\n` +
    `Пришлём уведомление при каждом изменении статуса.`;
  return { text, buttons: orderButtons(orderId) };
}

/** Уведомление при добавлении товаров */
export function buildItemsAddedMessage(
  orderId: string,
  addedItems: OrderItem[],
  allItems: OrderItem[],
  newTotal: number
): { text: string; buttons: InlineButton[][] } {
  const weight = Math.round(calcOrderWeight(allItems) * 10) / 10;
  const addedText = buildOrderItemsText(addedItems);
  const text =
    `➕ <b>К заказу добавлены товары:</b>\n${addedText}\n\n` +
    `⚖️ Новый примерный вес: ~${weight} кг\n` +
    `💰 Новая примерная сумма: <b>~${newTotal} ₽</b>\n\n` +
    `Точная стоимость будет после сборки на рынке.`;
  return { text, buttons: orderButtons(orderId) };
}

/** Уведомление при смене статуса */
export function buildStatusMessage(
  orderId: string,
  status: string,
  items: OrderItem[],
  estimatedTotal: string | number,
  finalWeight?: string | null,
  finalTotal?: string | null
): { text: string; buttons: InlineButton[][] } {
  const statusLabel = STATUS_LABELS[status] ?? status;

  if (status === "assembled" && finalTotal) {
    const fw = finalWeight ? `${Math.round(Number(finalWeight) * 10) / 10} кг` : "уточняется";
    const text =
      `📦 <b>Заказ собран!</b>\n\n` +
      `⚖️ Точный вес: <b>${fw}</b>\n` +
      `💰 Итоговая сумма к оплате: <b>${Math.round(Number(finalTotal))} ₽</b>\n\n` +
      `Нажмите кнопку ниже, чтобы оплатить заказ.`;
    return { text, buttons: paymentButtons(orderId) };
  }

  if (status === "done") {
    const text = `🎉 <b>Заказ выполнен!</b>\n\nСпасибо за покупку. Ждём вас снова!`;
    return { text, buttons: [[{ text: "🔗 Открыть заказ", url: `${SITE_URL}/order/${orderId}` }]] };
  }

  if (status === "cancelled") {
    const text = `❌ <b>Заказ отменён.</b>\n\nЕсли это ошибка — оформите новый заказ на сайте.`;
    return { text, buttons: [[{ text: "🛒 В каталог", url: `${SITE_URL}/catalog` }]] };
  }

  const weight = Math.round(calcOrderWeight(items) * 10) / 10;
  const isAssembled = status === "assembled";
  const displayTotal = finalTotal ?? estimatedTotal;
  const fw = finalWeight ? `${Math.round(Number(finalWeight) * 10) / 10} кг` : `~${weight} кг`;
  const text =
    `📦 Статус заказа изменился: <b>${statusLabel}</b>\n\n` +
    `⚖️ ${isAssembled ? "Точный вес" : "Примерный вес"}: ${isAssembled && finalWeight ? fw : `~${weight} кг`}\n` +
    `💰 ${isAssembled ? "Итоговая сумма" : "Примерная сумма"}: <b>${isAssembled ? "" : "~"}${Math.round(Number(displayTotal))} ₽</b>`;
  return { text, buttons: isAssembled ? paymentButtons(orderId) : orderButtons(orderId) };
}
