import { AppointmentStatus, Prisma, type Barber, type Service } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { UserFacingError } from "@/lib/errors";

type PrismaTransactionClient = Prisma.TransactionClient;
type DbClient = typeof prisma | PrismaTransactionClient;

const SLOT_INTERVAL_MINUTES = 30;
const SEARCH_WINDOW_DAYS = 21;

const DEFAULT_SERVICE_SEED = [
  {
    name: "Cabelo",
    description: "Corte personalizado com acabamento preciso.",
    price: "R$ 60",
    duration: "40 min",
  },
  {
    name: "Barba",
    description: "Barba com alinhamento, toalha quente e acabamento na navalha.",
    price: "R$ 45",
    duration: "30 min",
  },
  {
    name: "Combo Executivo",
    description:
      "Cabelo e barba em uma única sessão para sair pronto para qualquer ocasião.",
    price: "R$ 90",
    duration: "70 min",
  },
  {
    name: "Hidratação",
    description:
      "Tratamento rápido para recuperar brilho, textura e aparência saudável.",
    price: "R$ 35",
    duration: "20 min",
  },
] as const;

const DEFAULT_BARBER_SEED = [
  {
    name: "Rafael Costa",
    role: "Especialista em degradê e corte social",
  },
  {
    name: "Mateus Lima",
    role: "Barba e acabamento clássico",
  },
  {
    name: "João Vitor",
    role: "Estilos contemporâneos e atendimento premium",
  },
] as const;

const DEFAULT_CLOSED_DATE_SEED = [
  { date: "2026-03-30", reason: "Treinamento interno" },
  { date: "2026-04-21", reason: "Feriado" },
] as const;

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

function getBusinessHours(dateKey: string) {
  const date = new Date(`${dateKey}T12:00:00${SAO_PAULO_OFFSET}`);
  return BUSINESS_HOURS_BY_WEEKDAY[date.getDay()] ?? null;
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

function parseMoneyToCents(price: string) {
  const numeric = price.replace(/[^\d,]/g, "").replace(",", ".");
  return Math.round(Number(numeric || "0") * 100);
}

function parseDurationToMinutes(duration: string) {
  const minutes = Number(duration.replace(/[^\d]/g, ""));
  return Number.isFinite(minutes) ? minutes : 30;
}

async function seedInitialData() {
  const existingServices = await prisma.service.count();
  const existingBarbers = await prisma.barber.count();
  const existingClosedDates = await prisma.closedDate.count();

  if (existingServices === 0) {
    await prisma.service.createMany({
      data: DEFAULT_SERVICE_SEED.map((service) => ({
        name: service.name,
        description: service.description,
        priceInCents: parseMoneyToCents(service.price),
        durationMinutes: parseDurationToMinutes(service.duration),
      })),
    });
  }

  if (existingBarbers === 0) {
    await prisma.barber.createMany({
      data: DEFAULT_BARBER_SEED.map((barber) => ({
        name: barber.name,
        role: barber.role,
      })),
    });
  }

  if (existingClosedDates === 0) {
    await prisma.closedDate.createMany({
      data: DEFAULT_CLOSED_DATE_SEED.map((item) => ({
        date: item.date,
        reason: item.reason,
      })),
    });
  }

  await ensureAdminAccount();
}

async function ensureAdminAccount() {
  const adminEmail = process.env.ADMIN_EMAIL?.trim();
  const adminPassword = process.env.ADMIN_PASSWORD?.trim();

  if (!adminEmail || !adminPassword) {
    return;
  }

  if (adminPassword.length < 8) {
    throw new Error("ADMIN_PASSWORD deve ter pelo menos 8 caracteres.");
  }

  const adminPhone = process.env.ADMIN_PHONE?.replace(/\D/g, "") || "11999990000";
  const adminName = process.env.ADMIN_NAME?.trim() || "Administrador";

  await prisma.customer.upsert({
    where: { phone: adminPhone },
    update: {
      name: adminName,
      email: adminEmail,
      passwordHash: hashPassword(adminPassword),
      role: "ADMIN",
    },
    create: {
      name: adminName,
      phone: adminPhone,
      email: adminEmail,
      passwordHash: hashPassword(adminPassword),
      role: "ADMIN",
    },
  });
}

let bootstrapPromise: Promise<void> | null = null;

export async function ensureBookingSeedData() {
  if (!bootstrapPromise) {
    bootstrapPromise = seedInitialData().catch((error) => {
      bootstrapPromise = null;
      throw error;
    });
  }

  await bootstrapPromise;
}

async function getClosedDateReason(dateKey: string) {
  const closedDate = await prisma.closedDate.findUnique({
    where: { date: dateKey },
  });

  return closedDate?.reason ?? null;
}

async function getBarberTimeOffReason(barberId: string, dateKey: string) {
  const timeOff = await prisma.barberTimeOff.findUnique({
    where: { barberId_date: { barberId, date: dateKey } },
  });

  return timeOff?.reason ?? null;
}

export async function getServiceByName(name: string) {
  return prisma.service.findUnique({
    where: { name },
  });
}

export async function getBarberByName(name: string) {
  return prisma.barber.findUnique({
    where: { name },
  });
}

export async function upsertCustomerProfile(params: {
  name: string;
  phone: string;
  email?: string;
}) {
  const { name, phone, email } = params;

  return prisma.customer.upsert({
    where: { phone },
    update: {
      name,
      email: email?.trim() ? email.trim() : null,
    },
    create: {
      name,
      phone,
      email: email?.trim() ? email.trim() : null,
    },
  });
}

async function listBookableAppointmentsWithOptions(
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
  date: string;
  barber: Barber;
  service: Service;
  excludeAppointmentId?: string;
}) {
  const { date, barber, service, excludeAppointmentId } = params;
  const businessHours = getBusinessHours(date);

  if (!businessHours) {
    return { slots: [] as string[], closedReason: "Fechado neste dia." };
  }

  const closedReason = await getClosedDateReason(date);

  if (closedReason) {
    return { slots: [] as string[], closedReason };
  }

  const barberTimeOffReason = await getBarberTimeOffReason(barber.id, date);

  if (barberTimeOffReason) {
    return { slots: [] as string[], closedReason: barberTimeOffReason };
  }

  const appointments = await listBookableAppointmentsWithOptions(
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

export async function getNextAvailableSlot(service: Service) {
  const activeBarbers = await prisma.barber.findMany({
    where: { active: true },
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
  const businessHours = getBusinessHours(date);

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

  const closedReason = await getClosedDateReason(date);

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
        const appointments = await listBookableAppointmentsWithOptions(barber.id, date, undefined, tx);
        const hasOverlap = appointments.some((appointment) =>
          overlaps(startsAt, endsAt, appointment.startsAt, appointment.endsAt),
        );

        if (hasOverlap) {
          throw new UserFacingError("Esse horario acabou de ser reservado. Escolha outro.");
        }

        return tx.appointment.create({
          data: {
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
  appointmentId: string;
  date: string;
  time: string;
}) {
  const { appointmentId, date, time } = params;

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      barber: true,
      service: true,
    },
  });

  if (!appointment) {
    throw new UserFacingError("Agendamento nao encontrado.");
  }

  const businessHours = getBusinessHours(date);

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

  const closedReason = await getClosedDateReason(date);

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
          where: { id: appointmentId },
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
