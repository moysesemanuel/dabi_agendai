import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { defaultSiteConfig, mergeSiteConfig, type SiteConfig } from "@/components/shared/site-config";

export async function GET() {
  try {
    const row = await prisma.siteSettings.findUnique({ where: { id: "singleton" } });
    const config = mergeSiteConfig((row?.data as Partial<SiteConfig>) ?? null);

    return NextResponse.json({ config });
  } catch {
    return NextResponse.json({ config: defaultSiteConfig });
  }
}
