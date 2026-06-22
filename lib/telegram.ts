const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

type InlineButton = { text: string; web_app?: { url: string }; url?: string };

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
      reply_markup: buttons ? { inline_keyboard: buttons } : undefined,
    }),
  });
}
