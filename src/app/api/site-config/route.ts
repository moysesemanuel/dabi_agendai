import { NextResponse } from "next/server";
import { loadSiteConfigForCurrentTenant } from "@/lib/site-config-server";

export async function GET() {
  const { config, brandColor } = await loadSiteConfigForCurrentTenant();
  return NextResponse.json({ config, brandColor });
}
