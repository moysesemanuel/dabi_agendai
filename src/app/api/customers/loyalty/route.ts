import { NextRequest, NextResponse } from "next/server";
import { AppointmentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
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

    const completedAppointments = await prisma.appointment.count({
      where: {
        customerId,
        status: AppointmentStatus.COMPLETED,
      },
    });

    const points = completedAppointments * 10;
    const nextRewardThreshold = Math.ceil(Math.max(points, 1) / 100) * 100;

    return NextResponse.json({
      points,
      completedAppointments,
      nextRewardIn: nextRewardThreshold - points || 100,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Nao foi possivel consultar a fidelidade.",
      },
      { status: 500 },
    );
  }
}
