import { test, expect } from "@playwright/test";

test.describe("smoke", () => {
  test("home carrega e mostra o nome do negocio", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Barbearia CI").first()).toBeVisible();
  });

  test("pagina de agendamento carrega", async ({ page }) => {
    await page.goto("/agendamento");
    await expect(page.getByText("Escolha o serviço")).toBeVisible();
  });

  test("/admin redireciona quando nao autenticado", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForURL(/\/(\?.*)?$/);
    expect(new URL(page.url()).pathname).toBe("/");
  });

  test("cliente consegue criar conta e logar", async ({ page }) => {
    const unique = Date.now();
    const phone = `1190${String(unique).slice(-7)}`;

    await page.goto("/agendamento");
    await page.getByRole("button", { name: "Acesso do cliente" }).click();
    await page.getByRole("button", { name: "Entrar" }).first().click();
    await page.getByRole("button", { name: "Criar conta" }).first().click();

    await page.getByLabel("Nome completo").fill("Cliente Smoke Test");
    await page.getByLabel("E-mail").fill(`smoke${unique}@example.com`);
    await page.getByLabel(/^Senha/).fill("senha123456");
    await page.getByLabel("WhatsApp").fill(phone);
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Criar minha conta" }).click();

    await expect(page.getByText("Conta criada com sucesso.")).toBeVisible({ timeout: 10_000 });
  });

  test("admin consegue logar e acessar o painel", async ({ page }) => {
    test.skip(
      !process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD,
      "ADMIN_EMAIL/ADMIN_PASSWORD nao configurados neste ambiente.",
    );

    const response = await page.request.post("/api/customers/session", {
      data: {
        action: "login",
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD,
      },
    });
    expect(response.ok()).toBeTruthy();

    await page.goto("/admin");
    await expect(page.getByText("Backoffice da barbearia")).toBeVisible();
  });

  test("/platform redireciona para login quando nao autenticado", async ({ page }) => {
    await page.goto("/platform");
    await page.waitForURL(/\/platform\/login$/);
    expect(new URL(page.url()).pathname).toBe("/platform/login");
  });

  test("admin da plataforma consegue logar e ver os tenants", async ({ page }) => {
    test.skip(
      !process.env.PLATFORM_ADMIN_EMAIL || !process.env.PLATFORM_ADMIN_PASSWORD,
      "PLATFORM_ADMIN_EMAIL/PLATFORM_ADMIN_PASSWORD nao configurados neste ambiente.",
    );

    const response = await page.request.post("/api/platform/session", {
      data: {
        email: process.env.PLATFORM_ADMIN_EMAIL,
        password: process.env.PLATFORM_ADMIN_PASSWORD,
      },
    });
    expect(response.ok()).toBeTruthy();

    await page.goto("/platform");
    await expect(page.getByText("Admin da plataforma")).toBeVisible();
    await expect(page.getByText(/^Tenants \(/)).toBeVisible();
  });
});
