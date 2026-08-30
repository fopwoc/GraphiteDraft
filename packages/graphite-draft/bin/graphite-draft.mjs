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
  console.log(process.env.GRAPHITE_VERSION || packageJson.buildIdentity || packageJson.version);
  process.exit(0);
}

if (command !== "check" && command !== "build") {
  fail(`Unknown command: ${command}`);
}

const { positional, enableExternalFonts, force } = parseOptions(args);
const source = path.resolve(positional[0] || ".");
await requireDirectory(source, "Markdown source");

if (command === "check" && force) {
  fail("--force can only be used with build");
}

const temporaryRoot = await mkdtemp(path.join(tmpdir(), "graphite-draft-"));
const temporaryBuild = path.join(temporaryRoot, "build");
const temporaryCache = path.join(temporaryRoot, "cache");
let buildFailed = false;
try {
  const output = command === "build"
    ? path.resolve(positional[1] || "dist")
    : temporaryBuild;

  if (command === "build" && isSameOrChild(source, output)) {
    fail("Output directory must not contain the Markdown source directory");
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
      GRAPHITE_FORCE_OUTPUT: String(force),
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

function isSameOrChild(candidate, parent) {
  const relative = path.relative(parent, candidate);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function hasAstroRenderError(stderr) {
  return stderr.includes("Error rendering") || stderr.includes("Failed to parse Markdown");
}

function parseOptions(values) {
  let enableExternalFonts = process.env.GRAPHITE_ENABLE_EXTERNAL_FONTS === "true";
  let force = false;
  const positional = [];

  for (const value of values) {
    if (value === "--enable-external-fonts") {
      enableExternalFonts = true;
    } else if (value === "--force") {
      force = true;
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
  return { positional, enableExternalFonts, force };
}

function fail(message) {
  console.error(`graphite-draft: ${message}`);
  process.exit(1);
}

function printHelp() {
  console.log(`Graphite Draft

Usage:
  graphite-draft check [source]
  graphite-draft build [source] [output] [--force] [--enable-external-fonts]

Commands:
  check  Fully render Markdown into a temporary directory and validate it
  build  Render Markdown into output (default: ./dist)

Options:
  --force                  Replace a non-empty output directory
  --enable-external-fonts  Allow Mermaid to load fonts from Google Fonts
`);
}
