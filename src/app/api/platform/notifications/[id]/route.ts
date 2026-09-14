import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { resolveErrorResponse } from "@/lib/errors";
import { markNotificationRead } from "@/lib/platform";
import { getPlatformSessionFromRequest } from "@/lib/platform-session";

const updateSchema = z.object({ read: z.boolean() });

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
    const parsedBody = updateSchema.safeParse(await request.json());

    if (!parsedBody.success) {
      return NextResponse.json({ error: "Dados invalidos." }, { status: 400 });
    }

    const notification = await markNotificationRead(id, parsedBody.data.read);

    return NextResponse.json({ notification });
  } catch (error) {
    const { message, status } = resolveErrorResponse(
      error,
      "Nao foi possivel atualizar a notificacao.",
    );
    return NextResponse.json({ error: message }, { status });
  }
}
