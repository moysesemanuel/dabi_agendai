import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { resolveErrorResponse } from "@/lib/errors";
import { createNotification } from "@/lib/platform";
import { getSessionForTenant } from "@/lib/session";
import { getCurrentTenant } from "@/lib/tenant";

const supportSchema = z.object({
  message: z.string().trim().min(1).max(2000),
});

export async function POST(request: NextRequest) {
  try {
    const tenant = await getCurrentTenant(request);

    if (!tenant) {
      return NextResponse.json({ error: "Site nao encontrado." }, { status: 404 });
    }

    const session = await getSessionForTenant(request, tenant.id);

    if (!session || session.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Apenas o administrador pode enviar mensagens de suporte." },
        { status: 403 },
      );
    }

    const parsedBody = supportSchema.safeParse(await request.json());

    if (!parsedBody.success) {
      return NextResponse.json({ error: "Escreva uma mensagem para enviar." }, { status: 400 });
    }

    await createNotification({
      type: "SUPPORT",
      title: `Suporte - ${tenant.name}`,
      message: parsedBody.data.message,
      tenantId: tenant.id,
    });

    return NextResponse.json({ message: "Mensagem enviada. Nossa equipe vai responder em breve." });
  } catch (error) {
    const { message, status } = resolveErrorResponse(error, "Nao foi possivel enviar a mensagem.");
    return NextResponse.json({ error: message }, { status });
  }
}
