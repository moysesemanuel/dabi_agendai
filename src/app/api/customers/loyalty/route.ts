import { NextRequest, NextResponse } from "next/server";
import { resolveErrorResponse } from "@/lib/errors";
import { getLoyaltyBalance } from "@/lib/loyalty";
import { getSessionFromRequest } from "@/lib/session";

export async function GET(request: NextRequest) {
  try {
    const customerId = request.nextUrl.searchParams.get("customerId")?.trim();

    if (!customerId) {
      return NextResponse.json(
        { error: "Cliente nao informado." },
        { status: 400 },
      );
    }

    const session = await getSessionFromRequest(request);

    if (!session || (session.role !== "ADMIN" && session.id !== customerId)) {
      return NextResponse.json(
        { error: "Voce nao tem permissao para ver essa fidelidade." },
        { status: 403 },
      );
    }

    const balance = await getLoyaltyBalance(customerId);

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
