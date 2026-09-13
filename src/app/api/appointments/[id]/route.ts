import { AppointmentStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureBookingSeedData, rescheduleAppointment } from "@/lib/booking";
import { getSessionFromRequest } from "@/lib/session";

const allowedStatus = new Set<AppointmentStatus>([
  AppointmentStatus.CONFIRMED,
  AppointmentStatus.CANCELLED,
  AppointmentStatus.COMPLETED,
]);

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await ensureBookingSeedData();
    const { id } = await params;

    const session = await getSessionFromRequest(request);

    if (!session) {
      return NextResponse.json(
        { error: "Faca login para gerenciar este agendamento." },
        { status: 401 },
      );
    }

    const existingAppointment = await prisma.appointment.findUnique({ where: { id } });

    if (!existingAppointment) {
      return NextResponse.json(
        { error: "Agendamento nao encontrado." },
        { status: 404 },
      );
    }

    const isOwner = existingAppointment.customerId === session.id;
    const isAdmin = session.role === "ADMIN";

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "Voce nao tem permissao para alterar este agendamento." },
        { status: 403 },
      );
    }

    const body = (await request.json()) as {
      status?: AppointmentStatus;
      date?: string;
      time?: string;
    };

    if (!isAdmin && body.status && body.status !== AppointmentStatus.CANCELLED) {
      return NextResponse.json(
        { error: "Apenas o estabelecimento pode confirmar ou concluir agendamentos." },
        { status: 403 },
      );
    }

    if (body.date && body.time) {
      const appointment = await rescheduleAppointment({
        appointmentId: id,
        date: body.date,
        time: body.time,
      });

      return NextResponse.json({
        id: appointment.id,
        status: appointment.status,
        startsAt: appointment.startsAt,
        endsAt: appointment.endsAt,
        message: "Agendamento remarcado com sucesso.",
      });
    }

    if (!body.status || !allowedStatus.has(body.status)) {
      return NextResponse.json(
        { error: "Status invalido para atualizacao." },
        { status: 400 },
      );
    }

    const appointment = await prisma.appointment.update({
      where: { id },
      data: {
        status: body.status,
      },
    });

    return NextResponse.json({
      id: appointment.id,
      status: appointment.status,
      message: "Agendamento atualizado com sucesso.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Nao foi possivel atualizar o agendamento.",
      },
      { status: 500 },
    );
  }
}
