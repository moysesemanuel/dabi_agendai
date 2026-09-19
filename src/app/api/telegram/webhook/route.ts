import { NextRequest, NextResponse } from "next/server";
import { consumeTelegramLinkCode } from "@/lib/notifications/telegram-link";
import { sendTelegramMessage } from "@/lib/notifications/telegram";

type TelegramUpdate = {
  message?: {
    text?: string;
    chat?: { id?: number | string };
  };
};

export async function POST(request: NextRequest) {
  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();
  const receivedSecret = request.headers.get("x-telegram-bot-api-secret-token");

  if (!expectedSecret || receivedSecret !== expectedSecret) {
    return NextResponse.json({ error: "Assinatura invalida." }, { status: 401 });
  }

  try {
    const update = (await request.json()) as TelegramUpdate;
    const chatId = update.message?.chat?.id;
    const text = update.message?.text?.trim() ?? "";

    if (!chatId || !text.startsWith("/start")) {
      return NextResponse.json({ ok: true });
    }

    const code = text.replace("/start", "").trim();

    if (!code) {
      await sendTelegramMessage(
        String(chatId),
        "Gere um link de conexao no painel (Notificações) e clique nele pra vincular esse chat.",
      ).catch(() => {});
      return NextResponse.json({ ok: true });
    }

    const result = await consumeTelegramLinkCode(code, String(chatId));

    const replies: Record<typeof result.status, string> = {
      linked: "Conectado! Você vai receber uma mensagem aqui sempre que um novo agendamento for feito.",
      already_used: "Esse link ja foi usado. Gere um novo no painel se precisar conectar outro chat.",
      expired: "Esse link expirou. Gere um novo no painel (Notificações).",
      not_found: "Link invalido. Gere um novo no painel (Notificações).",
    };

    await sendTelegramMessage(String(chatId), replies[result.status]).catch(() => {});

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Falha ao processar webhook do Telegram", error);
    return NextResponse.json({ ok: true });
  }
}
