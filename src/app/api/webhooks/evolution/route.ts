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

    if (event === "messages.upsert" || event === "MESSAGES_UPSERT") {
      const messages = data?.messages || [];
      for (const msg of messages) {
        if (msg.key.fromMe) continue; // Ignore outbound messages

        const remoteJid = msg.key.remoteJid;
        if (!remoteJid || remoteJid.includes("@g.us")) continue; // Ignore groups

        const phone = remoteJid.split("@")[0]; // E.164 without '+'
        const pushName = msg.pushName || "";
        
        // Extract text
        let text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || "";

        // Check if there is a tracking reference (Ref: abc12345)
        const refMatch = text.match(/\(Ref:\s*([a-zA-Z0-9_-]+)\)/);
        let clickIdRef = null;

        if (refMatch && refMatch[1]) {
          clickIdRef = refMatch[1];
        }

        // Upsert Lead
        let lead = await prisma.lead.findUnique({ where: { phone } });
        
        if (!lead) {
          lead = await prisma.lead.create({
            data: {
              phone,
              name: pushName,
            }
          });
        }

        // If we found a click reference and it's not matched yet
        if (clickIdRef) {
          // Find the click that ends with this short ID
          const click = await prisma.click.findFirst({
            where: {
              id: { endsWith: clickIdRef },
              matchedLeadId: null
            }
          });

          if (click) {
            await prisma.click.update({
              where: { id: click.id },
              data: { matchedLeadId: lead.id }
            });
            
            // At this point we could trigger the CAPI "Lead" event
            // using the Pixel associated with the TrackingLink.
          }
        }
        
        // TODO: Phase 3 - Advance funnel if Lead is in one
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Evolution Webhook Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
