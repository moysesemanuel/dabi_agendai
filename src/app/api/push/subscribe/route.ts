import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { resolveErrorResponse } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { getSessionForTenant } from "@/lib/session";
import { getCurrentTenant } from "@/lib/tenant";

const subscribeSchema = z.object({
  endpoint: z.string().trim().min(1),
  keys: z.object({
    p256dh: z.string().trim().min(1),
    auth: z.string().trim().min(1),
  }),
});

const unsubscribeSchema = z.object({
  endpoint: z.string().trim().min(1),
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

    const parsedBody = subscribeSchema.safeParse(await request.json());

    if (!parsedBody.success) {
      return NextResponse.json({ error: "Inscricao de notificacao invalida." }, { status: 400 });
    }

    const { endpoint, keys } = parsedBody.data;

    await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: { p256dh: keys.p256dh, auth: keys.auth },
      create: {
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        tenantId: result.tenant.id,
        customerId: result.session.id,
      },
    });

    return NextResponse.json({ message: "Notificacoes no navegador ativadas." });
  } catch (error) {
    const { message, status } = resolveErrorResponse(error, "Nao foi possivel ativar as notificacoes.");
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const result = await requireAdmin(request);

    if ("error" in result) {
      return result.error;
    }

    const parsedBody = unsubscribeSchema.safeParse(await request.json());

    if (!parsedBody.success) {
      return NextResponse.json({ error: "Inscricao de notificacao invalida." }, { status: 400 });
    }

    await prisma.pushSubscription.deleteMany({
      where: { endpoint: parsedBody.data.endpoint, tenantId: result.tenant.id },
    });

    return NextResponse.json({ message: "Notificacoes no navegador desativadas." });
  } catch (error) {
    const { message, status } = resolveErrorResponse(error, "Nao foi possivel desativar as notificacoes.");
    return NextResponse.json({ error: message }, { status });
  }
}
