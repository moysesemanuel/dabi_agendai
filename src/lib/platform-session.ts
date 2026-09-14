import type { NextRequest, NextResponse } from "next/server";
import { signPayload, verifyPayload } from "@/lib/signed-token";

export const PLATFORM_SESSION_COOKIE_NAME = "dabi_platform_session";
const PLATFORM_SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;

export type PlatformSessionPayload = {
  email: string;
  exp: number;
};

function getSecret() {
  const secret = process.env.PLATFORM_SESSION_SECRET;

  if (!secret) {
    throw new Error("PLATFORM_SESSION_SECRET nao configurado no ambiente.");
  }

  return secret;
}

export async function createPlatformSessionToken(payload: Omit<PlatformSessionPayload, "exp">) {
  const fullPayload: PlatformSessionPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + PLATFORM_SESSION_MAX_AGE_SECONDS,
  };

  return signPayload(fullPayload, getSecret());
}

export async function verifyPlatformSessionToken(
  token: string | undefined | null,
): Promise<PlatformSessionPayload | null> {
  const payload = await verifyPayload<PlatformSessionPayload>(token, getSecret());

  if (!payload || payload.exp < Math.floor(Date.now() / 1000)) {
    return null;
  }

  return payload;
}

export async function getPlatformSessionFromRequest(request: NextRequest) {
  return verifyPlatformSessionToken(request.cookies.get(PLATFORM_SESSION_COOKIE_NAME)?.value);
}

export function setPlatformSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(PLATFORM_SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: PLATFORM_SESSION_MAX_AGE_SECONDS,
  });
}

export function clearPlatformSessionCookie(response: NextResponse) {
  response.cookies.set(PLATFORM_SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
