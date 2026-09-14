import { NextRequest, NextResponse } from "next/server";
import { resolveErrorResponse } from "@/lib/errors";
import { getLoyaltyBalance } from "@/lib/loyalty";
import { getSessionForTenant } from "@/lib/session";
import { getCurrentTenant } from "@/lib/tenant";

export async function GET(request: NextRequest) {
  try {
    const tenant = await getCurrentTenant(request);

    if (!tenant) {
      return NextResponse.json({ error: "Site nao encontrado." }, { status: 404 });
    }

    const customerId = request.nextUrl.searchParams.get("customerId")?.trim();

    if (!customerId) {
      return NextResponse.json(
        { error: "Cliente nao informado." },
        { status: 400 },
      );
    }

    const session = await getSessionForTenant(request, tenant.id);

    if (!session || (session.role !== "ADMIN" && session.id !== customerId)) {
      return NextResponse.json(
        { error: "Voce nao tem permissao para ver essa fidelidade." },
        { status: 403 },
      );
    }

    const balance = await getLoyaltyBalance(tenant.id, customerId);

    return NextResponse.json({
      points: balance.earnedPoints,
      completedAppointments: balance.completedAppointments,
      availablePoints: balance.availablePoints,
      redeemedPoints: balance.redeemedPoints,
      nextRewardIn: balance.nextRewardIn,
    });
  } catch (error) {
    const { message, status } = resolveErrorResponse(
      error,
      "Nao foi possivel consultar a fidelidade.",
    );
    return NextResponse.json({ error: message }, { status });
  }
}
