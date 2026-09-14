import { NextRequest, NextResponse } from "next/server";
import { listNotifications } from "@/lib/platform";
import { getPlatformSessionFromRequest } from "@/lib/platform-session";

export async function GET(request: NextRequest) {
  const session = await getPlatformSessionFromRequest(request);

  if (!session) {
    return NextResponse.json({ error: "Acesso restrito." }, { status: 401 });
  }

  const notifications = await listNotifications();

  return NextResponse.json({ notifications });
}
