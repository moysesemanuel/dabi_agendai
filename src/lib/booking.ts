import { AppointmentStatus, Prisma, type Barber, type Service } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { UserFacingError } from "@/lib/errors";

type PrismaTransactionClient = Prisma.TransactionClient;
type DbClient = typeof prisma | PrismaTransactionClient;

const SLOT_INTERVAL_MINUTES = 30;
const SEARCH_WINDOW_DAYS = 21;

type BusinessHours = {
  startMinutes: number;
  endMinutes: number;
};

type SlotCandidate = {
  date: string;
  time: string;
  barberName: string;
};

const BUSINESS_HOURS_BY_WEEKDAY: Record<number, BusinessHours | null> = {
  0: null,
  1: { startMinutes: 9 * 60, endMinutes: 20 * 60 },
  2: { startMinutes: 9 * 60, endMinutes: 20 * 60 },
  3: { startMinutes: 9 * 60, endMinutes: 20 * 60 },
  4: { startMinutes: 9 * 60, endMinutes: 20 * 60 },
  5: { startMinutes: 9 * 60, endMinutes: 20 * 60 },
  6: { startMinutes: 8 * 60, endMinutes: 18 * 60 },
};

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

export function getDateKey(date: Date) {
  // Formata sempre no fuso de America/Sao_Paulo, independente do fuso do servidor
  // (em producao normalmente roda em UTC, o que deslocaria o "dia" perto da meia-noite).
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function getTodayDateKey() {
  return getDateKey(new Date());
}

function getMinutesFromTime(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function getTimeFromMinutes(totalMinutes: number) {
  const hours = `${Math.floor(totalMinutes / 60)}`.padStart(2, "0");
  const minutes = `${totalMinutes % 60}`.padStart(2, "0");
  return `${hours}:${minutes}`;
}

// Brasil nao observa horario de verao desde 2019: America/Sao_Paulo e sempre UTC-3.
export const SAO_PAULO_OFFSET = "-03:00";

type BusinessHoursMap = Record<number, BusinessHours | null>;
type BusinessHoursConfigItem = {
  weekday: number;
  closed: boolean;
  start: string;
  end: string;
};

async function getConfiguredBusinessHoursMap(tenantId: string): Promise<BusinessHoursMap> {
  const settings = await prisma.siteSettings.findUnique({ where: { tenantId } });
  const configured = (settings?.data as { businessHours?: BusinessHoursConfigItem[] } | null)
    ?.businessHours;

  if (!configured || configured.length === 0) {
    return BUSINESS_HOURS_BY_WEEKDAY;
  }

  const map: BusinessHoursMap = {};

  for (const item of configured) {
    map[item.weekday] = item.closed
      ? null
      : { startMinutes: getMinutesFromTime(item.start), endMinutes: getMinutesFromTime(item.end) };
  }

  return map;
}

async function getBusinessHours(tenantId: string, dateKey: string) {
  const date = new Date(`${dateKey}T12:00:00${SAO_PAULO_OFFSET}`);
  const hoursMap = await getConfiguredBusinessHoursMap(tenantId);
  return hoursMap[date.getDay()] ?? null;
}

function combineDateAndTime(dateKey: string, time: string) {
  return new Date(`${dateKey}T${time}:00${SAO_PAULO_OFFSET}`);
}

function overlaps(
  rangeStart: Date,
  rangeEnd: Date,
  appointmentStart: Date,
  appointmentEnd: Date,
) {
  return rangeStart < appointmentEnd && rangeEnd > appointmentStart;
}

async function getClosedDateReason(tenantId: string, dateKey: string) {
  const closedDate = await prisma.closedDate.findUnique({
    where: { tenantId_date: { tenantId, date: dateKey } },
  });

  return closedDate?.reason ?? null;
}

async function getBarberTimeOffReason(barberId: string, dateKey: string) {
  const timeOff = await prisma.barberTimeOff.findUnique({
    where: { barberId_date: { barberId, date: dateKey } },
  });

  return timeOff?.reason ?? null;
}

export async function getServiceByName(tenantId: string, name: string) {
  return prisma.service.findUnique({
    where: { tenantId_name: { tenantId, name } },
  });
}

export async function getBarberByName(tenantId: string, name: string) {
  return prisma.barber.findUnique({
    where: { tenantId_name: { tenantId, name } },
  });
}

export async function upsertCustomerProfile(params: {
  tenantId: string;
  name: string;
  phone: string;
  email?: string;
}) {
  const { tenantId, name, phone, email } = params;

  return prisma.customer.upsert({
    where: { tenantId_phone: { tenantId, phone } },
    update: {
      name,
      email: email?.trim() ? email.trim() : null,
    },
    create: {
      tenantId,
      name,
      phone,
      email: email?.trim() ? email.trim() : null,
    },
  });
}

async function listBookableAppointmentsWithOptions(
  tenantId: string,
  barberId: string,
  dateKey: string,
  excludeAppointmentId?: string,
  client: DbClient = prisma,
) {
  const startOfDay = new Date(`${dateKey}T00:00:00${SAO_PAULO_OFFSET}`);
  const endOfDay = new Date(`${dateKey}T23:59:59${SAO_PAULO_OFFSET}`);

  return client.appointment.findMany({
    where: {
      id: excludeAppointmentId ? { not: excludeAppointmentId } : undefined,
      tenantId,
      barberId,
      status: {
        in: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED],
      },
      startsAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    orderBy: { startsAt: "asc" },
  });
}

export async function listAvailableSlots(params: {
  tenantId: string;
  date: string;
  barber: Barber;
  service: Service;
  excludeAppointmentId?: string;
}) {
  const { tenantId, date, barber, service, excludeAppointmentId } = params;
  const businessHours = await getBusinessHours(tenantId, date);

  if (!businessHours) {
    return { slots: [] as string[], closedReason: "Fechado neste dia." };
  }

  const closedReason = await getClosedDateReason(tenantId, date);

  if (closedReason) {
    return { slots: [] as string[], closedReason };
  }

  const barberTimeOffReason = await getBarberTimeOffReason(barber.id, date);

  if (barberTimeOffReason) {
    return { slots: [] as string[], closedReason: barberTimeOffReason };
  }

  const appointments = await listBookableAppointmentsWithOptions(
    tenantId,
    barber.id,
    date,
    excludeAppointmentId,
  );
  const now = new Date();
  const isToday = date === getTodayDateKey();
  const slots: string[] = [];

  for (
    let currentMinutes = businessHours.startMinutes;
    currentMinutes + service.durationMinutes <= businessHours.endMinutes;
    currentMinutes += SLOT_INTERVAL_MINUTES
  ) {
    const time = getTimeFromMinutes(currentMinutes);
    const slotStart = combineDateAndTime(date, time);
    const slotEnd = new Date(slotStart.getTime() + service.durationMinutes * 60_000);

    if (isToday && slotStart <= now) {
      continue;
    }

    const hasOverlap = appointments.some((appointment) =>
      overlaps(slotStart, slotEnd, appointment.startsAt, appointment.endsAt),
    );

    if (!hasOverlap) {
      slots.push(time);
    }
  }

  return { slots, closedReason: null };
}

export async function getNextAvailableSlot(tenantId: string, service: Service) {
  const activeBarbers = await prisma.barber.findMany({
    where: { tenantId, active: true },
    orderBy: { createdAt: "asc" },
  });

  if (activeBarbers.length === 0) {
    return null;
  }

  const candidates: SlotCandidate[] = [];

  for (let dayOffset = 0; dayOffset < SEARCH_WINDOW_DAYS; dayOffset += 1) {
    const dateKey = getDateKey(addDays(new Date(), dayOffset));

    for (const barber of activeBarbers) {
      const { slots } = await listAvailableSlots({
        tenantId,
        date: dateKey,
        barber,
        service,
      });

      if (slots.length > 0) {
        candidates.push({
          date: dateKey,
          time: slots[0],
          barberName: barber.name,
        });
      }
    }

    if (candidates.length > 0) {
      return candidates.sort((left, right) => {
        const leftDate = combineDateAndTime(left.date, left.time).getTime();
        const rightDate = combineDateAndTime(right.date, right.time).getTime();
        return leftDate - rightDate;
      })[0];
    }
  }

  return null;
}

export async function createAppointment(params: {
  tenantId: string;
  barber: Barber;
  service: Service;
  date: string;
  time: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  preferSilent?: boolean;
  notes?: string;
}) {
  const {
    tenantId,
    barber,
    service,
    date,
    time,
    customerId,
    customerName,
    customerPhone,
    customerEmail,
    preferSilent,
    notes,
  } = params;
  const businessHours = await getBusinessHours(tenantId, date);

  if (!businessHours) {
    throw new UserFacingError("A barbearia nao atende nesta data.");
  }

  const startMinutes = getMinutesFromTime(time);

  if (
    startMinutes < businessHours.startMinutes ||
    startMinutes + service.durationMinutes > businessHours.endMinutes
  ) {
    throw new UserFacingError("Horario fora do expediente.");
  }

  const closedReason = await getClosedDateReason(tenantId, date);

  if (closedReason) {
    throw new UserFacingError(`Agenda bloqueada: ${closedReason}.`);
  }

  const barberTimeOffReason = await getBarberTimeOffReason(barber.id, date);

  if (barberTimeOffReason) {
    throw new UserFacingError(`Profissional de folga: ${barberTimeOffReason}.`);
  }

  const startsAt = combineDateAndTime(date, time);
  const endsAt = new Date(startsAt.getTime() + service.durationMinutes * 60_000);

  if (startsAt <= new Date()) {
    throw new UserFacingError("Escolha um horario futuro.");
  }

  try {
    return await prisma.$transaction(
      async (tx) => {
        const appointments = await listBookableAppointmentsWithOptions(
          tenantId,
          barber.id,
          date,
          undefined,
          tx,
        );
        const hasOverlap = appointments.some((appointment) =>
          overlaps(startsAt, endsAt, appointment.startsAt, appointment.endsAt),
        );

        if (hasOverlap) {
          throw new UserFacingError("Esse horario acabou de ser reservado. Escolha outro.");
        }

        return tx.appointment.create({
          data: {
            tenantId,
            customerId,
            barberId: barber.id,
            serviceId: service.id,
            customerName,
            customerPhone,
            customerEmail: customerEmail?.trim() ? customerEmail.trim() : null,
            preferSilent: Boolean(preferSilent),
            notes: notes?.trim() ? notes.trim() : null,
            startsAt,
            endsAt,
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") {
      throw new UserFacingError("Esse horario acabou de ser reservado. Escolha outro.");
    }

    throw error;
  }
}

export async function rescheduleAppointment(params: {
  tenantId: string;
  appointmentId: string;
  date: string;
  time: string;
}) {
  const { tenantId, appointmentId, date, time } = params;

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId, tenantId },
    include: {
      barber: true,
      service: true,
    },
  });

  if (!appointment) {
    throw new UserFacingError("Agendamento nao encontrado.");
  }

  const businessHours = await getBusinessHours(tenantId, date);

  if (!businessHours) {
    throw new UserFacingError("A barbearia nao atende nesta data.");
  }

  const startMinutes = getMinutesFromTime(time);

  if (
    startMinutes < businessHours.startMinutes ||
    startMinutes + appointment.service.durationMinutes > businessHours.endMinutes
  ) {
    throw new UserFacingError("Horario fora do expediente.");
  }

  const closedReason = await getClosedDateReason(tenantId, date);

  if (closedReason) {
    throw new UserFacingError(`Agenda bloqueada: ${closedReason}.`);
  }

  const barberTimeOffReason = await getBarberTimeOffReason(appointment.barberId, date);

  if (barberTimeOffReason) {
    throw new UserFacingError(`Profissional de folga: ${barberTimeOffReason}.`);
  }

  const startsAt = combineDateAndTime(date, time);
  const endsAt = new Date(
    startsAt.getTime() + appointment.service.durationMinutes * 60_000,
  );

  if (startsAt <= new Date()) {
    throw new UserFacingError("Escolha um horario futuro.");
  }

  try {
    return await prisma.$transaction(
      async (tx) => {
        const appointments = await listBookableAppointmentsWithOptions(
          tenantId,
          appointment.barberId,
          date,
          appointmentId,
          tx,
        );
        const hasOverlap = appointments.some((item) =>
          overlaps(startsAt, endsAt, item.startsAt, item.endsAt),
        );

        if (hasOverlap) {
          throw new UserFacingError("Esse horario acabou de ser reservado. Escolha outro.");
        }

        return tx.appointment.update({
          where: { id: appointmentId, tenantId },
          data: {
            startsAt,
            endsAt,
            status: AppointmentStatus.SCHEDULED,
          },
          include: {
            barber: true,
            service: true,
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") {
      throw new UserFacingError("Esse horario acabou de ser reservado. Escolha outro.");
    }

    throw error;
  }
}
