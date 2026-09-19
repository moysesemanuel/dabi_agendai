import { notFound } from "next/navigation";
import { AdminNotificationsPage } from "@/components/projects/barbershop/admin/admin-notifications-page";
import { prisma } from "@/lib/prisma";
import { getCurrentTenant } from "@/lib/tenant";
import { loadSiteConfigForCurrentTenant } from "@/lib/site-config-server";

export const dynamic = "force-dynamic";

export default async function Page() {
  const tenant = await getCurrentTenant();

  if (!tenant) {
    notFound();
  }

  const [pushDeviceCount, telegramLinks, { config }] = await Promise.all([
    prisma.pushSubscription.count({ where: { tenantId: tenant.id } }),
    prisma.telegramLink.findMany({
      where: { tenantId: tenant.id },
      orderBy: { createdAt: "desc" },
      select: { id: true, createdAt: true },
    }),
    loadSiteConfigForCurrentTenant(),
  ]);

  return (
    <AdminNotificationsPage
      initialPushDeviceCount={pushDeviceCount}
      initialTelegramLinks={telegramLinks.map((link) => ({
        id: link.id,
        createdAt: link.createdAt.toISOString(),
      }))}
      initialConfig={config}
    />
  );
}
