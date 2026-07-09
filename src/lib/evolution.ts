import axios from "axios";

const EVOLUTION_URL = process.env.EVOLUTION_URL || "http://localhost:8080";
const API_KEY = process.env.EVOLUTION_API_KEY || "";

const api = axios.create({
  baseURL: EVOLUTION_URL,
  headers: {
    apikey: API_KEY,
    "Content-Type": "application/json",
  },
});

export async function createInstance(instanceName: string) {
  const webhookUrl = `${process.env.APP_URL}/api/webhooks/evolution`;
  
  // Evolution API v2: exige "integration" e webhook como objeto aninhado
  const res = await api.post("/instance/create", {
    instanceName,
    integration: "WHATSAPP-BAILEYS",
    qrcode: true,
    webhook: {
      url: webhookUrl,
      byEvents: true,
      events: ["CONNECTION_UPDATE", "MESSAGES_UPSERT"],
    },
  });
  return res.data;
}

export async function getConnectQrCode(instanceName: string) {
  const res = await api.get(`/instance/connect/${instanceName}`);
  return res.data; // Usually { base64: "...", pairingCode: "..." }
}

export async function deleteInstance(instanceName: string) {
  try {
    await api.delete(`/instance/logout/${instanceName}`);
  } catch (e) {
    // Ignore if not logged in
  }
  const res = await api.delete(`/instance/delete/${instanceName}`);
  return res.data;
}

export async function setInstanceProxy(instanceName: string, proxy: { host: string, port: number, protocol: string, username?: string | null, password?: string | null }) {
  // Evolution API v2: exige "enabled" e porta como string
  const res = await api.post(`/proxy/set/${instanceName}`, {
    enabled: true,
    host: proxy.host,
    port: String(proxy.port),
    protocol: proxy.protocol, // http, https, socks5
    username: proxy.username || "",
    password: proxy.password || "",
  });
  return res.data;
}
