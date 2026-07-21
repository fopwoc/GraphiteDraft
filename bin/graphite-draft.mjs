#!/usr/bin/env node

import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const packageRoot = fileURLToPath(new URL("../", import.meta.url));
const [command, ...args] = process.argv.slice(2);

if (!command || command === "help" || command === "--help" || command === "-h") {
  printHelp();
  process.exit(0);
}

if (command === "--version" || command === "-v") {
  const packageJson = JSON.parse(await readFile(path.join(packageRoot, "package.json"), "utf8"));
  console.log(packageJson.version);
  process.exit(0);
}

if (command !== "check" && command !== "build") {
  fail(`Unknown command: ${command}`);
}

const { positional, enableExternalFonts } = parseOptions(args);
const source = path.resolve(positional[0] || ".");
await requireDirectory(source, "Markdown source");

const temporaryRoot = await mkdtemp(path.join(tmpdir(), "graphite-draft-"));
const temporaryBuild = path.join(temporaryRoot, "build");
const temporaryCache = path.join(temporaryRoot, "cache");
let buildFailed = false;
try {
  const output = command === "build"
    ? path.resolve(positional[1] || "dist")
    : temporaryBuild;

  if (command === "build" && isSamePath(output, source)) {
    fail("Output directory must not be the Markdown source directory itself");
  }

  const result = spawnSync(process.execPath, [path.join(packageRoot, "scripts/build.mjs")], {
    cwd: packageRoot,
    env: {
      ...process.env,
      ASTRO_TELEMETRY_DISABLED: "1",
      GRAPHITE_BUILD_DIR: temporaryBuild,
      GRAPHITE_CACHE_DIR: temporaryCache,
      GRAPHITE_CONTENT_DIR: source,
      GRAPHITE_ENABLE_EXTERNAL_FONTS: String(enableExternalFonts),
      GRAPHITE_OUTPUT_DIR: output
    },
    encoding: "utf8"
  });

  process.stdout.write(result.stdout || "");
  process.stderr.write(result.stderr || "");
  buildFailed = result.status !== 0 || hasAstroRenderError(result.stderr || "");

  if (!buildFailed && command === "check") {
    console.log(`Graphite Draft check passed: ${source}`);
  } else if (!buildFailed) {
    console.log(`Graphite Draft built: ${output}`);
  }
} finally {
  await rm(temporaryRoot, { recursive: true, force: true });
}

if (buildFailed) process.exit(1);

async function requireDirectory(directory, label) {
  try {
    if ((await stat(directory)).isDirectory()) return;
  } catch {
    // Report a consistent CLI error below.
  }
  fail(`${label} is not a directory: ${directory}`);
}

function isSamePath(left, right) {
  return path.relative(left, right) === "";
}

function hasAstroRenderError(stderr) {
  return stderr.includes("Error rendering") || stderr.includes("Failed to parse Markdown");
}

function parseOptions(values) {
  let enableExternalFonts = process.env.GRAPHITE_ENABLE_EXTERNAL_FONTS === "true";
  const positional = [];

  for (const value of values) {
    if (value === "--enable-external-fonts") {
      enableExternalFonts = true;
    } else if (value.startsWith("--enable-external-fonts=")) {
      const setting = value.slice(value.indexOf("=") + 1);
      if (setting !== "true" && setting !== "false") {
        fail("--enable-external-fonts must be true or false");
      }
      enableExternalFonts = setting === "true";
    } else if (value.startsWith("--")) {
      fail(`Unknown option: ${value}`);
    } else {
      positional.push(value);
    }
  }
  return { positional, enableExternalFonts };
}

function fail(message) {
  console.error(`graphite-draft: ${message}`);
  process.exit(1);
}

function printHelp() {
  console.log(`Graphite Draft

Usage:
  graphite-draft check [source]
  graphite-draft build [source] [output] [--enable-external-fonts]

Commands:
  check  Fully render Markdown into a temporary directory and validate it
  build  Render Markdown into output (default: ./dist)

Options:
  --enable-external-fonts  Allow Mermaid to load fonts from Google Fonts
`);
}
