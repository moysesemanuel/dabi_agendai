import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { resolveErrorResponse } from "@/lib/errors";
import { createTenantWithAdmin, listTenantsWithStats } from "@/lib/platform";
import { getPlatformSessionFromRequest } from "@/lib/platform-session";

const createTenantSchema = z.object({
  name: z.string().trim().min(1),
  domain: z.string().trim().min(1),
  adminName: z.string().trim().min(1),
  adminEmail: z.string().trim().email("E-mail invalido."),
  adminPhone: z.string().trim().min(8),
  adminPassword: z.string().trim().min(6),
  planId: z.enum(["essencial", "completo"]),
});

export async function GET(request: NextRequest) {
  const session = await getPlatformSessionFromRequest(request);

  if (!session) {
    return NextResponse.json({ error: "Acesso restrito." }, { status: 401 });
  }

  const tenants = await listTenantsWithStats();

  return NextResponse.json({ tenants });
}

export async function POST(request: NextRequest) {
  try {
    const session = await getPlatformSessionFromRequest(request);

    if (!session) {
      return NextResponse.json({ error: "Acesso restrito." }, { status: 401 });
    }

    const parsedBody = createTenantSchema.safeParse(await request.json());

    if (!parsedBody.success) {
      return NextResponse.json(
        { error: "Preencha todos os campos para criar o tenant." },
        { status: 400 },
      );
    }

    const { tenant } = await createTenantWithAdmin(parsedBody.data);

    return NextResponse.json({ tenant }, { status: 201 });
  } catch (error) {
    const { message, status } = resolveErrorResponse(error, "Nao foi possivel criar o tenant.");
    return NextResponse.json({ error: message }, { status });
  }
}
