import { prisma } from "@/lib/prisma";
import type {
  BarberItem,
  ClosedDateItem,
  ServiceItem,
  SiteConfig,
} from "@/components/shared/site-config";

function parseMoneyToCents(price: string) {
  const numeric = price.replace(/[^\d,]/g, "").replace(",", ".");
  return Math.round(Number(numeric || "0") * 100);
}

function parseDurationToMinutes(duration: string) {
  const minutes = Number(duration.replace(/[^\d]/g, ""));
  return Number.isFinite(minutes) ? minutes : 30;
}

async function syncServices(services: ServiceItem[]) {
  const currentNames = services.map((service) => service.name.trim()).filter(Boolean);

  for (const service of services) {
    const name = service.name.trim();

    if (!name) {
      continue;
    }

    await prisma.service.upsert({
      where: { name },
      update: {
        description: service.description,
        priceInCents: parseMoneyToCents(service.price),
        durationMinutes: parseDurationToMinutes(service.duration),
        active: true,
      },
      create: {
        name,
        description: service.description,
        priceInCents: parseMoneyToCents(service.price),
        durationMinutes: parseDurationToMinutes(service.duration),
        active: true,
      },
    });
  }

  await prisma.service.updateMany({
    where: {
      name: {
        notIn: currentNames.length > 0 ? currentNames : ["__none__"],
      },
    },
    data: {
      active: false,
    },
  });
}

async function syncBarbers(barbers: BarberItem[]) {
  const currentNames = barbers.map((barber) => barber.name.trim()).filter(Boolean);

  for (const barber of barbers) {
    const name = barber.name.trim();

    if (!name) {
      continue;
    }

    await prisma.barber.upsert({
      where: { name },
      update: {
        role: barber.role,
        active: true,
      },
      create: {
        name,
        role: barber.role,
        active: true,
      },
    });
  }

  await prisma.barber.updateMany({
    where: {
      name: {
        notIn: currentNames.length > 0 ? currentNames : ["__none__"],
      },
    },
    data: {
      active: false,
    },
  });
}

async function syncClosedDates(closedDates: ClosedDateItem[]) {
  const currentDates = closedDates.map((item) => item.date);

  for (const item of closedDates) {
    await prisma.closedDate.upsert({
      where: { date: item.date },
      update: {
        reason: item.reason,
      },
      create: {
        date: item.date,
        reason: item.reason,
      },
    });
  }

  await prisma.closedDate.deleteMany({
    where: {
      date: {
        notIn: currentDates.length > 0 ? currentDates : ["__none__"],
      },
    },
  });
}

async function saveSiteConfig(config: SiteConfig) {
  await prisma.siteSettings.upsert({
    where: { id: "singleton" },
    update: { data: config },
    create: { id: "singleton", data: config },
  });
}

export async function syncOperationalData(config: SiteConfig) {
  await syncServices(config.services);
  await syncBarbers(config.barbers);
  await syncClosedDates(config.closedDates);
  await saveSiteConfig(config);
}
