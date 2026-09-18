import { UserFacingError } from "@/lib/errors";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { getPlan, type PlanId } from "@/lib/billing/plans";

export async function listTenantsWithStats() {
  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { barbers: true, customers: true, appointments: true } },
      subscription: true,
    },
  });

  return tenants.map((tenant) => ({
    id: tenant.id,
    name: tenant.name,
    domain: tenant.domain,
    active: tenant.active,
    brandColor: tenant.brandColor,
    createdAt: tenant.createdAt,
    barbersCount: tenant._count.barbers,
    customersCount: tenant._count.customers,
    appointmentsCount: tenant._count.appointments,
    subscriptionStatus: tenant.subscription?.status ?? null,
    subscriptionPlanId: tenant.subscription?.planId ?? null,
  }));
}

export async function createTenantWithAdmin(input: {
  name: string;
  domain: string;
  adminName: string;
  adminEmail: string;
  adminPhone: string;
  adminPassword: string;
  planId: PlanId;
}) {
  const domain = input.domain.toLowerCase().trim();

  const existingTenant = await prisma.tenant.findUnique({ where: { domain } });

  if (existingTenant) {
    throw new UserFacingError(`Ja existe um tenant cadastrado para o dominio "${domain}".`);
  }

  const tenant = await prisma.tenant.create({
    data: { name: input.name, domain },
  });

  const plan = getPlan(input.planId);

  await prisma.tenantSubscription.create({
    data: {
      tenantId: tenant.id,
      planId: input.planId,
      amountCents: plan.amountCents,
    },
  });

  const admin = await prisma.customer.create({
    data: {
      tenantId: tenant.id,
      name: input.adminName,
      email: input.adminEmail.toLowerCase().trim(),
      phone: input.adminPhone.replace(/\D/g, ""),
      passwordHash: hashPassword(input.adminPassword),
      role: "ADMIN",
    },
  });

  await createNotification({
    type: "SYSTEM",
    title: "Novo tenant criado",
    message: `${tenant.name} (${tenant.domain})`,
    tenantId: tenant.id,
  });

  return { tenant, admin };
}

export async function setTenantActive(tenantId: string, active: boolean) {
  const tenant = await prisma.tenant.update({
    where: { id: tenantId },
    data: { active },
  });

  await createNotification({
    type: "SYSTEM",
    title: active ? "Tenant reativado" : "Tenant desativado",
    message: `${tenant.name} (${tenant.domain})`,
    tenantId: tenant.id,
  });

  return tenant;
}

export async function setTenantBrandColor(tenantId: string, brandColor: string) {
  return prisma.tenant.update({
    where: { id: tenantId },
    data: { brandColor },
  });
}

export async function createNotification(input: {
  type: "SUPPORT" | "SYSTEM";
  title: string;
  message: string;
  tenantId?: string;
}) {
  return prisma.notification.create({
    data: {
      type: input.type,
      title: input.title,
      message: input.message,
      tenantId: input.tenantId,
    },
  });
}

export async function listNotifications() {
  const notifications = await prisma.notification.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { tenant: { select: { name: true } } },
  });

  return notifications.map((notification) => ({
    id: notification.id,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    read: notification.read,
    createdAt: notification.createdAt,
    tenantName: notification.tenant?.name ?? null,
  }));
}

export async function markNotificationRead(id: string, read: boolean) {
  return prisma.notification.update({
    where: { id },
    data: { read },
  });
}
