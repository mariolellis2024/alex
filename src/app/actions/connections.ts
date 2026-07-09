"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { createInstance, deleteInstance, setInstanceProxy, getConnectQrCode } from "@/lib/evolution";

export async function getConnections() {
  return await prisma.connection.findMany({
    include: { proxy: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function createConnection(formData: FormData) {
  const internalName = formData.get("internalName") as string;
  const proxyId = formData.get("proxyId") as string | null;

  if (!internalName) {
    throw new Error("O nome da conexão é obrigatório");
  }

  const instanceName = `conn_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  try {
    // 1. Create in Evolution API
    await createInstance(instanceName);

    // 2. Setup Proxy if provided
    let proxy = null;
    if (proxyId) {
      proxy = await prisma.proxy.findUnique({ where: { id: proxyId } });
      if (proxy) {
        try {
          await setInstanceProxy(instanceName, proxy);
        } catch (e) {
          console.error("Falha ao definir proxy na Evolution:", e);
          // depending on strictness, we might throw or continue. we continue.
        }
      }
    }

    // 3. Save to DB
    await prisma.connection.create({
      data: {
        instanceName,
        internalName,
        proxyId: proxy ? proxy.id : null,
      },
    });

  } catch (err: any) {
    console.error("Error creating connection:", err);
    throw new Error("Falha ao criar conexão na Evolution API. Verifique os logs.");
  }

  revalidatePath("/admin/dashboard/connections");
}

export async function removeConnection(id: string) {
  const conn = await prisma.connection.findUnique({ where: { id } });
  if (conn) {
    try {
      await deleteInstance(conn.instanceName);
    } catch (e) {
      console.error("Falha ao excluir na Evolution, excluindo do banco de dados mesmo assim", e);
    }
    await prisma.connection.delete({ where: { id } });
  }
  revalidatePath("/admin/dashboard/connections");
}

export async function fetchQrCode(id: string) {
  const conn = await prisma.connection.findUnique({ where: { id } });
  if (!conn) throw new Error("Connection not found");
  
  if (conn.status === "CONNECTED") {
    return { status: "CONNECTED" };
  }

  const data = await getConnectQrCode(conn.instanceName);
  return { status: "QR", base64: data.base64, pairingCode: data.pairingCode };
}
