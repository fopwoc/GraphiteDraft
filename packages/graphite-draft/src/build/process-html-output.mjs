import { readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { minify } from "html-minifier-terser";
import { isSameOrChild } from "../utils/filesystem.mjs";

export async function processHtmlOutput(output) {
  await flatten404(output);
  await rewriteHtmlUrls(output, output);
  await inline404Resources(output);
  await minifyGeneratedHtml(output);
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

async function rewriteHtmlUrls(directory, output) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await rewriteHtmlUrls(file, output);
    } else if (entry.name.endsWith(".html")) {
      const html = await readFile(file, "utf8");
      const rewritten = html
        .replace(/\b(href|src)="(\/(?!\/)[^"]*)"/g, (_, attribute, url) => (
          `${attribute}="${relativeUrl(file, url, output)}"`
        ))
        .replace(/\bsrcset="([^"]+)"/g, (_, value) => (
          `srcset="${rewriteSrcset(file, value, output)}"`
        ));
      await writeFile(file, rewritten);
    }
  }
}

async function inline404Resources(output) {
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

  const script = /<script\b(?=[^>]*\bsrc="([^"]+)")[^>]*><\/script>/g;
  for (const match of [...html.matchAll(script)]) {
    const source = match[1].split(/[?#]/, 1)[0];
    const scriptFile = path.resolve(path.dirname(file), source);
    if (!isSameOrChild(scriptFile, output)) continue;
    const javascript = await readFile(scriptFile, "utf8");
    html = html.replace(match[0], `<script type="module">${javascript}</script>`);
  }

  await writeFile(file, html);
}

async function minifyGeneratedHtml(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await minifyGeneratedHtml(file);
    } else if (entry.name.endsWith(".html")) {
      const html = await readFile(file, "utf8");
      const minimized = await minify(html, {
        collapseWhitespace: true,
        ignoreCustomFragments: [/<code(?:\s[^>]*)?>[\s\S]*?<\/code>/i],
        removeComments: true,
        removeRedundantAttributes: true,
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributes: true,
        useShortDoctype: true
      });
      await writeFile(file, minimized);
    }
  }
}

function rewriteSrcset(htmlFile, value, output) {
  return value.split(",").map((candidate) => {
    const match = candidate.trim().match(/^(\/\S+)(\s+.+)?$/);
    if (!match || match[1].startsWith("//")) return candidate.trim();
    return `${relativeUrl(htmlFile, match[1], output)}${match[2] || ""}`;
  }).join(", ");
}

function relativeUrl(htmlFile, absoluteUrl, output) {
  if (absoluteUrl.startsWith("//")) return absoluteUrl;
  const match = absoluteUrl.match(/^([^?#]*)([?#].*)?$/);
  if (!match) return absoluteUrl;

  const pathname = match[1];
  const suffix = match[2] || "";
  const directoryTarget = pathname.endsWith("/");
  const target = pathname.replace(/^\/+|\/+$/g, "");
  const from = path.relative(output, path.dirname(htmlFile)).split(path.sep).join("/");
  let relative = path.posix.relative(from || ".", target || ".");
  if (!relative) relative = ".";
  if (directoryTarget && !relative.endsWith("/")) relative += "/";
  return `${relative}${suffix}`;
}
