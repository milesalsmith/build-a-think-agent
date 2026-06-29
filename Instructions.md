# Instructions — Build a THINK Agent (self-paced)

Follow these at your own pace. If you fall behind the presenter, just pick up
here — every step has **what to do**, a **prompt you can give your AI assistant**
(this is a vibe-coding lab!), and the **exact code** if you'd rather paste it or
check your work.

> 🧠 **The goal:** start from a tiny starter agent (one class, one method) and
> grow it into one that **remembers across sessions** (Tier 0) and **writes &
> runs its own code in a sandbox** (Tier 1).
>
> 🆘 **Stuck at any point?** Copy `solution/server.ts` over your `src/server.ts`,
> do the two one-line binding edits from Step 2.1, then restart — you're caught
> up. Or paste the error into your AI assistant with: *"I'm building a Cloudflare
> Project Think agent. Here's my error: <paste>. Here's my src/server.ts:
> <paste>. What's wrong?"*

---

## 🤖 Vibe-coding with your AI assistant

**`src/server.ts` is the only file you write code in** throughout this workshop.
The other two edits (`wrangler.jsonc` and `env.d.ts`) are just uncomment one line
each — no AI needed.

For the best results with your AI assistant (Cursor, Copilot, Claude, ChatGPT,
etc.), **paste this context block once at the start of your session**, before
your first prompt:

```
I'm building a Cloudflare Project Think agent in a file called src/server.ts.
Here is my current file:

[paste src/server.ts here]

Think is a Cloudflare agent base class. The class extends Think<Env>.
- getModel() returns the language model
- configureSession(session) adds context blocks (soul + memory)
- getTools() returns tools (including a sandboxed code executor)

Only edit src/server.ts. Do not change imports unless I ask. Keep all
existing code intact and only add what I request.
```

Then for each step, use the 🤖 **Ask your AI assistant** prompt in the
instructions below. Your AI already has the file and the context — just paste
that prompt and it'll make the right edit. If it drifts, paste your current
`src/server.ts` again to re-anchor it.

---

## Part 0 — Setup (5 min)

> ✅ **Do this BEFORE the session if you can** — setup is the one thing that
> eats time live.

**You need four things in place first:**

1. **Node 20+** — verify: `node --version` (should print v20 or higher)
2. **A Cloudflare account** (free is fine) — sign up: https://dash.cloudflare.com/sign-up
3. **An AI coding assistant** in your editor (Cursor, Copilot, Claude, ChatGPT…) — this is a vibe-coding lab
4. **Wrangler logged in** — Workers AI runs remotely, so this is required:
   ```bash
   npx wrangler login
   npx wrangler whoami     # ✅ should print your email + account, no error
   ```

**Then clone, install, and run:**
```bash
git clone https://github.com/milesalsmith/build-a-think-agent.git
cd build-a-think-agent
npm install
npm run dev              # → http://localhost:5173
```

Open the URL and say "hello". You should get a reply. ✅ **That's the starting
agent** — open `src/server.ts`: the agent is just a class with a single
`getModel()` method. `Think` gives us streaming, persistence, and a filesystem
for free. Now let's give it a brain.

---

## Part 1 — Tier 0: Personality + Memory (20 min)

### Step 1.1 — Give it a personality (a "soul")

📍 **Where:** `src/server.ts`, just below the `import` lines at the top.

🤖 **Ask your AI assistant:**
> "In src/server.ts, add a `const SOUL` string that describes a friendly,
> concise AI assistant built on Cloudflare. Mention it has a persistent
> workspace filesystem (read/write/grep/find) and a memory it updates with
> set_context."

📋 **Or paste this:**
```typescript
const SOUL = `You are a friendly, concise AI assistant built on Cloudflare's
Agents platform. Be warm and a little playful.

You have a persistent Workspace (a durable filesystem). Use your read/write/
edit/grep/find tools whenever a question might be answered by something the
user wrote down before, or when they ask you to remember something concrete.

You have a MEMORY context block. When you learn something durable about the
user (preferences, projects, names), call set_context to update it.`;
```

### Step 1.2 — Wire up the soul + a memory block

📍 **Where:** inside the `MyAgent` class, right after the `getModel()` method.

🤖 **Ask your AI assistant:**
> "Add a `configureSession(session)` method to my Think agent that registers a
> read-only 'soul' context block from the SOUL constant, and a writable 'memory'
> context block (maxTokens 2000), then calls withCachedPrompt(). Also add a
> `type Session` import from @cloudflare/think."

📋 **Or paste this:**
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

📍 **Also update the first import line** to bring in the `Session` type:
```typescript
import { Think, type Session } from "@cloudflare/think";
```

