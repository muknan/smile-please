import { readFileSync } from "node:fs";
import { spawn } from "node:child_process";

for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !(m[1] in process.env)) process.env[m[1]] = m[2];
}
const port = process.argv[2] ?? "3999";
const child = spawn(
  "node",
  ["node_modules/next/dist/bin/next", "start", "-p", port],
  { stdio: "inherit" },
);
child.on("exit", (code) => process.exit(code ?? 0));
