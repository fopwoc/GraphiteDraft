import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const output = await mkdtemp(path.join(tmpdir(), "graphite-draft-smoke-"));
try {
  const result = spawnSync(process.execPath, ["run", "build"], {
    env: {
      ...process.env,
      GRAPHITE_OUTPUT_DIR: output,
      GRAPHITE_CACHE_DIR: path.join(output, ".astro-cache")
    },
    stdio: "inherit"
  });
  if (result.status !== 0) process.exit(result.status ?? 1);

  const rootHtml = await readFile(path.join(output, "index.html"), "utf8");
  const notFoundHtml = await readFile(path.join(output, "404.html"), "utf8");
  const rawHtml = await readFile(path.join(output, "raw.html"), "utf8");
  const icon = await readFile(path.join(output, "icon.svg"), "utf8");
  const sourceIcon = await readFile(path.resolve("examples/content/icon.svg"), "utf8");
  const guideIndexHtml = await readFile(path.join(output, "guide/index.html"), "utf8");
  const guideHtml = await readFile(
    path.join(output, "guide/getting-started/index.html"),
    "utf8"
  );

  assertIncludes(rootHtml, 'href="guide/getting-started/"');
  assertIncludes(rootHtml, 'href="_astro/');
  assertIncludes(rootHtml, '<div class="mermaid"><svg');
  assertIncludes(rootHtml, 'class="heading-anchor" href="#zero-rewrite-markdown"');
  assertIncludes(rootHtml, 'aria-hidden="true" tabindex="-1"');
  assertIncludes(rootHtml, '<details>');
  assertIncludes(rootHtml, '<kbd>Enter</kbd>');
  assertIncludes(rootHtml, '<mark>just click it</mark>');
  assertIncludes(rootHtml, 'name="theme-color" content="#fafaf9"');
  assertIncludes(rootHtml, 'name="theme-color" content="#09090b"');
  assertIncludes(rootHtml, 'rel="icon" href="icon.svg"');
  assertExcludes(rootHtml, "language-mermaid");
  assertExcludes(rootHtml, "Mermaid.astro");
  assertExcludes(rootHtml, "fonts.googleapis.com");
  assertIncludes(rootHtml, "font-family:var(--font-sans)");
  const scriptName = rootHtml.match(/src="(_astro\/[^"]+\.js)"/)?.[1];
  if (!scriptName) throw new Error("Generated copy script was not linked");
  const script = await readFile(path.join(output, scriptName), "utf8");
  assertIncludes(script, "pre.astro-code");
  assertIncludes(script, "Click to copy");
  assertExcludes(rootHtml, "pre.astro-code");
  assertIncludes(guideIndexHtml, 'href="getting-started/"');
  assertIncludes(guideIndexHtml, 'href="../_astro/');
  assertIncludes(guideIndexHtml, 'rel="icon" href="../icon.svg"');
  assertOccurrences(guideHtml, 'href="../mdx-example/"', 2);
  assertIncludes(guideHtml, 'href="../mdx-example/#custom-markup"');
  assertIncludes(guideHtml, 'href="../example.txt"');
  assertIncludes(guideHtml, 'href="../../"');
  assertIncludes(guideHtml, 'src="../../_astro/diagram.');
  assertIncludes(guideHtml, 'rel="icon" href="../../icon.svg"');
  assertIncludes(guideHtml, '<figure class="image-figure">');
  assertIncludes(guideHtml, '<figcaption>Markdown becomes a static website</figcaption>');
  assertNoRootRelativeUrls(rootHtml);
  assertIncludes(notFoundHtml, "Page not found");
  assertIncludes(notFoundHtml, "This 404 was rendered from MDX");
  assertIncludes(notFoundHtml, "<style>");
  assertIncludes(notFoundHtml, "prefers-color-scheme:dark");
  assertExcludes(notFoundHtml, 'rel="stylesheet"');
  assertExcludes(notFoundHtml, 'href="_astro/');
  assertExcludes(notFoundHtml, 'src="_astro/');
  assertIncludes(notFoundHtml, 'rel="icon" href="data:image/svg+xml,');
  assertIncludes(notFoundHtml, "pre.astro-code");
  assertNoRootRelativeUrls(notFoundHtml);
  assertNoRootRelativeUrls(guideIndexHtml);
  assertNoRootRelativeUrls(guideHtml);
  const cssName = rootHtml.match(/href="(_astro\/[^"]+\.css)"/)?.[1];
  if (!cssName) throw new Error("Generated stylesheet was not linked");
  const css = await readFile(path.join(output, cssName), "utf8");
  assertIncludes(css, "Segoe UI Variable Text");
  assertIncludes(css, "Cascadia Mono");
  assertIncludes(css, "font-variant-ligatures:none");
  assertIncludes(css, "cursor:copy");
  assertIncludes(css, "data-copy-status");
  assertIncludes(css, "content:attr(data-language)");
  assertIncludes(css, "text-wrap:balance");
  assertIncludes(css, ".heading-anchor");
  assertIncludes(css, ".image-figure");
  assertIncludes(css, ".prose details");
  assertIncludes(css, "padding:.625rem .875rem");
  if (rawHtml !== '<!doctype html><a href="/leave-this-alone">Raw HTML</a>\n') {
    throw new Error("Raw HTML was not copied byte-for-byte");
  }
  if (icon !== sourceIcon) throw new Error("Root icon.svg was not copied byte-for-byte");
} finally {
  await rm(output, { recursive: true, force: true });
}

console.log("Graphite Draft smoke tests passed.");

function assertIncludes(value: string, expected: string) {
  if (!value.includes(expected)) {
    throw new Error(`Expected generated HTML to include: ${expected}`);
  }
}

function assertExcludes(value: string, unexpected: string) {
  if (value.includes(unexpected)) {
    throw new Error(`Expected generated HTML not to include: ${unexpected}`);
  }
}

function assertOccurrences(value: string, expected: string, count: number) {
  const actual = value.split(expected).length - 1;
  if (actual !== count) {
    throw new Error(`Expected ${count} occurrences of ${expected}, found ${actual}`);
  }
}

function assertNoRootRelativeUrls(value: string) {
  if (/\b(?:href|src)="\/(?!\/)/.test(value)) {
    throw new Error("Generated HTML contains a root-relative URL");
  }
}
