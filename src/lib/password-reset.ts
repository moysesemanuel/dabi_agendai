import { signPayload, verifyPayload } from "@/lib/signed-token";

type PasswordResetPayload = {
  purpose: "password-reset";
  customerId: string;
  tenantId: string;
  exp: number;
};

const RESET_TOKEN_TTL_SECONDS = 60 * 60;

function getSecret() {
  const secret = process.env.SESSION_SECRET;

  if (!secret) {
    throw new Error("SESSION_SECRET nao configurado no ambiente.");
  }

  return secret;
}

export async function createPasswordResetToken(input: { customerId: string; tenantId: string }) {
  return signPayload<PasswordResetPayload>(
    {
      purpose: "password-reset",
      customerId: input.customerId,
      tenantId: input.tenantId,
      exp: Math.floor(Date.now() / 1000) + RESET_TOKEN_TTL_SECONDS,
    },
    getSecret(),
  );
}

export async function verifyPasswordResetToken(token: string | undefined | null) {
  const payload = await verifyPayload<PasswordResetPayload>(token, getSecret());

  if (!payload || payload.purpose !== "password-reset" || payload.exp < Math.floor(Date.now() / 1000)) {
    return null;
  }

  return payload;
}
