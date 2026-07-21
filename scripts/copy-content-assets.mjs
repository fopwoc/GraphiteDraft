import { access, cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const source = path.resolve(process.env.GRAPHITE_CONTENT_DIR || "./examples/content");
const buildOutput = path.resolve(process.env.GRAPHITE_BUILD_DIR || "./dist");
const requestedOutput = process.env.GRAPHITE_OUTPUT_DIR
  ? path.resolve(process.env.GRAPHITE_OUTPUT_DIR)
  : buildOutput;

await flatten404(buildOutput);
await rewriteHtmlUrls(buildOutput);
await inline404Styles(buildOutput);
await inline404Scripts(buildOutput);
await copyAssets(source, buildOutput);

if (requestedOutput !== buildOutput) {
  await mkdir(requestedOutput, { recursive: true });
  await cp(buildOutput, requestedOutput, { recursive: true, force: true });
}

async function copyAssets(directory, destination) {
  await mkdir(destination, { recursive: true });
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;
    const from = path.join(directory, entry.name);
    const to = path.join(destination, entry.name);
    if (
      isSameOrChild(from, requestedOutput)
      || entry.name === "node_modules"
      || entry.name === "dist"
    ) continue;
    if (entry.isDirectory()) {
      await copyAssets(from, to);
    } else if (!/\.(?:md|mdx)$/i.test(entry.name)) {
      if (await pathExists(to)) {
        throw new Error(`Content asset conflicts with generated output: ${from}`);
      }
      await cp(from, to, { force: true });
    }
  }
}

async function pathExists(file) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

function isSameOrChild(candidate, parent) {
  const relative = path.relative(parent, candidate);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

async function flatten404(output) {
  const directory = path.join(output, "404.html");
  const generatedPage = path.join(directory, "index.html");
  let html;
  try {
    html = await readFile(generatedPage, "utf8");
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") return;
    throw error;
  }

  await rm(directory, { recursive: true, force: true });
  await writeFile(path.join(output, "404.html"), html);
}

async function rewriteHtmlUrls(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await rewriteHtmlUrls(file);
    } else if (entry.name.endsWith(".html")) {
      const html = await readFile(file, "utf8");
      const rewritten = html
        .replace(/\b(href|src)="(\/(?!\/)[^"]*)"/g, (_, attribute, url) => (
          `${attribute}="${relativeUrl(file, url)}"`
        ))
        .replace(/\bsrcset="([^"]+)"/g, (_, value) => (
          `srcset="${rewriteSrcset(file, value)}"`
        ));
      await writeFile(file, rewritten);
    }
  }
}

function rewriteSrcset(htmlFile, value) {
  return value.split(",").map((candidate) => {
    const match = candidate.trim().match(/^(\/\S+)(\s+.+)?$/);
    if (!match || match[1].startsWith("//")) return candidate.trim();
    return `${relativeUrl(htmlFile, match[1])}${match[2] || ""}`;
  }).join(", ");
}

function relativeUrl(htmlFile, absoluteUrl) {
  if (absoluteUrl.startsWith("//")) return absoluteUrl;
  const match = absoluteUrl.match(/^([^?#]*)([?#].*)?$/);
  if (!match) return absoluteUrl;

  const pathname = match[1];
  const suffix = match[2] || "";
  const directoryTarget = pathname.endsWith("/");
  const target = pathname.replace(/^\/+|\/+$/g, "");
  const from = path.relative(buildOutput, path.dirname(htmlFile)).split(path.sep).join("/");
  let relative = path.posix.relative(from || ".", target || ".");
  if (!relative) relative = ".";
  if (directoryTarget && !relative.endsWith("/")) relative += "/";
  return `${relative}${suffix}`;
}

async function inline404Styles(output) {
  const file = path.join(output, "404.html");
  let html;
  try {
    html = await readFile(file, "utf8");
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") return;
    throw error;
  }

  const stylesheet = /<link\b(?=[^>]*\brel="stylesheet")(?=[^>]*\bhref="([^"]+)")[^>]*>/g;
  for (const match of [...html.matchAll(stylesheet)]) {
    const href = match[1].split(/[?#]/, 1)[0];
    const cssFile = path.resolve(path.dirname(file), href);
    if (!isSameOrChild(cssFile, output)) continue;
    const css = await readFile(cssFile, "utf8");
    html = html.replace(match[0], `<style>${css}</style>`);
  }
  await writeFile(file, html);
}

async function inline404Scripts(output) {
  const file = path.join(output, "404.html");
  let html;
  try {
    html = await readFile(file, "utf8");
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") return;
    throw error;
  }

  const script = /<script\b(?=[^>]*\bsrc="([^"]+)")[^>]*><\/script>/g;
  for (const match of [...html.matchAll(script)]) {
    const src = match[1].split(/[?#]/, 1)[0];
    const scriptFile = path.resolve(path.dirname(file), src);
    if (!isSameOrChild(scriptFile, output)) continue;
    const javascript = await readFile(scriptFile, "utf8");
    html = html.replace(match[0], `<script type="module">${javascript}</script>`);
  }
  await writeFile(file, html);
}
