"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getFunnels() {
  return await prisma.funnel.findMany({
    include: {
      versions: {
        orderBy: { version: "desc" },
        take: 1
      },
      _count: { select: { trackingLinks: true } }
    },
    orderBy: { createdAt: "desc" }
  });
}

export async function createFunnel(formData: FormData) {
  const name = formData.get("name") as string;
  const description = formData.get("description") as string | null;

  if (!name) {
    throw new Error("Nome é obrigatório");
  }

  const funnel = await prisma.funnel.create({
    data: {
      name,
      description,
      versions: {
        create: {
          version: 1,
          nodes: [],
          edges: [],
          isActive: false
        }
      }
    }
  });

  revalidatePath("/admin/dashboard/funnels");
  return funnel.id;
}

export async function getFunnelVersion(funnelId: string) {
  const version = await prisma.funnelVersion.findFirst({
    where: { funnelId },
    orderBy: { version: "desc" }
  });
  return version;
}

export async function saveFunnelVersion(funnelId: string, nodes: any, edges: any, publish: boolean = false) {
  const lastVersion = await getFunnelVersion(funnelId);
  
  if (!lastVersion) throw new Error("Funnel version not found");

  if (lastVersion.isActive) {
    // If active, create a new version to avoid modifying a running funnel
    await prisma.funnelVersion.create({
      data: {
        funnelId,
        version: lastVersion.version + 1,
        nodes,
        edges,
        isActive: publish
      }
    });
    
    if (publish) {
      // Deactivate the old one
      await prisma.funnelVersion.update({
        where: { id: lastVersion.id },
        data: { isActive: false }
      });
    }
  } else {
    // Update existing draft
    await prisma.funnelVersion.update({
      where: { id: lastVersion.id },
      data: {
        nodes,
        edges,
        isActive: publish
      }
    });
  }
}
