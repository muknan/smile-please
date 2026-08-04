// Patches Next 15.1.6's bundled @vercel/og font/wasm path resolution, which
// is broken on Windows: `fileURLToPath(join(import.meta.url, "../x"))` mangles
// the file:/// scheme into `file:\...` (ERR_INVALID_URL, so /og 500s).
// Replaced with `new URL("./x", import.meta.url)` — correct on every platform,
// so the patch is a safe no-op-equivalent on Linux/Vercel. See NOTES.md.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const targets = [
  "node_modules/next/dist/compiled/@vercel/og/index.node.js",
  "node_modules/next/dist/compiled/@vercel/og/index.edge.js",
];

const broken = /fileURLToPath\(join\(import\.meta\.url,\s*"\.\.\/([^"]+)"\)\)/g;
const fixed = 'fileURLToPath(new URL("./$1", import.meta.url))';

for (const rel of targets) {
  const path = join(process.cwd(), rel);
  if (!existsSync(path)) continue;
  const src = readFileSync(path, "utf8");
  const patched = src.replace(broken, fixed);
  if (patched !== src) {
    writeFileSync(path, patched);
    console.log(`[patch-og-font] patched ${rel}`);
  }
}
