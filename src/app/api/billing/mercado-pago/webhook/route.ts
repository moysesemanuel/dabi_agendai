import { NextResponse, after } from "next/server";
import {
  extractMercadoPagoWebhookDataId,
  extractMercadoPagoWebhookTopic,
  getMercadoPagoWebhookSecret,
  verifyMercadoPagoWebhookSignature,
  type MercadoPagoWebhookPayload,
} from "@/lib/payments/mercado-pago";
import { processMercadoPagoWebhookEvent } from "@/lib/billing/subscription-service";

export async function POST(request: Request) {
  let payload: MercadoPagoWebhookPayload | null = null;

  try {
    payload = (await request.json()) as MercadoPagoWebhookPayload;
  } catch {
    payload = null;
  }

  const requestUrl = new URL(request.url);
  const topic = extractMercadoPagoWebhookTopic({ requestUrl, payload });
  const dataId = extractMercadoPagoWebhookDataId({ requestUrl, payload });

  if (topic !== "subscription_preapproval" && topic !== "subscription_authorized_payment") {
    return NextResponse.json({ ok: true, ignored: true });
  }

  if (!dataId) {
    return NextResponse.json({ error: "Webhook sem data.id." }, { status: 400 });
  }

  const xSignature = request.headers.get("x-signature");
  const xRequestId = request.headers.get("x-request-id");
  const providerEventId =
    xRequestId?.trim() || (payload?.id !== undefined ? String(payload.id) : `${topic}:${dataId}`);

  const webhookSecret = getMercadoPagoWebhookSecret();

  if (!webhookSecret) {
    return NextResponse.json(
      { error: "MERCADO_PAGO_WEBHOOK_SECRET nao configurado." },
      { status: 503 },
    );
  }

  if (!verifyMercadoPagoWebhookSignature({ xSignature, xRequestId, dataId, secret: webhookSecret })) {
    return NextResponse.json({ error: "Assinatura do webhook invalida." }, { status: 401 });
  }

  // Responde 200 imediatamente apos validar a assinatura - o MP retenta com
  // backoff exponencial por ate ~24h em qualquer resposta que nao seja 200, entao
  // processar de forma sincrona aqui arriscaria uma enxurrada de retries por um
  // handler lento. O trabalho de verdade (buscar o recurso no MP e gravar no
  // banco) roda depois de a resposta ja ter saido, via after().
  after(async () => {
    try {
      await processMercadoPagoWebhookEvent({ topic, dataId, providerEventId });
    } catch (error) {
      console.error("mercado_pago_webhook.processing_failed", { topic, dataId, providerEventId, error });
    }
  });

  return NextResponse.json({ ok: true });
}
