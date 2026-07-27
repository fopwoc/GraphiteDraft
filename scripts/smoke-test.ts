import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const workspace = await mkdtemp(path.join(tmpdir(), "graphite-draft-smoke-"));
const output = path.join(workspace, "output");
try {
  const result = spawnSync(process.execPath, ["run", "build"], {
    env: {
      ...process.env,
      GRAPHITE_OUTPUT_DIR: output,
      GRAPHITE_CACHE_DIR: path.join(workspace, ".astro-cache")
    },
    stdio: "inherit"
  });
  if (result.status !== 0) process.exit(result.status ?? 1);

  const rootHtml = await readFile(path.join(output, "index.html"), "utf8");
  const notFoundHtml = await readFile(path.join(output, "404.html"), "utf8");
  const rawHtml = await readFile(path.join(output, "raw.html"), "utf8");
  const icon = await readFile(path.join(output, "icon.svg"), "utf8");
  const sourceIcon = await readFile(path.resolve("examples/content/icon.svg"), "utf8");
  const kitchenSinkHtml = await readFile(
    path.join(output, "features/kitchen-sink/index.html"),
    "utf8"
  );
  const alertsHtml = await readFile(path.join(output, "features/alerts/index.html"), "utf8");
  const assetsHtml = await readFile(path.join(output, "features/assets/index.html"), "utf8");
  const linksHtml = await readFile(
    path.join(output, "features/links-and-routing/index.html"),
    "utf8"
  );
  const mermaidHtml = await readFile(
    path.join(output, "features/mermaid/index.html"),
    "utf8"
  );
  const todoHtml = await readFile(path.join(output, "features/todo/index.html"), "utf8");
  const frontmatterHtml = await readFile(
    path.join(output, "features/frontmatter/index.html"),
    "utf8"
  );
  const todoScript = await readFile(path.join(output, "features/todo-app.js"), "utf8");
  const binary = await readFile(path.join(output, "assets/sample.bin"));
  const sourceBinary = await readFile(path.resolve("examples/content/assets/sample.bin"));

  assertIncludes(rootHtml, 'href="features/frontmatter/"');
  assertIncludes(rootHtml, 'href="features/mermaid/"');
  assertIncludes(rootHtml, 'href="features/kitchen-sink/"');
  assertIncludes(rootHtml, 'href="features/todo/"');
  assertIncludes(rootHtml, 'href="_astro/');
  assertIncludes(kitchenSinkHtml, 'class="mermaid-diagram"');
  assertIncludes(kitchenSinkHtml, 'class="mermaid-theme-light"><svg');
  assertIncludes(kitchenSinkHtml, 'class="mermaid-theme-dark"><svg');
  assertExcludes(rootHtml, "\n  <head>");
  assertExcludes(rootHtml, "\n    <main");
  assertIncludes(kitchenSinkHtml, '>Content pipeline</text>');
  assertIncludes(kitchenSinkHtml, 'class="heading-anchor" href="#formatting-and-links"');
  assertIncludes(kitchenSinkHtml, 'aria-hidden="true" tabindex="-1"');
  assertIncludes(kitchenSinkHtml, '<details>');
  assertIncludes(kitchenSinkHtml, '<kbd>keyboard labels</kbd>');
  assertIncludes(kitchenSinkHtml, '<mark>highlighting</mark>');
  assertIncludes(kitchenSinkHtml, 'class="markdown-alert markdown-alert-important"');
  assertIncludes(kitchenSinkHtml, 'class="contains-task-list"');
  assertIncludes(kitchenSinkHtml, 'class="task-list-item"');
  assertIncludes(kitchenSinkHtml, '<code>inline code</code>');
  assertIncludes(kitchenSinkHtml, '<div class="code-block" data-language="js"><pre class="astro-code');
  if (/<\/p>\s{2,}<table/.test(kitchenSinkHtml)) {
    throw new Error("Generated table is preceded by redundant whitespace");
  }
  assertIncludes(rootHtml, 'name="theme-color" content="#fafaf9"');
  assertIncludes(rootHtml, 'name="theme-color" content="#09090b"');
  assertIncludes(rootHtml, 'rel="icon" href="icon.svg"');
  assertExcludes(kitchenSinkHtml, "language-mermaid");
  assertExcludes(kitchenSinkHtml, "Mermaid.astro");
  assertExcludes(rootHtml, "fonts.googleapis.com");
  const scriptNames = [...rootHtml.matchAll(/src="(_astro\/[^"]+\.js)"/g)]
    .map((match) => match[1]);
  if (scriptNames.length !== 1) throw new Error("Only the copy script should be linked");
  const scripts = (await Promise.all(
    scriptNames.map((scriptName) => readFile(path.join(output, scriptName), "utf8"))
  )).join("\n");
  assertIncludes(scripts, "pre.astro-code");
  assertIncludes(scripts, "code-block");
  assertIncludes(scripts, "Click to copy");
  assertExcludes(scripts, "mermaid");
  assertExcludes(rootHtml, "pre.astro-code");
  assertIncludes(assetsHtml, 'href="../../assets/example.txt"');
  assertIncludes(assetsHtml, 'src="../../_astro/diagram.');
  assertIncludes(assetsHtml, 'rel="icon" href="../../icon.svg"');
  assertIncludes(assetsHtml, '<figure class="image-figure">');
  assertIncludes(assetsHtml, '<figcaption>A local SVG with a caption</figcaption>');
  assertIncludes(assetsHtml, 'href="../../assets/sample.bin"');
  assertIncludes(assetsHtml, "A plain Markdown link does not force a download");
  assertIncludes(linksHtml, 'href="../alerts/"');
  assertIncludes(linksHtml, 'href="../kitchen-sink/"');
  assertIncludes(linksHtml, 'href="../../"');
  assertIncludes(linksHtml, 'href="../code/#multiple-languages"');
  assertOccurrences(mermaidHtml, '<div class="mermaid-diagram">', 6);
  assertIncludes(mermaidHtml, '>Build pipeline</text>');
  assertIncludes(mermaidHtml, '>Deployment sequence</text>');
  assertIncludes(alertsHtml, 'class="markdown-alert markdown-alert-important"');
  assertIncludes(alertsHtml, 'class="markdown-alert markdown-alert-caution"');
  assertIncludes(todoHtml, '<title>Interactive MDX todo list</title>');
  assertExcludes(todoHtml, '<h1>Interactive MDX todo list</h1>');
  assertIncludes(frontmatterHtml, '<h1>Frontmatter controls the page title</h1>');
  assertIncludes(todoHtml, 'id="todo-input"');
  assertIncludes(todoHtml, '<button type="submit">Add</button>');
  assertIncludes(todoHtml, 'src="../todo-app.js"');
  assertIncludes(todoScript, 'graphite-draft-example-todos');
  assertIncludes(todoScript, 'label: "Pick up Paycheck"');
  assertIncludes(todoScript, 'label: "Cash Paycheck"');
  assertIncludes(todoScript, 'label: "Get Milk"');
  assertIncludes(todoScript, 'localStorage.setItem');
  assertIncludes(todoScript, 'crypto.randomUUID()');
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
  assertNoRootRelativeUrls(assetsHtml);
  assertNoRootRelativeUrls(linksHtml);
  const cssName = rootHtml.match(/href="(_astro\/[^"]+\.css)"/)?.[1];
  if (!cssName) throw new Error("Generated stylesheet was not linked");
  const css = await readFile(path.join(output, cssName), "utf8");
  assertIncludes(css, "Segoe UI Variable Text");
  assertIncludes(css, "Cascadia Mono");
  assertIncludes(css, "font-variant-ligatures:none");
  assertIncludes(css, "cursor:copy");
  assertIncludes(css, "data-copy-status");
  assertIncludes(css, "content:attr(data-language)");
  assertIncludes(css, "color:var(--shiki-light)!important");
  assertIncludes(css, ".code-block:after");
  assertIncludes(css, "text-wrap:balance");
  assertIncludes(css, ".heading-anchor");
  assertIncludes(css, ".image-figure");
  assertIncludes(css, ".prose details");
  assertIncludes(css, ".markdown-alert-important");
  assertIncludes(css, ".markdown-alert-note");
  assertIncludes(css, ".markdown-alert-tip");
  assertIncludes(css, ".markdown-alert-warning");
  assertIncludes(css, ".markdown-alert-caution");
  assertIncludes(css, ".task-list-item");
  assertIncludes(css, ".mermaid-theme-dark");
  assertIncludes(css, "content:none");
  assertIncludes(css, "--graphite-inline-code-bg");
  assertIncludes(css, "padding:.625rem .875rem");
  if (rawHtml !== '<!doctype html><a href="/leave-this-alone">Raw HTML</a>\n') {
    throw new Error("Raw HTML was not copied byte-for-byte");
  }
  if (icon !== sourceIcon) throw new Error("Root icon.svg was not copied byte-for-byte");
  if (!binary.equals(sourceBinary)) throw new Error("Binary attachment was not copied byte-for-byte");
} finally {
  await rm(workspace, { recursive: true, force: true });
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
