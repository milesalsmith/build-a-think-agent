import { Think } from "@cloudflare/think";
import { routeAgentRequest } from "agents";
import { createWorkersAI } from "workers-ai-provider";

/**
 * 👋 THE STARTING POINT.
 *
 * This is a complete, working Think agent — streaming chat, message
 * persistence, the agentic loop, a workspace filesystem — in one tiny class.
 *
 * During the workshop we'll grow it:
 *   STEP 1 (Tier 0): give it a personality (soul) + persistent memory
 *   STEP 2 (Tier 1): give it the `execute` tool so it can write & run code
 *
 * See WORKSHOP.md for the script. The finished version lives in
 * solution/server.ts if you fall behind.
 */
export class MyAgent extends Think<Env> {
  getModel() {
    return createWorkersAI({ binding: this.env.AI })("@cf/moonshotai/kimi-k2.6");
  }
}

export default {
  async fetch(request: Request, env: Env) {
    return (
      (await routeAgentRequest(request, env)) ||
      new Response("Not found", { status: 404 })
    );
  }
} satisfies ExportedHandler<Env>;
