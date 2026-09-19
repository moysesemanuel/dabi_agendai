import { NextResponse } from "next/server";
import { getVapidPublicKey } from "@/lib/notifications/web-push";

export async function GET() {
  try {
    return NextResponse.json({ publicKey: getVapidPublicKey() });
  } catch {
    return NextResponse.json({ error: "Notificacoes push nao configuradas." }, { status: 503 });
  }
}
