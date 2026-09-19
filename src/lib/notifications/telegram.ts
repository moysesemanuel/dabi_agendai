function getTelegramBotToken() {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();

  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN nao configurado.");
  }

  return token;
}

export function getTelegramBotUsername() {
  const username = process.env.TELEGRAM_BOT_USERNAME?.trim();

  if (!username) {
    throw new Error("TELEGRAM_BOT_USERNAME nao configurado.");
  }

  return username;
}

export async function sendTelegramMessage(chatId: string, text: string) {
  const token = getTelegramBotToken();

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    throw new Error(`Falha ao enviar mensagem no Telegram (${response.status}): ${await response.text().catch(() => "")}`);
  }
}