### Step 1.3 — Try it

Save the file (the dev server hot-reloads). In the browser:
```
My name is Alex and I'm learning Project Think today.
```
Then **refresh the page** and ask:
```
What's my name?
```

✅ **CHECK:** it answers "Alex" *after a full page reload*. The memory lives in
the agent's SQLite — no database, no RAG. **That's Tier 0.**

---

## Part 2 — Tier 1: Code Execution (25 min)

> Instead of calling tools one at a time, the model will write **one JavaScript
> program** and run it in a sandboxed Dynamic Worker with no network access.

### Step 2.1 — Add the sandbox binding (two small edits)

📍 **Where 1:** `wrangler.jsonc` — find the commented line under the `ai` binding
and **uncomment it** (remove the `//`):
```jsonc
  "worker_loaders": [{ "binding": "LOADER" }],
```

📍 **Where 2:** `env.d.ts` — find the commented line inside the `Env` interface
and **uncomment it**:
```typescript
    LOADER: WorkerLoader;
```

### Step 2.2 — Add the execute tool

📍 **Where:** top of `src/server.ts`, add these imports:
```typescript
import { createExecuteTool } from "@cloudflare/think/tools/execute";
import { createWorkspaceTools } from "@cloudflare/think/tools/workspace";
import type { ToolSet } from "ai";
```

📍 **And** inside the `MyAgent` class, after `getModel()`:

🤖 **Ask your AI assistant:**
> "Add a `getTools()` method to my Think agent that returns an `execute` tool
> built with createExecuteTool, passing createWorkspaceTools(this.workspace) and
> loader: this.env.LOADER."

📋 **Or paste this:**
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

📍 **Where:** add this to the **end of the `SOUL` string** (before the closing backtick):
```
You have an EXECUTE tool that runs JavaScript in a secure sandbox. Inside it,
call workspace tools as codemode.read(...), codemode.write(...),
codemode.grep(...). Prefer ONE execute program over many tool calls when
counting, aggregating, or transforming across files.
```

### Step 2.4 — Restart and run the demo

The `worker_loaders` binding is new, so **restart** the dev server:
```bash
# Ctrl+C, then:
npm run dev
```

> 💡 **Expected hiccup:** the first restart after adding the new imports may
> fail with a Vite *"optimize deps / file does not exist in the optimize deps
> directory"* error. This is harmless — Vite is just re-caching the new
> packages. **Just run `npm run dev` again** and it'll boot cleanly.

In the browser, paste:
```
Use your execute tool to create 10 notes in /numbers/ named 1.md through
10.md, each containing that number squared. Then write a script that reads
all of them and returns the total sum.
```

✅ **CHECK:** it writes a single JS program, runs it in the sandbox, and returns
**385**. That's the jump from a chatbot that *calls* tools to a coding agent
that *writes code*. **That's Tier 1.** 🎉

---

## Part 3 — Deploy (optional, 5 min)

```bash
npm run deploy
```
Wrangler prints a live `*.workers.dev` URL. Your agent is now on the internet,
hibernating at zero cost until someone messages it. The bindings line should
show `MyAgent`, `AI`, and `LOADER`.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `npm run dev` won't boot ("must be logged in / remote proxy") | `npx wrangler login`, then retry. Workers AI is remote. |
| Edits to `wrangler.jsonc` not taking effect | Stop and **restart** `npm run dev` — bindings load at boot. |
| First restart errors with Vite "optimize deps / file does not exist" | Harmless dep re-cache. **Run `npm run dev` again** — second boot works. |
| Agent ignores the execute tool on simple tasks | Start your prompt with **"Use ONLY your execute tool."** |
| TypeScript errors mid-step | Expected until a step is finished — complete the step, then check. Run `npm run typecheck`. |
| Totally lost | Copy `solution/server.ts` → `src/server.ts`, do the Step 2.1 binding edits, restart `npm run dev`. |
| Any error you don't understand | Paste it into your AI assistant with your `src/server.ts` and ask "what's wrong?" |

---

## What you built

About **40 lines** of agent code gave you: streaming, persistence, a memory the
model curates itself, a durable filesystem, and sandboxed code execution. You
didn't *build* those capabilities — you *declared* them by extending `Think`
and adding three bindings (`AI`, your Durable Object, and `LOADER`).

**Where to go next:** Tier 2 (npm in the sandbox), Tier 3 (a browser), Tier 4
(a full OS), sub-agents, and agents that write their own tools. Same pattern —
one more binding, one more tool. See
[Project Think](https://blog.cloudflare.com/project-think/) and the
[Think docs](https://developers.cloudflare.com/agents/harnesses/think/getting-started/).
