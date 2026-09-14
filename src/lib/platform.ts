import { UserFacingError } from "@/lib/errors";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

export async function listTenantsWithStats() {
  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { barbers: true, customers: true, appointments: true } },
    },
  });

  return tenants.map((tenant) => ({
    id: tenant.id,
    name: tenant.name,
    domain: tenant.domain,
    active: tenant.active,
    createdAt: tenant.createdAt,
    barbersCount: tenant._count.barbers,
    customersCount: tenant._count.customers,
    appointmentsCount: tenant._count.appointments,
  }));
}

export async function createTenantWithAdmin(input: {
  name: string;
  domain: string;
  adminName: string;
  adminEmail: string;
  adminPhone: string;
  adminPassword: string;
}) {
  const domain = input.domain.toLowerCase().trim();

  const existingTenant = await prisma.tenant.findUnique({ where: { domain } });

  if (existingTenant) {
    throw new UserFacingError(`Ja existe um tenant cadastrado para o dominio "${domain}".`);
  }

  const tenant = await prisma.tenant.create({
    data: { name: input.name, domain },
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

  return { tenant, admin };
}

export async function setTenantActive(tenantId: string, active: boolean) {
  return prisma.tenant.update({
    where: { id: tenantId },
    data: { active },
  });
}
