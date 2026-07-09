export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./workers/proxy-health");
    await import("./workers/funnel-engine");
  }
}
