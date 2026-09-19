import { test, expect } from "@playwright/test";
import { SubscriptionStatus } from "@prisma/client";
import { prisma } from "../src/lib/prisma";

// Nao da pra testar a chamada real ao Mercado Pago aqui (sem credenciais em CI
// e sem uma assinatura de verdade pra cancelar) - o que testamos e a regra de
// acesso que roda inteiramente local: cancelado + dentro do periodo ja pago
// ainda libera o /admin, cancelado + periodo vencido bloqueia.
test.describe.serial("gate de acesso apos cancelamento", () => {
  test.skip(
    !process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD,
    "ADMIN_EMAIL/ADMIN_PASSWORD nao configurados neste ambiente.",
  );

  test("mantem acesso durante o periodo de carencia e bloqueia depois dele", async ({ page }) => {
    const loginResponse = await page.request.post("/api/customers/session", {
      data: {
        action: "login",
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD,
      },
    });
    expect(loginResponse.ok()).toBeTruthy();

    const tenant = await prisma.tenant.findUnique({ where: { domain: "localhost:3002" } });

    if (!tenant) {
      throw new Error("Tenant de teste 'localhost:3002' nao encontrado.");
    }

    try {
      await prisma.tenantSubscription.update({
        where: { tenantId: tenant.id },
        data: {
          status: SubscriptionStatus.CANCELED,
          currentPeriodEnd: new Date(Date.now() + 60 * 60 * 1000),
        },
      });

      await page.goto("/admin/agenda");
      await expect(page.getByText("Assinatura pendente")).not.toBeVisible();

      await prisma.tenantSubscription.update({
        where: { tenantId: tenant.id },
        data: { currentPeriodEnd: new Date(Date.now() - 60 * 60 * 1000) },
      });

      await page.goto("/admin/agenda");
      await expect(page.getByText("Assinatura pendente")).toBeVisible();
    } finally {
      await prisma.tenantSubscription.update({
        where: { tenantId: tenant.id },
        data: { status: SubscriptionStatus.ACTIVE, currentPeriodEnd: null },
      });
    }
  });
});
