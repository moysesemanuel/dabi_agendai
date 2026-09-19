import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

const API_TIMEOUT_MS = 15_000;

export type MercadoPagoWebhookTopic = "subscription_preapproval" | "subscription_authorized_payment";

export type MercadoPagoWebhookPayload = {
  id?: string | number;
  live_mode?: boolean;
  type?: string;
  data?: { id?: string | number };
};

export type MercadoPagoSubscription = {
  id: string;
  status?: string | null;
  external_reference?: string | number | null;
  reason?: string | null;
  payer_email?: string | null;
  init_point?: string | null;
};

export type MercadoPagoAuthorizedPayment = {
  id: number;
  preapproval_id?: string | null;
  payment?: { id?: number | string | null; status?: string | null } | null;
};

export type NormalizedMercadoPagoSubscriptionStatus =
  | "pending"
  | "active"
  | "paused"
  | "canceled"
  | "unknown";

export class MercadoPagoConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MercadoPagoConfigurationError";
  }
}

export class MercadoPagoApiError extends Error {
  status: number;
  path: string;

  constructor(input: { status: number; path: string; responseText: string }) {
    super(
      `Mercado Pago API request failed (${input.status}) for ${input.path}: ${
        input.responseText || "empty response"
      }`,
    );
    this.name = "MercadoPagoApiError";
    this.status = input.status;
    this.path = input.path;
  }
}

export function getMercadoPagoAccessToken() {
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN?.trim();

  if (!accessToken) {
    throw new MercadoPagoConfigurationError("MERCADO_PAGO_ACCESS_TOKEN nao configurado.");
  }

  return accessToken;
}

export function getMercadoPagoWebhookSecret() {
  return process.env.MERCADO_PAGO_WEBHOOK_SECRET?.trim() ?? "";
}

export function buildTenantExternalReference(tenantId: string) {
  return `tenant:${tenantId}`;
}

export function parseTenantIdFromExternalReference(value: string | number | null | undefined) {
  const normalized = normalizeOptionalString(value);

  if (!normalized?.startsWith("tenant:")) {
    return null;
  }

  return normalized.slice("tenant:".length).trim() || null;
}

export async function createMercadoPagoRecurringSubscription(input: {
  tenantId: string;
  payerEmail: string;
  reason: string;
  backUrl: string;
  amountCents: number;
}) {
  const endDate = new Date();
  endDate.setFullYear(endDate.getFullYear() + 5);

  return mercadoPagoApiMutation<MercadoPagoSubscription>("/preapproval", {
    payer_email: input.payerEmail,
    external_reference: buildTenantExternalReference(input.tenantId),
    reason: input.reason,
    back_url: input.backUrl,
    auto_recurring: {
      frequency: 1,
      frequency_type: "months",
      end_date: endDate.toISOString(),
      transaction_amount: Number((input.amountCents / 100).toFixed(2)),
      currency_id: "BRL",
    },
    status: "pending",
  });
}

export async function getMercadoPagoSubscription(subscriptionId: string) {
  return mercadoPagoApiRequest<MercadoPagoSubscription>(`/preapproval/${subscriptionId}`);
}

// Cancelamento e imediato e irreversivel do lado do Mercado Pago (nao da pra
// reativar essa mesma assinatura depois) - so para a cobranca recorrente.
// A regra de "cliente mantem acesso ate o fim do periodo ja pago" e local,
// ver `cancelTenantSubscription` em subscription-service.ts.
export async function cancelMercadoPagoSubscription(subscriptionId: string) {
  return mercadoPagoApiMutation<MercadoPagoSubscription>(
    `/preapproval/${subscriptionId}`,
    { status: "canceled" },
    "PUT",
  );
}

export async function getMercadoPagoAuthorizedPayment(authorizedPaymentId: string) {
  return mercadoPagoApiRequest<MercadoPagoAuthorizedPayment>(
    `/authorized_payments/${authorizedPaymentId}`,
  );
}

