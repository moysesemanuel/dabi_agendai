import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  ensureBookingSeedData,
  getBarberByName,
  getNextAvailableSlot,
  getServiceByName,
  getTodayDateKey,
  listAvailableSlots,
} from "@/lib/booking";
import { resolveErrorResponse } from "@/lib/errors";

const availabilityQuerySchema = z.object({
  service: z.string().trim().min(1),
  barber: z.string().trim().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data invalida."),
  excludeAppointmentId: z.string().trim().min(1).optional(),
});

export async function GET(request: NextRequest) {
  try {
    await ensureBookingSeedData();

    const parsedQuery = availabilityQuerySchema.safeParse({
      service: request.nextUrl.searchParams.get("service") ?? undefined,
      barber: request.nextUrl.searchParams.get("barber") ?? undefined,
      date: request.nextUrl.searchParams.get("date") ?? getTodayDateKey(),
      excludeAppointmentId: request.nextUrl.searchParams.get("excludeAppointmentId") ?? undefined,
    });

    if (!parsedQuery.success) {
      return NextResponse.json(
        { error: "Servico e profissional sao obrigatorios." },
        { status: 400 },
      );
    }

    const { service: serviceName, barber: barberName, date, excludeAppointmentId } = parsedQuery.data;

    const [service, barber] = await Promise.all([
      getServiceByName(serviceName),
      getBarberByName(barberName),
    ]);

    if (!service || !barber) {
      return NextResponse.json(
        {
          error:
            "Os dados do site e da agenda ainda nao estao sincronizados. Ajuste isso na proxima etapa do backoffice real.",
        },
        { status: 400 },
      );
    }

    const [availability, nextAvailable] = await Promise.all([
      listAvailableSlots({ date, barber, service, excludeAppointmentId }),
      getNextAvailableSlot(service),
    ]);

    return NextResponse.json({
      slots: availability.slots,
      closedReason: availability.closedReason,
      nextAvailable,
    });
  } catch (error) {
    const { message, status } = resolveErrorResponse(
      error,
      "Nao foi possivel consultar a disponibilidade.",
    );
    return NextResponse.json({ error: message }, { status });
  }
}
