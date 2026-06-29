# Build a THINK Agent

A hands-on workshop starter for building an AI agent on
[Cloudflare Project Think](https://blog.cloudflare.com/project-think/).

You start with a tiny working agent and, together, grow it into one that
**remembers across sessions** and **writes & runs its own code in a sandbox** —
Tiers 0 and 1 of the Project Think "execution ladder".

The step-by-step build guide is in **[`Instructions.md`](./Instructions.md)** —
follow it live with the presenter, or at your own pace.

---

## Setup (do this before the workshop)

**1. You need Node 20+ and a Cloudflare account.**

**2. Log into Wrangler** (required — Workers AI runs remotely):
```bash
npx wrangler login
npx wrangler whoami      # should show your account, no error
```

**3. Clone and install:**
```bash
git clone https://github.com/milesalsmith/build-a-think-agent.git
cd build-a-think-agent
npm install
```

**4. Check your setup** (Node + deps + Wrangler login in one command):
```bash
npm run check
```
Fix anything flagged with ❌, then re-run until you see 🎉.

**5. Confirm it runs:**
```bash
npm run dev              # → http://localhost:5173
```
Open the URL, say "hello", and you should get a reply. That's the starting
agent. **You're ready.**

---

## What's already done for you

All the tooling/config is wired up so the workshop is about the *agent*, not
the build setup:

- `package.json` — dependencies
- `wrangler.jsonc` — bindings + Durable Object migration
- `vite.config.ts`, `tsconfig.json`, `env.d.ts`, `index.html` — pre-wired
- `src/client/` — a minimal chat UI (you won't need to touch it)
- `src/server.ts` — **the agent — this is what we build on**
- `solution/server.ts` — the finished version, if you fall behind

## What we build together

- **Tier 0:** give the agent a personality and persistent memory
- **Tier 1:** give it an `execute` tool so it writes and runs code in a sandbox

Follow **[`Instructions.md`](./Instructions.md)**.
