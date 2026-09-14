import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { defaultSiteConfig, mergeSiteConfig, type SiteConfig } from "@/components/shared/site-config";
import { getCurrentTenant } from "@/lib/tenant";

export async function GET(request: NextRequest) {
  try {
    const tenant = await getCurrentTenant(request);

    if (!tenant) {
      return NextResponse.json({ config: defaultSiteConfig, brandColor: null });
    }

    const row = await prisma.siteSettings.findUnique({ where: { tenantId: tenant.id } });
    const config = mergeSiteConfig((row?.data as Partial<SiteConfig>) ?? null);

    return NextResponse.json({ config, brandColor: tenant.brandColor });
  } catch {
    return NextResponse.json({ config: defaultSiteConfig, brandColor: null });
  }
}
