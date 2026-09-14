import { headers } from "next/headers";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

async function resolveHost(request?: NextRequest) {
  if (request) {
    return request.headers.get("host")?.toLowerCase().trim() ?? null;
  }

  const headersList = await headers();
  return headersList.get("host")?.toLowerCase().trim() ?? null;
}

export async function getCurrentTenant(request?: NextRequest) {
  const host = await resolveHost(request);

  if (!host) {
    return null;
  }

  const tenant = await prisma.tenant.findUnique({ where: { domain: host } });

  return tenant && tenant.active ? tenant : null;
}
