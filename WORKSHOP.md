# WORKSHOP SCRIPT — Build a THINK Agent

> Read this top to bottom. **PASTE** blocks go into files. **RUN** blocks go in
> the terminal. **SAY** lines are your talking points. **✅ CHECK** is how you
> know it worked. The finished code is in `solution/server.ts`.

---

## PART 0 — Setup (everyone together) · 5 min

**RUN** (everyone):
```bash
git clone https://github.com/milesalsmith/build-a-think-agent.git
cd build-a-think-agent
npm install
npm run dev
```

**SAY:** "Open http://localhost:5173 and say hello. That reply is coming from a
real AI agent running in a local Cloudflare Worker — streaming, persistent,
with its own filesystem. It's about 15 lines of code. Let's open it."

**✅ CHECK:** Everyone sees a reply in the browser.

Open `src/server.ts`. **SAY:** "This is the whole agent. `getModel()` picks the
model. The `Think` base class does streaming, persistence, the agentic loop,
and a workspace filesystem for free. Now let's give it a brain."

---

## PART 1 — TIER 0: Personality + Memory · 20 min

### Step 1.1 — Add a personality (the "soul")

**PASTE** at the top of `src/server.ts`, just under the imports:
```typescript
const SOUL = `You are a friendly, concise AI assistant built on Cloudflare's
Agents platform. Be warm and a little playful.

You have a persistent Workspace (a durable filesystem). Use your read/write/
edit/grep/find tools whenever a question might be answered by something the
user wrote down before, or when they ask you to remember something concrete.

You have a MEMORY context block. When you learn something durable about the
user (preferences, projects, names), call set_context to update it.`;
```

**SAY:** "The soul is the agent's personality and operating instructions — a
static system prompt."

### Step 1.2 — Wire the soul + a memory block

**PASTE** this method inside the `MyAgent` class (after `getModel()`):
```typescript
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
```

**PASTE** — update the first import line to add the `Session` type:
```typescript
import { Think, type Session } from "@cloudflare/think";
```

**SAY:** "Two context blocks. `soul` is static. `memory` is a scratchpad the
**model writes to itself** with a built-in `set_context` tool. That's
persistent memory — no database, no RAG. It survives restarts because it lives
in the Durable Object's SQLite."

### Step 1.3 — Try it

**RUN:** save the file; the dev server hot-reloads. In the browser:
```
My name is Alex and I'm learning Project Think today.
```
Then **refresh the page** and ask:
```
What's my name?
```

**✅ CHECK:** It answers "Alex" after a full page reload.

**SAY:** "It remembered across a reload. That's Tier 0: a persistent agent with
memory and a filesystem. Now the fun part — let's let it write code."

---

## PART 2 — TIER 1: Code Execution · 25 min

> Goal: instead of calling tools one at a time, the model writes ONE JavaScript
> program and runs it in a sandboxed Dynamic Worker.

### Step 2.1 — Add the sandbox binding

**PASTE** into `wrangler.jsonc` (uncomment / add under the `ai` binding):
```jsonc
  "worker_loaders": [{ "binding": "LOADER" }],
```

**PASTE** into `env.d.ts` (inside the `Env` interface):
```typescript
    LOADER: WorkerLoader;
```

**SAY:** "A Worker Loader lets our agent spin up a fresh, throwaway Worker at
runtime to run code in — milliseconds to start, no network access by default."

### Step 2.2 — Add the execute tool

**PASTE** these imports at the top of `src/server.ts`:
```typescript
import { createExecuteTool } from "@cloudflare/think/tools/execute";
import { createWorkspaceTools } from "@cloudflare/think/tools/workspace";
import type { ToolSet } from "ai";
```

**PASTE** this method inside the `MyAgent` class (after `getModel()`):
```typescript
  getTools(): ToolSet {
    return {
      execute: createExecuteTool({
        tools: createWorkspaceTools(this.workspace),
        loader: this.env.LOADER
      })
    };
  }
```

### Step 2.3 — Tell the agent it can write code

**PASTE** — add this to the end of the `SOUL` string (before the closing backtick):
```
You have an EXECUTE tool that runs JavaScript in a secure sandbox. Inside it,
call workspace tools as codemode.read(...), codemode.write(...),
codemode.grep(...). Prefer ONE execute program over many tool calls when
counting, aggregating, or transforming across files.
```

### Step 2.4 — Restart and demo the WOW

**RUN:** stop the dev server (Ctrl+C) and restart it (the binding is new):
```bash
npm run dev
```

In the browser, paste:
```
Use your execute tool to create 10 notes in /numbers/ named 1.md through
10.md, each containing that number squared. Then write a script that reads
all of them and returns the total sum.
```

**✅ CHECK:** It writes a single JS program, runs it, and returns **385**.

**SAY:** "Watch what happened: instead of 20 separate tool calls, it wrote one
program and ran it in a sandbox with no network access. This is the jump from a
chatbot that *calls* tools to a coding agent that *writes code*. Same idea as
Claude Code or Codex — but running on the edge, not a laptop."

---

## PART 3 — Deploy (optional) · 5 min

**RUN:**
```bash
npm run deploy
```

**SAY:** "One command. Your agent is now live on the internet at a
`*.workers.dev` URL, hibernating at zero cost until someone messages it."

**✅ CHECK:** Wrangler prints a live URL with bindings `MyAgent`, `AI`, `LOADER`.

---

## PART 4 — The Art of the Possible (talk only — don't build) · 15 min

**SAY:** "We did Tiers 0 and 1. Here's the rest of the execution ladder — each
is just one more binding and one more tool factory:"

- **Tier 2 — npm in the sandbox.** The agent writes `import { z } from "zod"`
  and it just works (`@cloudflare/worker-bundler`).
- **Tier 3 — Browser Run.** `createBrowserTools(...)` → the agent navigates,
  scrapes, and screenshots live web pages via headless Chrome.
- **Tier 4 — Cloudflare Sandbox.** Full OS: `git clone`, `npm test`, compilers.
- **Self-authored extensions.** Ask it to integrate GitHub; it writes a GitHub
  tool, declares `network: ["api.github.com"]`, loads it, and now has a
  `github_create_pr` tool that didn't exist 30 seconds ago. It persists.
- **Sub-agents.** A team of specialist agents, each with its own SQLite and
  memory, running in parallel; an orchestrator delegates and merges.

**CLOSING SAY:** "What you built is about 40 lines of real code. Streaming,
persistence, the sandbox — none of that was your code. It came from extending
one base class and declaring bindings. The capabilities live in the platform,
not the logic. That's what 'agent as infrastructure' means."

---

## 🆘 IF SOMETHING BREAKS

| Symptom | Fix |
|---------|-----|
| `npm run dev` won't boot: "must be logged in / remote proxy" | `npx wrangler login`, then retry. (Workers AI is remote.) |
| Changes to `wrangler.jsonc` not picked up | Stop and restart `npm run dev` (bindings load at boot). |
| Agent ignores the execute tool on simple tasks | Prepend the prompt with **"Use ONLY your execute tool."** |
| Anyone hopelessly behind | Copy `solution/server.ts` into `src/server.ts`, restart dev. |
| Typecheck errors mid-build | They're expected until a step is finished; finish the step, then check. |
