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

            // Start Funnel if TrackingLink is tied to a Funnel
            const link = await prisma.trackingLink.findUnique({ where: { id: click.trackingLinkId }});
            if (link?.funnelId) {
              const activeVersion = await prisma.funnelVersion.findFirst({
                where: { funnelId: link.funnelId, isActive: true }
              });

              if (activeVersion) {
                // Find start node
                const nodes = (activeVersion.nodes as any[]) || [];
                const startNode = nodes.find(n => n.id === 'start' || n.type === 'input');
                
                const run = await prisma.funnelRun.create({
                  data: {
                    funnelVersionId: activeVersion.id,
                    leadId: lead.id,
                    currentNodeId: startNode ? startNode.id : null,
                    status: "RUNNING"
                  }
                });

                // Import dynamically to avoid top-level issues if queue is not ready
                const { funnelQueue } = await import("@/lib/queue");
                await funnelQueue.add("run-funnel", { runId: run.id, instanceName: instance, phone }, { delay: 2000 });
              }
            }
          }
        }
        
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Evolution Webhook Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
