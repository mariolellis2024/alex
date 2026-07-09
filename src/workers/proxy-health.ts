import { Worker } from "bullmq";
import Redis from "ioredis";
import { prisma } from "@/lib/prisma";
import axios from "axios";
import { HttpsProxyAgent } from "https-proxy-agent";
import { SocksProxyAgent } from "socks-proxy-agent";

const connection = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

export const proxyHealthWorker = new Worker(
  "proxy-health",
  async (job) => {
    const proxies = await prisma.proxy.findMany();

    for (const proxy of proxies) {
      let agent;
      const auth = proxy.username && proxy.password ? `${proxy.username}:${proxy.password}@` : "";
      
      try {
        if (proxy.protocol === "socks5") {
          agent = new SocksProxyAgent(`socks5://${auth}${proxy.host}:${proxy.port}`);
        } else {
          agent = new HttpsProxyAgent(`http://${auth}${proxy.host}:${proxy.port}`);
        }

        // Basic test using WhatsApp Web URL or a highly available endpoint
        await axios.get("https://web.whatsapp.com", {
          httpsAgent: agent,
          timeout: 10000,
        });

        await prisma.proxy.update({
          where: { id: proxy.id },
          data: { status: "ACTIVE", lastCheck: new Date() },
        });
      } catch (error) {
        console.error(`Proxy ${proxy.host}:${proxy.port} failed check:`, error);
        await prisma.proxy.update({
          where: { id: proxy.id },
          data: { status: "OFFLINE", lastCheck: new Date() },
        });
      }
    }
  },
  { connection: connection as any }
);
