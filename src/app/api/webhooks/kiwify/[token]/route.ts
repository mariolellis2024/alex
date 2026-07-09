import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { sendCapiEvent } from "@/lib/capi";

function normalizePhone(phone: string | undefined): string | null {
  if (!phone) return null;
  let clean = phone.replace(/\D/g, "");
  // Se for BR e tiver 10 ou 11 dígitos sem o 55, adiciona 55
  if (clean.length === 10 || clean.length === 11) {
    if (!clean.startsWith("55")) {
      clean = "55" + clean;
    }
  }
  // Tratamento do 9º dígito para DDDs BR (11 a 28)
  if (clean.startsWith("55") && clean.length === 12) {
    const ddd = parseInt(clean.substring(2, 4));
    if (ddd >= 11 && ddd <= 28) {
      clean = clean.substring(0, 4) + "9" + clean.substring(4);
    }
  }
  return clean;
}

export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  
  try {
    const rawBody = await req.text();
    const url = new URL(req.url);
    const signature = url.searchParams.get("signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 401 });
    }

    const computedSignature = crypto
      .createHmac("sha1", token)
      .update(rawBody)
      .digest("hex");

    if (computedSignature !== signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);

    const kiwifyWebhook = await prisma.kiwifyWebhook.create({
      data: {
        eventId: payload.order_id,
        event: payload.order_status,
        payload: payload as any,
        status: "PROCESSED"
      }
    });

    const customerInfo = payload.Customer || payload.customer;
    if (customerInfo) {
      const email = customerInfo.email?.toLowerCase();
      const phone = normalizePhone(customerInfo.mobile);

      // Attempt to find lead by phone or email
      let lead = null;
      if (phone) {
        lead = await prisma.lead.findUnique({ where: { phone } });
      }
      
      if (!lead && email) {
        lead = await prisma.lead.findFirst({ where: { email } });
      }

      if (!lead && phone) {
        lead = await prisma.lead.create({
          data: {
            phone,
            name: customerInfo.full_name,
            email
          }
        });
      }

      if (lead) {
        // Upsert Order
        await prisma.order.upsert({
          where: { kiwifyOrderId: payload.order_id },
          create: {
            kiwifyOrderId: payload.order_id,
            leadId: lead.id,
            productName: payload.Product?.product_name || "Unknown Product",
            amount: payload.amount || 0, // usually in cents
            status: payload.order_status
          },
          update: {
            status: payload.order_status
          }
        });

        // If approved, update lead customer status
        if (payload.order_status === "approved" || payload.order_status === "paid") {
          await prisma.lead.update({
            where: { id: lead.id },
            data: { isCustomer: true }
          });

          // Send Purchase to CAPI (Assuming we have a mechanism to find the correct Pixel, 
          // usually via a fallback or a default pixel, or via tracking history)
          const firstClick = await prisma.click.findFirst({
            where: { matchedLeadId: lead.id, trackingLink: { pixelId: { not: null } } },
            include: { trackingLink: true },
            orderBy: { createdAt: "desc" }
          });

          if (firstClick?.trackingLink?.pixelId) {
            await sendCapiEvent({
              pixelId: firstClick.trackingLink.pixelId,
              eventName: "Purchase",
              eventId: payload.order_id,
              customData: {
                value: (payload.amount / 100).toFixed(2),
                currency: "BRL"
              },
              userData: {
                ph: phone || undefined,
                em: email || undefined,
                client_ip_address: firstClick.ip || undefined,
                client_user_agent: firstClick.userAgent || undefined,
                fbc: firstClick.fbc || undefined,
                fbp: firstClick.fbp || undefined,
              }
            });
          }
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Kiwify Webhook Error:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
