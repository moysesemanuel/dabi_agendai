import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { resolveErrorResponse } from "@/lib/errors";
import { setTenantActive, setTenantBrandColor } from "@/lib/platform";
import { getPlatformSessionFromRequest } from "@/lib/platform-session";

const updateTenantSchema = z.object({
  active: z.boolean().optional(),
  brandColor: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Cor invalida. Use o formato #RRGGBB.")
    .optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getPlatformSessionFromRequest(request);

    if (!session) {
      return NextResponse.json({ error: "Acesso restrito." }, { status: 401 });
    }

    const { id } = await params;
    const parsedBody = updateTenantSchema.safeParse(await request.json());

    if (!parsedBody.success || (!("active" in parsedBody.data) && !("brandColor" in parsedBody.data))) {
      return NextResponse.json({ error: "Dados invalidos." }, { status: 400 });
    }

    let tenant;

    if (parsedBody.data.active !== undefined) {
      tenant = await setTenantActive(id, parsedBody.data.active);
    }

    if (parsedBody.data.brandColor !== undefined) {
      tenant = await setTenantBrandColor(id, parsedBody.data.brandColor);
    }

    return NextResponse.json({ tenant });
  } catch (error) {
    const { message, status } = resolveErrorResponse(error, "Nao foi possivel atualizar o tenant.");
    return NextResponse.json({ error: message }, { status });
  }
}
