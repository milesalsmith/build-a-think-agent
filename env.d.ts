/* eslint-disable */
// Typed Cloudflare bindings for the agent.
declare namespace Cloudflare {
  interface Env {
    AI: Ai;
    MyAgent: DurableObjectNamespace<import("./src/server").MyAgent>;
    // 👇 TIER 1 (added live during the workshop):
    // LOADER: WorkerLoader;
  }
}
interface Env extends Cloudflare.Env {}
