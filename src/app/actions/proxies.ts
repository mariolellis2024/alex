"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getProxies() {
  return await prisma.proxy.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function createProxy(formData: FormData) {
  const host = formData.get("host") as string;
  const port = parseInt(formData.get("port") as string, 10);
  const protocol = formData.get("protocol") as string;
  const username = formData.get("username") as string | null;
  const password = formData.get("password") as string | null;

  if (!host || !port || !protocol) {
    throw new Error("Preencha todos os campos obrigatórios");
  }

  await prisma.proxy.create({
    data: {
      host,
      port,
      protocol,
      username: username || null,
      password: password || null,
    },
  });

  revalidatePath("/admin/dashboard/proxies");
}

export async function deleteProxy(id: string) {
  await prisma.proxy.delete({
    where: { id },
  });
  revalidatePath("/admin/dashboard/proxies");
}
