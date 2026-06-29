#!/usr/bin/env node
/**
 * Setup check for the Build-a-THINK-Agent workshop.
 *
 *   npm run check
 *
 * Verifies the three things that trip people up before the lab:
 *   1. Node 20+
 *   2. Dependencies installed
 *   3. Wrangler is logged in (Workers AI runs remotely, so this is required)
 *
 * Prints a friendly ✅ / ❌ summary with the exact fix for anything missing.
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";

let ok = true;
const pass = (m) => console.log(`  ✅ ${m}`);
const fail = (m, fix) => {
  ok = false;
  console.log(`  ❌ ${m}`);
  if (fix) console.log(`       → ${fix}`);
};

console.log("\n🤖 Build-a-THINK-Agent — setup check\n");

// 1. Node version ----------------------------------------------------------
const nodeMajor = Number(process.versions.node.split(".")[0]);
if (nodeMajor >= 20) {
  pass(`Node ${process.versions.node}`);
} else {
  fail(`Node ${process.versions.node} is too old`, "Install Node 20+  →  https://nodejs.org");
}

// 2. Dependencies installed -------------------------------------------------
const depsInstalled = existsSync("node_modules/@cloudflare/think");
if (depsInstalled) {
  pass("Dependencies installed");
} else {
  fail("Dependencies not installed", "Run:  npm install");
}

// 3. Wrangler login ---------------------------------------------------------
if (depsInstalled) {
  process.stdout.write("  …  checking Wrangler login (this can take a few seconds)\r");
  const r = spawnSync("npx", ["wrangler", "whoami"], {
    encoding: "utf8",
    timeout: 60_000
  });
  const out = `${r.stdout || ""}${r.stderr || ""}`;
  const loggedOut = /failed to fetch auth token|not authenticated|not logged in/i.test(out);
  const email = out.match(/[\w.+-]+@[\w.-]+\.\w+/);
  if (!loggedOut && email) {
    pass(`Wrangler logged in as ${email[0]}`);
  } else if (!loggedOut && /logged in/i.test(out)) {
    pass("Wrangler logged in");
  } else {
    fail("Wrangler not logged in", "Run:  npx wrangler login   (then re-run npm run check)");
  }
} else {
  console.log("  ⏭  Skipping Wrangler login check — install dependencies first.");
}

// Summary -------------------------------------------------------------------
console.log("");
if (ok) {
  console.log("🎉 You're ready!");
  console.log("   Final step:  npm run dev   →   open http://localhost:5173   →   say \"hello\"\n");
  process.exit(0);
} else {
  console.log("Fix the ❌ item(s) above, then run  npm run check  again.\n");
  process.exit(1);
}
