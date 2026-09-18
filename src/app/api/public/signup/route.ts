import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createTenantWithAdmin } from "@/lib/platform";
import { generateTenantDomain } from "@/lib/tenant-slug";
import { createSubscriptionCheckout } from "@/lib/billing/subscription-service";
import { resolveErrorResponse } from "@/lib/errors";

const bodySchema = z.object({
  businessName: z.string().trim().min(2),
  adminName: z.string().trim().min(2),
  adminEmail: z.string().trim().email(),
  adminPhone: z.string().trim().min(8),
  adminPassword: z.string().min(6),
  planId: z.enum(["essencial", "completo"]),
});

export async function POST(request: NextRequest) {
  try {
    const parsedBody = bodySchema.safeParse(await request.json());

    if (!parsedBody.success) {
      return NextResponse.json({ error: "Preencha todos os campos corretamente." }, { status: 400 });
    }

    const { businessName, adminName, adminEmail, adminPhone, adminPassword, planId } = parsedBody.data;

    const domain = await generateTenantDomain(businessName);

    const { tenant } = await createTenantWithAdmin({
      name: businessName,
      domain,
      adminName,
      adminEmail,
      adminPhone,
      adminPassword,
      planId,
    });

    const backUrl = new URL("/admin/assinatura", `https://${domain}`).toString();

    const { initPoint } = await createSubscriptionCheckout({
      tenantId: tenant.id,
      planId,
      payerEmail: adminEmail,
      backUrl,
    });

    return NextResponse.json({ initPoint, domain });
  } catch (error) {
    const { message, status } = resolveErrorResponse(
      error,
      "Nao foi possivel iniciar o cadastro. Tente novamente.",
    );
    return NextResponse.json({ error: message }, { status });
  }
}
