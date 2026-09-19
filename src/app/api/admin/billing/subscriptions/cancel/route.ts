import { NextRequest, NextResponse } from "next/server";
import { cancelTenantSubscription } from "@/lib/billing/subscription-service";
import { resolveErrorResponse } from "@/lib/errors";
import { getSessionForTenant } from "@/lib/session";
import { getCurrentTenant } from "@/lib/tenant";

export async function POST(request: NextRequest) {
  try {
    const tenant = await getCurrentTenant(request);

    if (!tenant) {
      return NextResponse.json({ error: "Site nao encontrado." }, { status: 404 });
    }

    const session = await getSessionForTenant(request, tenant.id);

    if (!session || session.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Apenas o administrador pode cancelar a assinatura." },
        { status: 403 },
      );
    }

    const subscription = await cancelTenantSubscription(tenant.id);

    return NextResponse.json({
      status: subscription.status,
      currentPeriodEnd: subscription.currentPeriodEnd,
    });
  } catch (error) {
    const { message, status } = resolveErrorResponse(error, "Nao foi possivel cancelar a assinatura.");
    return NextResponse.json({ error: message }, { status });
  }
}
