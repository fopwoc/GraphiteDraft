import { access, mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const workspace = await mkdtemp(path.join(tmpdir(), "graphite-draft-cli-test-"));
const cli = path.resolve("bin/graphite-draft.mjs");

try {
  const packageJson = JSON.parse(await readFile(path.resolve("package.json"), "utf8"));
  expectOutput(["--version"], `${packageJson.buildIdentity || packageJson.version}\n`);

  await writeFile(
    path.join(workspace, "tsconfig.json"),
    JSON.stringify({ extends: "astro/tsconfigs/strict" })
  );
  const valid = path.join(workspace, "valid");
  await mkdir(valid);
  await mkdir(path.join(valid, "assets"));
  await mkdir(path.join(valid, "features"));
  await writeFile(path.join(valid, "next.md"), "# Next\n");
  await writeFile(
    path.join(valid, "assets/diagram.svg"),
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"></svg>\n'
  );
  await writeFile(
    path.join(valid, "features/image.md"),
    "# Image\n\n![Diagram](../assets/diagram.svg)\n"
  );
  await writeFile(path.join(valid, "index.md"), `# Valid

[Next](next.md)

[Image](features/image.md)

\`\`\`mermaid
flowchart LR
  A --> B
\`\`\`
`);
  expectStatus(["check", valid], 0);

  const externalFontsOutput = path.join(workspace, "external-fonts-output");
  expectStatus(["build", valid, externalFontsOutput, "--enable-external-fonts"], 0);
  const externalFontsHtml = await readFile(path.join(externalFontsOutput, "index.html"), "utf8");
  if (!externalFontsHtml.includes("fonts.googleapis.com")) {
    throw new Error("External-font opt-in did not preserve the Mermaid font import");
  }
  if (!externalFontsHtml.includes('rel="icon" href="data:image/svg+xml,')) {
    throw new Error("A build without icon.svg did not use the embedded fallback icon");
  }

  const removedPageOutput = path.join(externalFontsOutput, "next/index.html");
  await access(removedPageOutput);
  await rm(path.join(valid, "next.md"));
  await writeFile(path.join(valid, "index.md"), "# Valid\n");
  expectStatus(["build", valid, externalFontsOutput], 1);
  await access(removedPageOutput);
  expectStatus([
    "build",
    valid,
    externalFontsOutput,
    "--force",
    "--enable-external-fonts"
  ], 0);
  await expectMissing(removedPageOutput);

  expectStatus(["check", valid, "--force"], 1);
  expectStatus(["build", valid, workspace, "--force"], 1);
  await access(path.join(valid, "index.md"));

  const brokenLink = path.join(workspace, "broken-link");
  await mkdir(brokenLink);
  await writeFile(path.join(brokenLink, "index.md"), "[Missing](missing.md)\n");
  expectStatus(["check", brokenLink], 1);

  const brokenMermaid = path.join(workspace, "broken-mermaid");
  await mkdir(brokenMermaid);
  await writeFile(path.join(brokenMermaid, "index.md"), "```mermaid\nnot a diagram\n```\n");
  expectStatus(["check", brokenMermaid], 1);

  const collision = path.join(workspace, "collision");
  await mkdir(collision);
  await writeFile(path.join(collision, "index.md"), "# Generated\n");
  await writeFile(path.join(collision, "index.html"), "<!doctype html>Raw\n");
  expectStatus(["check", collision], 1);
} finally {
  await rm(workspace, { recursive: true, force: true });
}

console.log("Graphite Draft CLI tests passed.");

function expectStatus(args: string[], expected: number) {
  const result = spawnSync("node", [cli, ...args], { encoding: "utf8" });
  if (result.status !== expected) {
    process.stdout.write(result.stdout || "");
    process.stderr.write(result.stderr || "");
    throw new Error(`Expected CLI status ${expected}, received ${result.status}`);
  }
}

function expectOutput(args: string[], expected: string) {
  const result = spawnSync("node", [cli, ...args], { encoding: "utf8" });
  if (result.status !== 0 || result.stdout !== expected) {
    process.stdout.write(result.stdout || "");
    process.stderr.write(result.stderr || "");
    throw new Error(`Expected CLI output ${JSON.stringify(expected)}`);
  }
}

async function expectMissing(file: string) {
  try {
    await access(file);
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") return;
    throw error;
  }
  throw new Error(`Expected file to be removed: ${file}`);
}
