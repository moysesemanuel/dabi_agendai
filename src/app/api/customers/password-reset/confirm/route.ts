import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentTenant } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { verifyPasswordResetToken } from "@/lib/password-reset";
import { hashPassword } from "@/lib/password";

const bodySchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(6),
});

export async function POST(request: NextRequest) {
  const tenant = await getCurrentTenant(request);

  if (!tenant) {
    return NextResponse.json({ error: "Site nao encontrado." }, { status: 404 });
  }

  const parsedBody = bodySchema.safeParse(await request.json());

  if (!parsedBody.success) {
    return NextResponse.json({ error: "Preencha uma senha com pelo menos 6 caracteres." }, { status: 400 });
  }

  const payload = await verifyPasswordResetToken(parsedBody.data.token);

  if (!payload || payload.tenantId !== tenant.id) {
    return NextResponse.json({ error: "Link invalido ou expirado. Solicite um novo." }, { status: 400 });
  }

  await prisma.customer.update({
    where: { id: payload.customerId, tenantId: tenant.id },
    data: { passwordHash: hashPassword(parsedBody.data.newPassword) },
  });

  return NextResponse.json({ message: "Senha redefinida com sucesso." });
}
