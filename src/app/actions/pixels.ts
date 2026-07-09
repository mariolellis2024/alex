"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getPixels() {
  return await prisma.pixel.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function createPixel(formData: FormData) {
  const name = formData.get("name") as string;
  const pixelId = formData.get("pixelId") as string;
  const capiToken = formData.get("capiToken") as string;
  const testEventCode = formData.get("testEventCode") as string | null;

  if (!name || !pixelId || !capiToken) {
    throw new Error("Preencha os campos obrigatórios");
  }

  await prisma.pixel.create({
    data: {
      name,
      pixelId,
      capiToken,
      testEventCode: testEventCode || null,
    },
  });

  revalidatePath("/admin/dashboard/pixels");
}

export async function deletePixel(id: string) {
  await prisma.pixel.delete({
    where: { id },
  });
  revalidatePath("/admin/dashboard/pixels");
}
