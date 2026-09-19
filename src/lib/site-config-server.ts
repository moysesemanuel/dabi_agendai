import { prisma } from "@/lib/prisma";
import { defaultSiteConfig, mergeSiteConfig, type SiteConfig } from "@/components/shared/site-config";
import { getCurrentTenant } from "@/lib/tenant";

export async function loadSiteConfigForCurrentTenant(): Promise<{
  config: SiteConfig;
  brandColor: string | null;
}> {
  try {
    const tenant = await getCurrentTenant();

    if (!tenant) {
      return { config: defaultSiteConfig, brandColor: null };
    }

    const row = await prisma.siteSettings.findUnique({ where: { tenantId: tenant.id } });
    const config = mergeSiteConfig((row?.data as Partial<SiteConfig>) ?? null);

    return { config, brandColor: tenant.brandColor };
  } catch {
    return { config: defaultSiteConfig, brandColor: null };
  }
}
