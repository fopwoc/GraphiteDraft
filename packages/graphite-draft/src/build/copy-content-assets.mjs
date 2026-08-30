import { cp, mkdir, readdir } from "node:fs/promises";
import path from "node:path";
import { isSameOrChild, pathExists } from "../utils/filesystem.mjs";

export async function copyContentAssets(source, destination, requestedOutput) {
  await mkdir(destination, { recursive: true });
  for (const entry of await readdir(source, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;

    const from = path.join(source, entry.name);
    const to = path.join(destination, entry.name);
    if (
      isSameOrChild(from, requestedOutput)
      || entry.name === "node_modules"
      || entry.name === "dist"
    ) continue;

    if (entry.isDirectory()) {
      await copyContentAssets(from, to, requestedOutput);
    } else if (!/\.(?:md|mdx)$/i.test(entry.name)) {
      if (await pathExists(to)) {
        throw new Error(`Content asset conflicts with generated output: ${from}`);
      }
      await cp(from, to, { force: true });
    }
  }
}
