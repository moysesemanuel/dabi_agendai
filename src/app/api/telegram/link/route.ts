import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { resolveErrorResponse } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { createTelegramLinkCode } from "@/lib/notifications/telegram-link";
import { getSessionForTenant } from "@/lib/session";
import { getCurrentTenant } from "@/lib/tenant";

const unlinkSchema = z.object({
  id: z.string().trim().min(1),
});

async function requireAdmin(request: NextRequest) {
  const tenant = await getCurrentTenant(request);

  if (!tenant) {
    return { error: NextResponse.json({ error: "Site nao encontrado." }, { status: 404 }) } as const;
  }

  const session = await getSessionForTenant(request, tenant.id);

  if (!session || session.role !== "ADMIN") {
    return {
      error: NextResponse.json(
        { error: "Apenas o administrador pode gerenciar notificacoes." },
        { status: 403 },
      ),
    } as const;
  }

  return { tenant, session } as const;
}

export async function POST(request: NextRequest) {
  try {
    const result = await requireAdmin(request);

    if ("error" in result) {
      return result.error;
    }

    const { url, expiresAt } = await createTelegramLinkCode(result.tenant.id, result.session.id);

    return NextResponse.json({ url, expiresAt });
  } catch (error) {
    const { message, status } = resolveErrorResponse(error, "Nao foi possivel gerar o link do Telegram.");
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const result = await requireAdmin(request);

    if ("error" in result) {
      return result.error;
    }

    const parsedBody = unlinkSchema.safeParse(await request.json());

    if (!parsedBody.success) {
      return NextResponse.json({ error: "Informe o vinculo a remover." }, { status: 400 });
    }

    await prisma.telegramLink.deleteMany({
      where: { id: parsedBody.data.id, tenantId: result.tenant.id },
    });

    return NextResponse.json({ message: "Telegram desconectado." });
  } catch (error) {
    const { message, status } = resolveErrorResponse(error, "Nao foi possivel desconectar o Telegram.");
    return NextResponse.json({ error: message }, { status });
  }
}