export function extractMercadoPagoWebhookTopic(input: {
  requestUrl: URL;
  payload: MercadoPagoWebhookPayload | null;
}) {
  const topic =
    normalizeOptionalString(input.payload?.type) ??
    normalizeOptionalString(input.requestUrl.searchParams.get("type")) ??
    normalizeOptionalString(input.requestUrl.searchParams.get("topic"));

  return topic as MercadoPagoWebhookTopic | null;
}

export function extractMercadoPagoWebhookDataId(input: {
  requestUrl: URL;
  payload: MercadoPagoWebhookPayload | null;
}) {
  const queryDataId =
    normalizeOptionalString(input.requestUrl.searchParams.get("data.id")) ??
    normalizeOptionalString(input.requestUrl.searchParams.get("id"));

  return queryDataId ?? normalizeOptionalString(input.payload?.data?.id ?? input.payload?.id);
}

export function normalizeMercadoPagoSubscriptionStatus(
  status: string | null | undefined,
): NormalizedMercadoPagoSubscriptionStatus {
  const normalized = status?.trim().toLowerCase();

  if (!normalized) {
    return "unknown";
  }

  if (normalized === "authorized") {
    return "active";
  }

  if (normalized === "pending" || normalized === "active" || normalized === "paused" || normalized === "canceled") {
    return normalized;
  }

  return "unknown";
}

/**
 * Sem janela temporal de validade do `ts` de propósito: seguimos a mesma decisão
 * documentada no dabi-price-3d (a assinatura HMAC vale por si, sem checagem de
 * idade). Reentrega do mesmo evento não gera efeito duplicado porque o
 * processamento é idempotente por `providerEventId` (ver BillingWebhookEvent).
 */
export function verifyMercadoPagoWebhookSignature(input: {
  xSignature: string | null;
  xRequestId: string | null;
  dataId: string;
  secret: string;
}) {
  const xSignature = normalizeOptionalString(input.xSignature);
  const xRequestId = normalizeOptionalString(input.xRequestId);
  const secret = normalizeOptionalString(input.secret);

  if (!xSignature || !xRequestId || !secret) {
    return false;
  }

  const signatureParts = Object.fromEntries(
    xSignature.split(",").map((part) => {
      const [rawKey, rawValue] = part.split("=");
      return [rawKey?.trim() ?? "", rawValue?.trim() ?? ""];
    }),
  );

  const ts = normalizeOptionalString(signatureParts.ts);
  const expectedDigest = normalizeOptionalString(signatureParts.v1);

  if (!ts || !expectedDigest) {
    return false;
  }

  // A doc do Mercado Pago pede lowercase no data.id do manifest quando ele vem
  // com letras (normalmente e so numerico, mas o preapproval id de teste pode
  // nao ser) - sem isso a assinatura calculada diverge da que o MP mandou.
  const manifest = `id:${input.dataId.toLowerCase()};request-id:${xRequestId};ts:${ts};`;
  const computedDigest = createHmac("sha256", secret).update(manifest).digest("hex");

  return safeCompare(expectedDigest, computedDigest);
}

async function mercadoPagoApiRequest<T>(path: string) {
  const response = await fetch(`https://api.mercadopago.com${path}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${getMercadoPagoAccessToken()}`,
    },
    cache: "no-store",
    signal: AbortSignal.timeout(API_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new MercadoPagoApiError({
      status: response.status,
      path,
      responseText: await response.text().catch(() => ""),
    });
  }

  return (await response.json()) as T;
}

async function mercadoPagoApiMutation<T>(
  path: string,
  body: Record<string, unknown>,
  method: "POST" | "PUT" = "POST",
) {
  const response = await fetch(`https://api.mercadopago.com${path}`, {
    method,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${getMercadoPagoAccessToken()}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": randomUUID(),
    },
    body: JSON.stringify(body),
    cache: "no-store",
    signal: AbortSignal.timeout(API_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new MercadoPagoApiError({
      status: response.status,
      path,
      responseText: await response.text().catch(() => ""),
    });
  }

  return (await response.json()) as T;
}

function normalizeOptionalString(value: unknown) {
  if (typeof value === "number") {
    return String(value);
  }

  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized ? normalized : null;
}

function safeCompare(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}
