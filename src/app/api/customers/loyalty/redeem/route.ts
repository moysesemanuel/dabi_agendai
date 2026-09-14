import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { resolveErrorResponse, UserFacingError } from "@/lib/errors";
import { getLoyaltyBalance } from "@/lib/loyalty";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/session";

const redeemSchema = z.object({
  customerId: z.string().trim().min(1),
  points: z.number().int().positive(),
  rewardTitle: z.string().trim().min(1).max(120),
});

export async function POST(request: NextRequest) {
  try {
    const parsedBody = redeemSchema.safeParse(await request.json());

    if (!parsedBody.success) {
      return NextResponse.json(
        { error: "Dados invalidos para o resgate." },
        { status: 400 },
      );
    }

    const { customerId, points, rewardTitle } = parsedBody.data;
    const session = await getSessionFromRequest(request);

    if (!session || (session.role !== "ADMIN" && session.id !== customerId)) {
      return NextResponse.json(
        { error: "Voce nao tem permissao para resgatar por este cliente." },
        { status: 403 },
      );
    }

    const balance = await prisma.$transaction(
      async (tx) => {
        const current = await getLoyaltyBalance(customerId, tx);

        if (current.availablePoints < points) {
          throw new UserFacingError("Voce nao tem pontos suficientes para este resgate.");
        }

        await tx.loyaltyRedemption.create({
          data: { customerId, points, rewardTitle },
        });

        return getLoyaltyBalance(customerId, tx);
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    return NextResponse.json({
      message: "Resgate confirmado com sucesso.",
      points: balance.earnedPoints,
      completedAppointments: balance.completedAppointments,
      availablePoints: balance.availablePoints,
      redeemedPoints: balance.redeemedPoints,
      nextRewardIn: balance.nextRewardIn,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") {
      return NextResponse.json(
        { error: "Nao foi possivel confirmar o resgate. Tente novamente." },
        { status: 409 },
      );
    }

    const { message, status } = resolveErrorResponse(error, "Nao foi possivel confirmar o resgate.");
    return NextResponse.json({ error: message }, { status });
  }
}
