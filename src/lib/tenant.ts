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

  if (tenant) {
    return tenant.active ? tenant : null;
  }

  // Deploy de Preview da Vercel usa um host aleatorio por PR que nunca bate com
  // o dominio de nenhum tenant real. Sem isso, toda PR exigiria criar um tenant
  // manualmente so pra conseguir ver a mudanca funcionando. So roda em Preview
  // (nunca em producao) e exige a variavel configurada - sem ela, sem fallback.
  if (process.env.VERCEL_ENV === "preview" && process.env.PREVIEW_FALLBACK_TENANT_DOMAIN) {
    const previewTenant = await prisma.tenant.findUnique({
      where: { domain: process.env.PREVIEW_FALLBACK_TENANT_DOMAIN },
    });

    return previewTenant && previewTenant.active ? previewTenant : null;
  }

  return null;
}
