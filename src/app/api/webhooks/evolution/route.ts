import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Evolution API Webhook payload structure
    const { event, instance, data } = body;

    if (!instance) {
      return NextResponse.json({ error: "Missing instance name" }, { status: 400 });
    }

    if (event === "connection.update" || event === "CONNECTION_UPDATE") {
      const state = data?.state || data?.status;

      let newStatus = "DISCONNECTED";
      if (state === "open" || state === "CONNECTED") {
        newStatus = "CONNECTED";
      } else if (state === "connecting" || state === "CONNECTING") {
        newStatus = "CONNECTING";
      } else if (state === "close" && data?.statusReason === 403) {
        newStatus = "BANNED";
      }

      await prisma.connection.update({
        where: { instanceName: instance },
        data: { status: newStatus },
      });
    }

    // TODO: Phase 3 - Handle MESSAGES_UPSERT for funnel processing

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Evolution Webhook Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
