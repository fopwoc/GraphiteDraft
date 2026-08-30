import { readFileSync } from "node:fs";
import path from "node:path";

const packageJson = JSON.parse(
  readFileSync(path.resolve("package.json"), "utf8")
);

export const buildIdentity = process.env.GRAPHITE_VERSION
  || packageJson.buildIdentity
  || packageJson.version;
