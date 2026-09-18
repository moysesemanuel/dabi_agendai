import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentTenant } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { createPasswordResetToken } from "@/lib/password-reset";
import { sendEmail } from "@/lib/email/resend";

const bodySchema = z.object({
  email: z.string().trim().email(),
});

const GENERIC_MESSAGE = "Se existir uma conta com esse e-mail, enviamos um link para redefinir a senha.";

export async function POST(request: NextRequest) {
  const tenant = await getCurrentTenant(request);

  if (!tenant) {
    return NextResponse.json({ error: "Site nao encontrado." }, { status: 404 });
  }

  const parsedBody = bodySchema.safeParse(await request.json());

  if (!parsedBody.success) {
    return NextResponse.json({ error: "Informe um e-mail valido." }, { status: 400 });
  }

  const customer = await prisma.customer.findFirst({
    where: { tenantId: tenant.id, email: parsedBody.data.email.toLowerCase().trim() },
  });

  if (customer?.passwordHash) {
    try {
      const token = await createPasswordResetToken({ customerId: customer.id, tenantId: tenant.id });
      const resetUrl = `https://${tenant.domain}/redefinir-senha?token=${encodeURIComponent(token)}`;

      await sendEmail({
        to: parsedBody.data.email,
        subject: `Redefinir senha - ${tenant.name}`,
        html: `
          <p>Olá${customer.name ? `, ${customer.name}` : ""}!</p>
          <p>Recebemos um pedido para redefinir a senha da sua conta em <strong>${tenant.name}</strong>.</p>
          <p><a href="${resetUrl}">Clique aqui para criar uma nova senha</a>. Este link expira em 1 hora.</p>
          <p>Se você não pediu isso, pode ignorar este e-mail.</p>
        `,
      });
    } catch (error) {
      console.error("password_reset_request.send_failed", error);
    }
  }

  return NextResponse.json({ message: GENERIC_MESSAGE });
}
