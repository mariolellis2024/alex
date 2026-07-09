import { Queue } from "bullmq";
import Redis from "ioredis";

const connection = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

export const proxyHealthQueue = new Queue("proxy-health", { connection });
export const funnelQueue = new Queue("funnel-engine", { connection });
