import { NextRequest, NextResponse } from "next/server";
import { resolveErrorResponse } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { clearSessionCookie, getSessionForTenant } from "@/lib/session";
import { getCurrentTenant } from "@/lib/tenant";

const ANONYMIZED_NAME = "Cliente removido";

export async function DELETE(request: NextRequest) {
  try {
    const tenant = await getCurrentTenant(request);

    if (!tenant) {
      return NextResponse.json({ error: "Site nao encontrado." }, { status: 404 });
    }

    const session = await getSessionForTenant(request, tenant.id);

    if (!session) {
      return NextResponse.json(
        { error: "Faca login para excluir sua conta." },
        { status: 401 },
      );
    }

    const anonymizedPhone = `removido-${session.id}`;

    await prisma.$transaction([
      prisma.customer.update({
        where: { id: session.id, tenantId: tenant.id },
        data: {
          name: ANONYMIZED_NAME,
          phone: anonymizedPhone,
          email: null,
          passwordHash: null,
        },
      }),
      prisma.appointment.updateMany({
        where: { customerId: session.id, tenantId: tenant.id },
        data: {
          customerName: ANONYMIZED_NAME,
          customerPhone: anonymizedPhone,
          customerEmail: null,
        },
      }),
    ]);

    const response = NextResponse.json({
      message: "Sua conta e seus dados pessoais foram removidos.",
    });
    clearSessionCookie(response);

    return response;
  } catch (error) {
    const { message, status } = resolveErrorResponse(
      error,
      "Nao foi possivel excluir sua conta.",
    );
    return NextResponse.json({ error: message }, { status });
  }
}
