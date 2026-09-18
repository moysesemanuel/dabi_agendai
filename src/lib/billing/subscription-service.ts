import { SubscriptionStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getPlan, type PlanId } from "@/lib/billing/plans";
import {
  createMercadoPagoRecurringSubscription,
  getMercadoPagoAuthorizedPayment,
  getMercadoPagoSubscription,
  normalizeMercadoPagoSubscriptionStatus,
  parseTenantIdFromExternalReference,
  type MercadoPagoWebhookTopic,
} from "@/lib/payments/mercado-pago";

export async function createSubscriptionCheckout(input: {
  tenantId: string;
  planId: PlanId;
  payerEmail: string;
  backUrl: string;
}) {
  const plan = getPlan(input.planId);

  const mpSubscription = await createMercadoPagoRecurringSubscription({
    tenantId: input.tenantId,
    payerEmail: input.payerEmail,
    reason: `DaBi Agendaí - Plano ${plan.name}`,
    backUrl: input.backUrl,
    amountCents: plan.amountCents,
  });

  if (!mpSubscription.init_point) {
    throw new Error("Mercado Pago nao retornou o link de checkout da assinatura.");
  }

  await prisma.tenantSubscription.upsert({
    where: { tenantId: input.tenantId },
    create: {
      tenantId: input.tenantId,
      planId: input.planId,
      status: SubscriptionStatus.PENDING,
      amountCents: plan.amountCents,
      providerSubscriptionId: mpSubscription.id,
      payerEmail: input.payerEmail,
      initPoint: mpSubscription.init_point,
    },
    update: {
      planId: input.planId,
      status: SubscriptionStatus.PENDING,
      amountCents: plan.amountCents,
      providerSubscriptionId: mpSubscription.id,
      payerEmail: input.payerEmail,
      initPoint: mpSubscription.init_point,
    },
  });

  return { initPoint: mpSubscription.init_point };
}

export async function getTenantSubscription(tenantId: string) {
  return prisma.tenantSubscription.findUnique({ where: { tenantId } });
}

export async function processMercadoPagoWebhookEvent(input: {
  topic: MercadoPagoWebhookTopic;
  dataId: string;
  providerEventId: string;
}) {
  const alreadyProcessed = await prisma.billingWebhookEvent.findUnique({
    where: { provider_providerEventId: { provider: "mercado_pago", providerEventId: input.providerEventId } },
  });

  if (alreadyProcessed) {
    return { outcome: "duplicate" as const };
  }

  let providerSubscriptionId: string;
  let tenantId: string | null;
  let normalizedStatus: ReturnType<typeof normalizeMercadoPagoSubscriptionStatus>;

  if (input.topic === "subscription_preapproval") {
    const subscription = await getMercadoPagoSubscription(input.dataId);
    providerSubscriptionId = subscription.id;
    tenantId = parseTenantIdFromExternalReference(subscription.external_reference);
    normalizedStatus = normalizeMercadoPagoSubscriptionStatus(subscription.status);
  } else {
    const authorizedPayment = await getMercadoPagoAuthorizedPayment(input.dataId);
    const preapprovalId = authorizedPayment.preapproval_id;

    if (!preapprovalId) {
      await recordWebhookEvent(input, "ignored");
      return { outcome: "ignored" as const };
    }

    const subscription = await getMercadoPagoSubscription(preapprovalId);
    providerSubscriptionId = subscription.id;
    tenantId = parseTenantIdFromExternalReference(subscription.external_reference);
    normalizedStatus = normalizeMercadoPagoSubscriptionStatus(subscription.status);
  }

  const status = mapMercadoPagoStatus(normalizedStatus);

  if (!status) {
    await recordWebhookEvent(input, "ignored");
    return { outcome: "ignored" as const };
  }

  const existing =
    (await prisma.tenantSubscription.findUnique({ where: { providerSubscriptionId } })) ??
    (tenantId ? await prisma.tenantSubscription.findUnique({ where: { tenantId } }) : null);

  if (!existing) {
    await recordWebhookEvent(input, "ignored");
    return { outcome: "ignored" as const };
  }

  await prisma.tenantSubscription.update({
    where: { id: existing.id },
    data: {
      status,
      providerSubscriptionId,
      currentPeriodEnd: status === SubscriptionStatus.ACTIVE ? addOneMonth(new Date()) : existing.currentPeriodEnd,
    },
  });

  await recordWebhookEvent(input, "processed");

  return { outcome: "processed" as const, tenantId: existing.tenantId, status };
}

async function recordWebhookEvent(
  input: { providerEventId: string; topic: string },
  status: "processed" | "ignored",
) {
  try {
    await prisma.billingWebhookEvent.create({
      data: {
        provider: "mercado_pago",
        providerEventId: input.providerEventId,
        eventType: input.topic,
        status,
        processedAt: new Date(),
      },
    });
  } catch {
    // Corrida com outra entrega do mesmo evento - o unique de (provider, providerEventId)
    // ja garante que so um efeito comercial foi aplicado, entao ignoramos o conflito aqui.
  }
}

function mapMercadoPagoStatus(
  status: ReturnType<typeof normalizeMercadoPagoSubscriptionStatus>,
): SubscriptionStatus | null {
  switch (status) {
    case "active":
      return SubscriptionStatus.ACTIVE;
    case "pending":
      return SubscriptionStatus.PENDING;
    case "paused":
      return SubscriptionStatus.PAUSED;
    case "canceled":
      return SubscriptionStatus.CANCELED;
    default:
      return null;
  }
}

function addOneMonth(date: Date) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + 1);
  return next;
}
