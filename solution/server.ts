// ============================================================================
// SOLUTION / REFERENCE — the FINISHED agent (Tier 0 + Tier 1).
//
// This is where src/server.ts should end up after the workshop. If you fall
// behind, copy the relevant bits from here. (This folder is excluded from the
// build and typecheck, so it won't clash with src/server.ts.)
//
// Reminder: Tier 1 also requires two edits OUTSIDE this file —
//   wrangler.jsonc :  "worker_loaders": [{ "binding": "LOADER" }]
//   env.d.ts       :  LOADER: WorkerLoader;
// ============================================================================

import { Think, type Session } from "@cloudflare/think";
import { createExecuteTool } from "@cloudflare/think/tools/execute";
import { createWorkspaceTools } from "@cloudflare/think/tools/workspace";
import { routeAgentRequest } from "agents";
import type { ToolSet } from "ai";
import { createWorkersAI } from "workers-ai-provider";

const SOUL = `You are a friendly, concise AI assistant built on Cloudflare's
Agents platform. Be warm and a little playful.

How you work:
- You have a persistent Workspace (a durable filesystem). Use your read/write/
  edit/grep/find tools whenever a question might be answered by something the
  user wrote down before, or when they ask you to remember something concrete.
- You have a MEMORY context block. When you learn something durable about the
  user (preferences, projects, names), call set_context to update it.
- You have an EXECUTE tool that runs JavaScript in a secure sandbox. Inside it,
  call workspace tools as codemode.read(...), codemode.write(...),
  codemode.grep(...). Prefer ONE execute program over many tool calls when
  counting, aggregating, or transforming across files. The sandbox has no
  network access, so it is safe for data work.`;

export class MyAgent extends Think<Env> {
  // Wrap every turn in a durable fiber so a mid-stream crash can recover.
  chatRecovery = true;

  getModel() {
    return createWorkersAI({ binding: this.env.AI })("@cf/moonshotai/kimi-k2.6");
  }

  // TIER 1 — code execution. The model writes JS; it runs in an ephemeral
  // Dynamic Worker (via LOADER) with the workspace tools exposed as codemode.*
  getTools(): ToolSet {
    return {
      execute: createExecuteTool({
        tools: createWorkspaceTools(this.workspace),
        loader: this.env.LOADER
      })
    };
  }

  // TIER 0 — personality (soul) + self-writable memory.
  configureSession(session: Session) {
    return session
      .withContext("soul", { provider: { get: async () => SOUL } })
      .withContext("memory", {
        description:
          "Durable facts about the user. Use set_context to update when you learn something worth remembering.",
        maxTokens: 2000
      })
      .withCachedPrompt();
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
