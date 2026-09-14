import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { resolveErrorResponse } from "@/lib/errors";
import { verifyPassword } from "@/lib/password";
import {
  clearPlatformSessionCookie,
  createPlatformSessionToken,
  getPlatformSessionFromRequest,
  setPlatformSessionCookie,
} from "@/lib/platform-session";

const loginSchema = z.object({
  email: z.string().trim().email("E-mail invalido."),
  password: z.string().trim().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const parsedBody = loginSchema.safeParse(await request.json());

    if (!parsedBody.success) {
      return NextResponse.json(
        { error: "E-mail e senha sao obrigatorios." },
        { status: 400 },
      );
    }

    const { email, password } = parsedBody.data;
    const configuredEmail = process.env.PLATFORM_ADMIN_EMAIL?.toLowerCase().trim();
    const configuredPasswordHash = process.env.PLATFORM_ADMIN_PASSWORD_HASH;

    if (!configuredEmail || !configuredPasswordHash) {
      return NextResponse.json(
        { error: "Admin da plataforma nao configurado neste ambiente." },
        { status: 500 },
      );
    }

    const isValid =
      email.toLowerCase().trim() === configuredEmail &&
      verifyPassword(password, configuredPasswordHash);

    if (!isValid) {
      return NextResponse.json({ error: "Credenciais invalidas." }, { status: 401 });
    }

    const token = await createPlatformSessionToken({ email: configuredEmail });
    const response = NextResponse.json({ admin: { email: configuredEmail } });
    setPlatformSessionCookie(response, token);

    return response;
  } catch (error) {
    const { message, status } = resolveErrorResponse(error, "Nao foi possivel autenticar.");
    return NextResponse.json({ error: message }, { status });
  }
}

export async function GET(request: NextRequest) {
  const session = await getPlatformSessionFromRequest(request);

  if (!session) {
    return NextResponse.json({ admin: null });
  }

  return NextResponse.json({ admin: { email: session.email } });
}

export async function DELETE() {
  const response = NextResponse.json({ message: "Sessao encerrada." });
  clearPlatformSessionCookie(response);
  return response;
}
