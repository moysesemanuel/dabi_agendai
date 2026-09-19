import { SubscriptionStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { hasActiveTenantAccess } from "./subscription-service";

const HOUR = 60 * 60 * 1000;

describe("hasActiveTenantAccess", () => {
  it("libera acesso quando nao ha nenhuma linha de assinatura (tenant grandfathered)", () => {
    expect(hasActiveTenantAccess(null)).toBe(true);
  });

  it("libera acesso quando a assinatura esta ATIVA", () => {
    expect(
      hasActiveTenantAccess({ status: SubscriptionStatus.ACTIVE, currentPeriodEnd: null }),
    ).toBe(true);
  });

  it("libera acesso quando cancelada mas ainda dentro do periodo ja pago", () => {
    const future = new Date(Date.now() + HOUR);
    expect(
      hasActiveTenantAccess({ status: SubscriptionStatus.CANCELED, currentPeriodEnd: future }),
    ).toBe(true);
  });

  it("bloqueia quando cancelada e o periodo ja pago acabou", () => {
    const past = new Date(Date.now() - HOUR);
    expect(
      hasActiveTenantAccess({ status: SubscriptionStatus.CANCELED, currentPeriodEnd: past }),
    ).toBe(false);
  });

  it("bloqueia quando cancelada sem nenhum currentPeriodEnd registrado", () => {
    expect(
      hasActiveTenantAccess({ status: SubscriptionStatus.CANCELED, currentPeriodEnd: null }),
    ).toBe(false);
  });

  it("bloqueia PENDING e PAUSED independente do currentPeriodEnd", () => {
    const future = new Date(Date.now() + HOUR);
    expect(
      hasActiveTenantAccess({ status: SubscriptionStatus.PENDING, currentPeriodEnd: future }),
    ).toBe(false);
    expect(
      hasActiveTenantAccess({ status: SubscriptionStatus.PAUSED, currentPeriodEnd: future }),
    ).toBe(false);
  });
});
