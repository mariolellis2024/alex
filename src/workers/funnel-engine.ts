import { Worker } from "bullmq";
import Redis from "ioredis";
import { prisma } from "@/lib/prisma";
import axios from "axios";

const connection = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

export const funnelWorker = new Worker(
  "funnel-engine",
  async (job) => {
    const { runId, instanceName, phone } = job.data;

    const run = await prisma.funnelRun.findUnique({
      where: { id: runId },
      include: { funnelVersion: true, lead: true },
    });

    if (!run || run.status !== "RUNNING") return;

    const nodes = (run.funnelVersion.nodes as any[]) || [];
    const edges = (run.funnelVersion.edges as any[]) || [];

    const currentNode = nodes.find((n) => n.id === run.currentNodeId);
    if (!currentNode) {
      await prisma.funnelRun.update({ where: { id: runId }, data: { status: "COMPLETED" } });
      return;
    }

    const nextEdges = edges.filter((e) => e.source === currentNode.id);

    // Process current node
    if (currentNode.type === "message" || currentNode.id.startsWith("node_")) {
      // It's a message
      const text = currentNode.data?.label || "Olá!";
      
      // Send via Evolution API
      try {
        const EVOLUTION_URL = process.env.EVOLUTION_URL || "http://localhost:8080";
        const API_KEY = process.env.EVOLUTION_API_KEY || "";
        // Evolution API v2: "text" e "delay" ficam na raiz do payload
        await axios.post(`${EVOLUTION_URL}/message/sendText/${instanceName}`, {
          number: phone,
          text,
          delay: 1200 // human-like typing
        }, {
          headers: {
            apikey: API_KEY,
            "Content-Type": "application/json"
          }
        });
      } catch (e) {
        console.error("Erro ao enviar mensagem:", e);
      }
      
      // Move to next node immediately
      if (nextEdges.length > 0) {
        const nextNodeId = nextEdges[0].target;
        await prisma.funnelRun.update({ where: { id: runId }, data: { currentNodeId: nextNodeId } });
        
        // Re-enqueue the job to process the next node
        const { funnelQueue } = await import("@/lib/queue");
        await funnelQueue.add("run-funnel", { runId, instanceName, phone }, { delay: 1000 });
      } else {
        await prisma.funnelRun.update({ where: { id: runId }, data: { status: "COMPLETED" } });
      }

    } else if (currentNode.type === "delay") {
      // Parse delay in minutes from label or data (simplification)
      const minutes = parseInt((currentNode.data?.label || "").replace(/\D/g, ""), 10) || 1;
      
      if (nextEdges.length > 0) {
        const nextNodeId = nextEdges[0].target;
        await prisma.funnelRun.update({ where: { id: runId }, data: { currentNodeId: nextNodeId } });
        
        // Re-enqueue with the specified delay
        const { funnelQueue } = await import("@/lib/queue");
        await funnelQueue.add("run-funnel", { runId, instanceName, phone }, { delay: minutes * 60 * 1000 });
      } else {
        await prisma.funnelRun.update({ where: { id: runId }, data: { status: "COMPLETED" } });
      }
    } else if (currentNode.type === "input" || currentNode.id === "start") {
      if (nextEdges.length > 0) {
        const nextNodeId = nextEdges[0].target;
        await prisma.funnelRun.update({ where: { id: runId }, data: { currentNodeId: nextNodeId } });
        const { funnelQueue } = await import("@/lib/queue");
        await funnelQueue.add("run-funnel", { runId, instanceName, phone }, { delay: 100 });
      } else {
        await prisma.funnelRun.update({ where: { id: runId }, data: { status: "COMPLETED" } });
      }
    } else {
      // Unknown node, skip or complete
      await prisma.funnelRun.update({ where: { id: runId }, data: { status: "COMPLETED" } });
    }
  },
  { connection: connection as any }
);
