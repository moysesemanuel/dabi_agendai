import { prisma } from "@/lib/prisma";
import type {
  BarberItem,
  BarberTimeOffItem,
  ClosedDateItem,
  ProductItem,
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

async function syncServices(tenantId: string, services: ServiceItem[]) {
  const currentNames = services.map((service) => service.name.trim()).filter(Boolean);

  for (const service of services) {
    const name = service.name.trim();

    if (!name) {
      continue;
    }

    await prisma.service.upsert({
      where: { tenantId_name: { tenantId, name } },
      update: {
        description: service.description,
        priceInCents: parseMoneyToCents(service.price),
        durationMinutes: parseDurationToMinutes(service.duration),
        active: true,
      },
      create: {
        tenantId,
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
      tenantId,
      name: {
        notIn: currentNames.length > 0 ? currentNames : ["__none__"],
      },
    },
    data: {
      active: false,
    },
  });
}

async function syncProducts(tenantId: string, products: ProductItem[]) {
  const currentNames = products.map((product) => product.name.trim()).filter(Boolean);

  for (const product of products) {
    const name = product.name.trim();

    if (!name) {
      continue;
    }

    await prisma.product.upsert({
      where: { tenantId_name: { tenantId, name } },
      update: {
        description: product.description,
        priceInCents: parseMoneyToCents(product.price),
        image: product.image,
        active: true,
      },
      create: {
        tenantId,
        name,
        description: product.description,
        priceInCents: parseMoneyToCents(product.price),
        image: product.image,
        active: true,
      },
    });
  }

  await prisma.product.updateMany({
    where: {
      tenantId,
      name: {
        notIn: currentNames.length > 0 ? currentNames : ["__none__"],
      },
    },
    data: {
      active: false,
    },
  });
}

async function syncBarbers(tenantId: string, barbers: BarberItem[]) {
  const currentNames = barbers.map((barber) => barber.name.trim()).filter(Boolean);

  for (const barber of barbers) {
    const name = barber.name.trim();

    if (!name) {
      continue;
    }

    await prisma.barber.upsert({
      where: { tenantId_name: { tenantId, name } },
      update: {
        role: barber.role,
        active: true,
      },
      create: {
        tenantId,
        name,
        role: barber.role,
        active: true,
      },
    });
  }

  await prisma.barber.updateMany({
    where: {
      tenantId,
      name: {
        notIn: currentNames.length > 0 ? currentNames : ["__none__"],
      },
    },
    data: {
      active: false,
    },
  });
}

async function syncClosedDates(tenantId: string, closedDates: ClosedDateItem[]) {
  const currentDates = closedDates.map((item) => item.date);

  for (const item of closedDates) {
    await prisma.closedDate.upsert({
      where: { tenantId_date: { tenantId, date: item.date } },
      update: {
        reason: item.reason,
      },
      create: {
        tenantId,
        date: item.date,
        reason: item.reason,
      },
    });
  }

  await prisma.closedDate.deleteMany({
    where: {
      tenantId,
      date: {
        notIn: currentDates.length > 0 ? currentDates : ["__none__"],
      },
    },
  });
}

async function syncBarberTimeOff(tenantId: string, barberTimeOff: BarberTimeOffItem[]) {
  const barbers = await prisma.barber.findMany({
    where: { tenantId },
    select: { id: true, name: true },
  });
  const barberIdByName = new Map(barbers.map((barber) => [barber.name, barber.id]));

  const validEntries = barberTimeOff
    .map((item) => ({
      barberId: barberIdByName.get(item.barberName.trim()),
      date: item.date,
      reason: item.reason,
    }))
    .filter((item): item is { barberId: string; date: string; reason: string } =>
      Boolean(item.barberId),
    );

  for (const entry of validEntries) {
    await prisma.barberTimeOff.upsert({
      where: { barberId_date: { barberId: entry.barberId, date: entry.date } },
      update: { reason: entry.reason },
      create: { ...entry, tenantId },
    });
  }

  const keepKeys = new Set(validEntries.map((entry) => `${entry.barberId}__${entry.date}`));
  const existingRows = await prisma.barberTimeOff.findMany({
    where: { tenantId },
    select: { id: true, barberId: true, date: true },
  });
  const idsToDelete = existingRows
    .filter((row) => !keepKeys.has(`${row.barberId}__${row.date}`))
    .map((row) => row.id);

  if (idsToDelete.length > 0) {
    await prisma.barberTimeOff.deleteMany({ where: { id: { in: idsToDelete }, tenantId } });
  }
}

async function saveSiteConfig(tenantId: string, config: SiteConfig) {
  await prisma.siteSettings.upsert({
    where: { tenantId },
    update: { data: config },
    create: { tenantId, data: config },
  });
}

export async function syncOperationalData(tenantId: string, config: SiteConfig) {
  await syncServices(tenantId, config.services);
  await syncProducts(tenantId, config.products);
  await syncBarbers(tenantId, config.barbers);
  await syncClosedDates(tenantId, config.closedDates);
  await syncBarberTimeOff(tenantId, config.barberTimeOff);
  await saveSiteConfig(tenantId, config);
}
