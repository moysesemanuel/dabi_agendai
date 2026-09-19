import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { getTelegramBotUsername } from "@/lib/notifications/telegram";

const CODE_TTL_MINUTES = 10;

function generateCode() {
  return randomBytes(12).toString("base64url");
}

export async function createTelegramLinkCode(tenantId: string, customerId: string) {
  const code = generateCode();
  const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60_000);

  await prisma.telegramLinkCode.create({
    data: { code, tenantId, customerId, expiresAt },
  });

  const botUsername = getTelegramBotUsername();

  return {
    url: `https://t.me/${botUsername}?start=${code}`,
    expiresAt,
  };
}

export async function consumeTelegramLinkCode(code: string, chatId: string) {
  const linkCode = await prisma.telegramLinkCode.findUnique({ where: { code } });

  if (!linkCode) {
    return { status: "not_found" as const };
  }

  if (linkCode.consumedAt) {
    return { status: "already_used" as const };
  }

  if (linkCode.expiresAt < new Date()) {
    return { status: "expired" as const };
  }

  await prisma.$transaction([
    prisma.telegramLinkCode.update({
      where: { id: linkCode.id },
      data: { consumedAt: new Date() },
    }),
    prisma.telegramLink.upsert({
      where: { tenantId_chatId: { tenantId: linkCode.tenantId, chatId } },
      update: {},
      create: { tenantId: linkCode.tenantId, customerId: linkCode.customerId, chatId },
    }),
  ]);

  return { status: "linked" as const };
}
