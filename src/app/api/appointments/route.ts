import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  createAppointment,
  getBarberByName,
  getServiceByName,
  SAO_PAULO_OFFSET,
  upsertCustomerProfile,
} from "@/lib/booking";
import { resolveErrorResponse } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { getSessionForTenant } from "@/lib/session";
import { getCurrentTenant } from "@/lib/tenant";

const listQuerySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data invalida.")
    .optional(),
  customerId: z.string().trim().min(1).optional(),
});

const createAppointmentSchema = z
  .object({
    serviceName: z.string().trim().min(1),
    barberName: z.string().trim().min(1),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data invalida."),
    time: z.string().regex(/^\d{2}:\d{2}$/, "Horario invalido."),
    customerId: z.string().trim().min(1).optional(),
    customerName: z.string().trim().min(1).optional(),
    customerPhone: z.string().trim().min(8).optional(),
    customerEmail: z.string().trim().email().optional().or(z.literal("")),
    preferSilent: z.boolean().optional(),
    notes: z.string().trim().max(500).optional(),
  })
  .refine((data) => data.customerId || (data.customerName && data.customerPhone), {
    message: "Informe seus dados ou faca login para agendar.",
  });

export async function GET(request: NextRequest) {
  try {
    const tenant = await getCurrentTenant(request);

    if (!tenant) {
      return NextResponse.json({ error: "Site nao encontrado." }, { status: 404 });
    }

    const parsedQuery = listQuerySchema.safeParse({
      date: request.nextUrl.searchParams.get("date") ?? undefined,
      customerId: request.nextUrl.searchParams.get("customerId") ?? undefined,
    });

    if (!parsedQuery.success) {
      return NextResponse.json(
        { error: "Parametros de busca invalidos." },
        { status: 400 },
      );
    }

    const { date, customerId: requestedCustomerId } = parsedQuery.data;
    const session = await getSessionForTenant(request, tenant.id);

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
      tenantId: tenant.id,
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
    const { message, status } = resolveErrorResponse(
      error,
      "Nao foi possivel carregar os agendamentos.",
    );
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenant = await getCurrentTenant(request);

    if (!tenant) {
      return NextResponse.json({ error: "Site nao encontrado." }, { status: 404 });
    }

    const parsedBody = createAppointmentSchema.safeParse(await request.json());

    if (!parsedBody.success) {
      return NextResponse.json(
        { error: "Preencha os campos obrigatorios para concluir o agendamento." },
        { status: 400 },
      );
    }

    const body = parsedBody.data;

    if (body.customerId) {
      const session = await getSessionForTenant(request, tenant.id);

      if (!session || session.id !== body.customerId) {
        return NextResponse.json(
          { error: "Faca login novamente para agendar com sua conta." },
          { status: 401 },
        );
      }
    }

    const [service, barber] = await Promise.all([
      getServiceByName(tenant.id, body.serviceName),
      getBarberByName(tenant.id, body.barberName),
    ]);

    if (!service || !barber) {
      return NextResponse.json(
        { error: "Servico ou profissional nao encontrado na agenda." },
        { status: 400 },
      );
    }

    const customer = body.customerId
      ? await prisma.customer.findUnique({
          where: { id: body.customerId, tenantId: tenant.id },
        })
      : await upsertCustomerProfile({
          tenantId: tenant.id,
          name: body.customerName!,
          phone: body.customerPhone!,
          email: body.customerEmail,
        });

    if (!customer) {
      return NextResponse.json(
        { error: "Cliente nao encontrado. Faca login novamente." },
        { status: 400 },
      );
    }

    const appointment = await createAppointment({
      tenantId: tenant.id,
      service,
      barber,
      date: body.date,
      time: body.time,
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
    const { message, status } = resolveErrorResponse(
      error,
      "Nao foi possivel concluir o agendamento.",
    );
    return NextResponse.json({ error: message }, { status });
  }
}
