import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentTenant } from "@/lib/tenant";
import { isPlanId } from "@/lib/billing/plans";
import { createSubscriptionCheckout } from "@/lib/billing/subscription-service";
import { resolveErrorResponse } from "@/lib/errors";

const bodySchema = z.object({
  planId: z.string(),
  payerEmail: z.string().email(),
});

export async function POST(request: NextRequest) {
  try {
    const tenant = await getCurrentTenant(request);

    if (!tenant) {
      return NextResponse.json({ error: "Site nao encontrado." }, { status: 404 });
    }

    const parsedBody = bodySchema.safeParse(await request.json());

    if (!parsedBody.success || !isPlanId(parsedBody.data.planId)) {
      return NextResponse.json({ error: "Plano invalido." }, { status: 400 });
    }

    const backUrl = new URL("/admin/assinatura", request.nextUrl.origin).toString();

    const { initPoint } = await createSubscriptionCheckout({
      tenantId: tenant.id,
      planId: parsedBody.data.planId,
      payerEmail: parsedBody.data.payerEmail,
      backUrl,
    });

    return NextResponse.json({ initPoint });
  } catch (error) {
    const { message, status } = resolveErrorResponse(
      error,
      "Nao foi possivel iniciar o checkout da assinatura.",
    );
    return NextResponse.json({ error: message }, { status });
  }
}
