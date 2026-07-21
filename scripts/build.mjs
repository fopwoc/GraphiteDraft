import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const astroRoot = path.dirname(fileURLToPath(import.meta.resolve("astro/package.json")));
const astroCli = path.join(astroRoot, "bin/astro.mjs");
const result = spawnSync(process.execPath, [astroCli, "build"], {
  encoding: "utf8",
  env: process.env
});

process.stdout.write(result.stdout || "");
process.stderr.write(result.stderr || "");

const diagnostics = `${result.stdout || ""}\n${result.stderr || ""}`;
if (
  result.status !== 0
  || diagnostics.includes("Error rendering")
  || diagnostics.includes("Failed to parse Markdown")
) {
  process.exit(1);
}

await import("./copy-content-assets.mjs");
