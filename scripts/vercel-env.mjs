/**
 * Sets Vercel environment variables from .env.local without printing their
 * values (they are piped straight to the vercel CLI's stdin). Usage:
 *   node scripts/vercel-env.mjs [production|preview|development]
 * Reads the full set below from .env.local. Secrets never touch stdout or
 * this transcript.
 */
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const target = process.argv[2] ?? "production";
const SCOPE = "mukul-nandas-projects";

const VARS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_SITE_URL",
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASS",
  "MAIL_FROM",
  "ADMIN_NOTIFY_EMAIL",
  "CRON_SECRET",
  "NEXT_PUBLIC_WHATSAPP_NUMBER",
];

const env = {};
for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2];
}

let ok = 0;
let skipped = 0;
for (const name of VARS) {
  const value = env[name];
  if (value === undefined || value === "") {
    console.log(`- ${name}: (empty, skipped)`);
    skipped++;
    continue;
  }
  const r = spawnSync(
    "vercel",
    ["env", "add", name, target, "--scope", SCOPE, "--yes", "--force"],
    { shell: true, input: value + "\n", encoding: "utf8" },
  );
  if (r.status === 0) {
    console.log(`+ ${name} -> ${target}`);
    ok++;
  } else {
    console.log(`! ${name}: ${(r.stderr || r.stdout || "").trim().split("\n")[0]}`);
  }
}
console.log(`\nDone. set=${ok} skipped=${skipped} target=${target}`);
