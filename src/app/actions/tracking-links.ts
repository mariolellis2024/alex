"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getTrackingLinks() {
  return await prisma.trackingLink.findMany({
    include: { pixel: true, _count: { select: { clicks: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function createTrackingLink(formData: FormData) {
  const code = formData.get("code") as string;
  const initialMessage = formData.get("initialMessage") as string;
  const destinationNumber = formData.get("destinationNumber") as string | null;
  const pixelId = formData.get("pixelId") as string | null;
  
  if (!code || !initialMessage) {
    throw new Error("Campos obrigatórios não preenchidos.");
  }

  // Verificar código único
  const existing = await prisma.trackingLink.findUnique({ where: { code } });
  if (existing) {
    throw new Error("Este código já está em uso.");
  }

  await prisma.trackingLink.create({
    data: {
      code: code.replace(/[^a-zA-Z0-9_-]/g, ""),
      initialMessage,
      destinationNumber: destinationNumber || null,
      pixelId: pixelId || null,
    },
  });

  revalidatePath("/admin/dashboard/tracking-links");
}

export async function deleteTrackingLink(id: string) {
  await prisma.trackingLink.delete({ where: { id } });
  revalidatePath("/admin/dashboard/tracking-links");
}
