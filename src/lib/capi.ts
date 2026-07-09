import axios from "axios";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export function hashData(data: string | undefined | null) {
  if (!data) return undefined;
  return crypto.createHash("sha256").update(data.toLowerCase().trim()).digest("hex");
}

export async function sendCapiEvent({
  pixelId,
  eventName,
  eventId,
  eventTime = Math.floor(Date.now() / 1000),
  userData,
  customData,
  eventSourceUrl
}: {
  pixelId: string;
  eventName: string;
  eventId: string;
  eventTime?: number;
  userData: {
    ph?: string;
    em?: string;
    client_ip_address?: string | null;
    client_user_agent?: string | null;
    fbp?: string | null;
    fbc?: string | null;
  };
  customData?: any;
  eventSourceUrl?: string;
}) {
  const pixel = await prisma.pixel.findUnique({ where: { id: pixelId } });
  if (!pixel) throw new Error("Pixel not found");

  const payload = {
    data: [
      {
        event_name: eventName,
        event_time: eventTime,
        event_id: eventId,
        event_source_url: eventSourceUrl || process.env.APP_URL,
        action_source: "system_generated",
        user_data: {
          ph: userData.ph ? [hashData(userData.ph)] : undefined,
          em: userData.em ? [hashData(userData.em)] : undefined,
          client_ip_address: userData.client_ip_address,
          client_user_agent: userData.client_user_agent,
          fbp: userData.fbp,
          fbc: userData.fbc,
        },
        custom_data: customData,
      }
    ],
    test_event_code: pixel.testEventCode || undefined,
  };

  try {
    const res = await axios.post(
      `https://graph.facebook.com/v19.0/${pixel.pixelId}/events?access_token=${pixel.capiToken}`,
      payload
    );

    await prisma.capiEvent.create({
      data: {
        pixelId: pixel.id,
        eventName,
        eventId,
        payload: payload as any,
        response: res.data,
        status: "SUCCESS"
      }
    });

    return res.data;
  } catch (error: any) {
    const errorResponse = error.response?.data || error.message;
    await prisma.capiEvent.create({
      data: {
        pixelId: pixel.id,
        eventName,
        eventId,
        payload: payload as any,
        response: errorResponse,
        status: "ERROR"
      }
    });
    console.error("Meta CAPI Error:", errorResponse);
  }
}
