import { NextRequest, NextResponse } from "next/server";
import {
  createAppointment,
  ensureBookingSeedData,
  getBarberByName,
  getServiceByName,
  SAO_PAULO_OFFSET,
  upsertCustomerProfile,
} from "@/lib/booking";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/session";

type CreateAppointmentBody = {
  serviceName?: string;
  barberName?: string;
  date?: string;
  time?: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  preferSilent?: boolean;
  notes?: string;
};

export async function GET(request: NextRequest) {
  try {
    await ensureBookingSeedData();

    const session = await getSessionFromRequest(request);
    const date = request.nextUrl.searchParams.get("date");
    const requestedCustomerId = request.nextUrl.searchParams.get("customerId");

    if (!session) {
      return NextResponse.json(
        { error: "Faca login para consultar agendamentos." },
        { status: 401 },
      );
    }

    const isAdmin = session.role === "ADMIN";

    if (!isAdmin && requestedCustomerId && requestedCustomerId !== session.id) {
      return NextResponse.json(
        { error: "Voce nao tem permissao para ver esses agendamentos." },
        { status: 403 },
      );
    }

    if (!isAdmin && !requestedCustomerId) {
      return NextResponse.json(
        { error: "Informe o seu customerId para consultar seus agendamentos." },
        { status: 403 },
      );
    }

    const customerId = isAdmin ? requestedCustomerId : session.id;
    const where = {
      ...(date
        ? {
            startsAt: {
              gte: new Date(`${date}T00:00:00${SAO_PAULO_OFFSET}`),
              lte: new Date(`${date}T23:59:59${SAO_PAULO_OFFSET}`),
            },
          }
        : {}),
      ...(customerId ? { customerId } : {}),
    };

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        barber: true,
        service: true,
      },
      orderBy: {
        startsAt: "asc",
      },
    });

    return NextResponse.json({
      appointments: appointments.map((appointment) => ({
        id: appointment.id,
        customerName: appointment.customerName,
        customerPhone: appointment.customerPhone,
        customerEmail: appointment.customerEmail,
        notes: appointment.notes,
        preferSilent: appointment.preferSilent,
        status: appointment.status,
        startsAt: appointment.startsAt,
        endsAt: appointment.endsAt,
        barberName: appointment.barber.name,
        serviceName: appointment.service.name,
        servicePriceInCents: appointment.service.priceInCents,
        serviceDurationMinutes: appointment.service.durationMinutes,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Nao foi possivel carregar os agendamentos.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureBookingSeedData();

    const body = (await request.json()) as CreateAppointmentBody;
    const requiredFields = [
      body.serviceName,
      body.barberName,
      body.date,
      body.time,
      body.customerId ?? body.customerName,
      body.customerPhone,
    ];

    if (requiredFields.some((value) => !value?.trim())) {
      return NextResponse.json(
        { error: "Preencha os campos obrigatorios para concluir o agendamento." },
        { status: 400 },
      );
    }

    if (body.customerId?.trim()) {
      const session = await getSessionFromRequest(request);

      if (!session || session.id !== body.customerId.trim()) {
        return NextResponse.json(
          { error: "Faca login novamente para agendar com sua conta." },
          { status: 401 },
        );
      }
    }

    const [service, barber] = await Promise.all([
      getServiceByName(body.serviceName!.trim()),
      getBarberByName(body.barberName!.trim()),
    ]);

    if (!service || !barber) {
      return NextResponse.json(
        { error: "Servico ou profissional nao encontrado na agenda." },
        { status: 400 },
      );
    }

    const customer =
      body.customerId?.trim()
        ? await prisma.customer.findUnique({ where: { id: body.customerId.trim() } })
        : await upsertCustomerProfile({
            name: body.customerName!.trim(),
            phone: body.customerPhone!.trim(),
            email: body.customerEmail,
          });

    if (!customer) {
      return NextResponse.json(
        { error: "Cliente nao encontrado. Faca login novamente." },
        { status: 400 },
      );
    }

    const appointment = await createAppointment({
      service,
      barber,
      date: body.date!.trim(),
      time: body.time!.trim(),
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      customerEmail: customer.email ?? undefined,
      preferSilent: body.preferSilent,
      notes: body.notes,
    });

    return NextResponse.json({
      id: appointment.id,
      message: "Agendamento confirmado com sucesso.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Nao foi possivel concluir o agendamento.",
      },
      { status: 400 },
    );
  }
}
