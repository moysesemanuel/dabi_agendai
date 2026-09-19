import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  buildTenantExternalReference,
  extractMercadoPagoWebhookDataId,
  extractMercadoPagoWebhookTopic,
  normalizeMercadoPagoSubscriptionStatus,
  parseTenantIdFromExternalReference,
  verifyMercadoPagoWebhookSignature,
} from "./mercado-pago";

describe("buildTenantExternalReference / parseTenantIdFromExternalReference", () => {
  it("faz o caminho de ida e volta", () => {
    const reference = buildTenantExternalReference("tenant-abc123");
    expect(reference).toBe("tenant:tenant-abc123");
    expect(parseTenantIdFromExternalReference(reference)).toBe("tenant-abc123");
  });

  it("retorna null para valores que nao seguem o formato esperado", () => {
    expect(parseTenantIdFromExternalReference("outra-coisa")).toBeNull();
    expect(parseTenantIdFromExternalReference(null)).toBeNull();
    expect(parseTenantIdFromExternalReference(undefined)).toBeNull();
  });
});

describe("normalizeMercadoPagoSubscriptionStatus", () => {
  it("trata 'authorized' como 'active' (nome usado pelo MP pra assinatura autorizada)", () => {
    expect(normalizeMercadoPagoSubscriptionStatus("authorized")).toBe("active");
  });

  it("normaliza case e espacos", () => {
    expect(normalizeMercadoPagoSubscriptionStatus(" ACTIVE ")).toBe("active");
    expect(normalizeMercadoPagoSubscriptionStatus("Canceled")).toBe("canceled");
  });

  it("cai em 'unknown' pra status nao mapeados ou vazios", () => {
    expect(normalizeMercadoPagoSubscriptionStatus("qualquer-coisa")).toBe("unknown");
    expect(normalizeMercadoPagoSubscriptionStatus(null)).toBe("unknown");
    expect(normalizeMercadoPagoSubscriptionStatus(undefined)).toBe("unknown");
  });
});

describe("extractMercadoPagoWebhookTopic / extractMercadoPagoWebhookDataId", () => {
  // As duas funcoes tem prioridade diferente de proposito: o topico vem do
  // corpo do payload primeiro (mais confiavel), mas o data.id vem dos query
  // params primeiro (e o formato que o MP realmente usa pra notificar).
  it("topic prioriza o payload; data.id prioriza os query params", () => {
    const requestUrl = new URL("https://example.com/webhook?type=subscription_authorized_payment&id=999");
    const payload = { type: "subscription_preapproval" as const, data: { id: "123" } };

    expect(extractMercadoPagoWebhookTopic({ requestUrl, payload })).toBe("subscription_preapproval");
    expect(extractMercadoPagoWebhookDataId({ requestUrl, payload })).toBe("999");
  });

  it("usa os query params quando o payload nao traz o dado", () => {
    const requestUrl = new URL("https://example.com/webhook?topic=subscription_preapproval&data.id=456");
    expect(extractMercadoPagoWebhookTopic({ requestUrl, payload: null })).toBe("subscription_preapproval");
    expect(extractMercadoPagoWebhookDataId({ requestUrl, payload: null })).toBe("456");
  });
});

describe("verifyMercadoPagoWebhookSignature", () => {
  const secret = "test-secret";
  const dataId = "123456";
  const xRequestId = "req-abc";
  const ts = "1700000000";

  function buildValidSignatureHeader() {
    const manifest = `id:${dataId.toLowerCase()};request-id:${xRequestId};ts:${ts};`;
    const digest = createHmac("sha256", secret).update(manifest).digest("hex");
    return `ts=${ts},v1=${digest}`;
  }

  it("aceita uma assinatura valida", () => {
    const result = verifyMercadoPagoWebhookSignature({
      xSignature: buildValidSignatureHeader(),
      xRequestId,
      dataId,
      secret,
    });
    expect(result).toBe(true);
  });

  it("rejeita quando o digest nao bate (secret errado)", () => {
    const result = verifyMercadoPagoWebhookSignature({
      xSignature: buildValidSignatureHeader(),
      xRequestId,
      dataId,
      secret: "outro-secret",
    });
    expect(result).toBe(false);
  });

  it("rejeita quando falta o header x-signature ou x-request-id", () => {
    expect(
      verifyMercadoPagoWebhookSignature({ xSignature: null, xRequestId, dataId, secret }),
    ).toBe(false);
    expect(
      verifyMercadoPagoWebhookSignature({
        xSignature: buildValidSignatureHeader(),
        xRequestId: null,
        dataId,
        secret,
      }),
    ).toBe(false);
  });

  it("normaliza o data.id pra minusculo antes de calcular o manifest", () => {
    const dataIdUppercase = "ABC123";
    const manifest = `id:${dataIdUppercase.toLowerCase()};request-id:${xRequestId};ts:${ts};`;
    const digest = createHmac("sha256", secret).update(manifest).digest("hex");

    const result = verifyMercadoPagoWebhookSignature({
      xSignature: `ts=${ts},v1=${digest}`,
      xRequestId,
      dataId: dataIdUppercase,
      secret,
    });
    expect(result).toBe(true);
  });
});
