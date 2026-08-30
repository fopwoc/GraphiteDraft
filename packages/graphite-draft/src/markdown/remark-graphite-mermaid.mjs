import { createHash } from "node:crypto";
import { Window } from "happy-dom";

let rendererPromise;
let renderQueue = Promise.resolve();

export function remarkGraphiteMermaid(options = {}) {
  const fontFamily = options.enableExternalFonts
    ? "Inter, ui-sans-serif, system-ui, sans-serif"
    : "ui-sans-serif, system-ui, sans-serif";

  return async function transform(tree, file) {
    const diagrams = [];
    visit(tree, (node) => {
      if (node.type === "code" && node.lang?.toLowerCase() === "mermaid") {
        diagrams.push(node);
      }
    });
    if (diagrams.length === 0) return;

    await enqueueRender(async () => {
      const renderer = await loadRenderer();
      await withTemporaryGlobals(renderer.globals, async () => {
        for (const [index, node] of diagrams.entries()) {
          try {
            const id = diagramId(file.path, index, node.value);
            const light = await renderSvg(renderer.mermaid, `${id}-light`, node.value, {
              fontFamily,
              theme: "default"
            });
            const dark = await renderSvg(renderer.mermaid, `${id}-dark`, node.value, {
              fontFamily,
              theme: "dark"
            });

            node.type = "html";
            node.value = `<div class="mermaid-diagram"><div class="mermaid-theme-light">${light}</div><div class="mermaid-theme-dark">${dark}</div></div>`;
            delete node.lang;
            delete node.meta;
          } catch (error) {
            const location = file.path ? ` in ${file.path}` : "";
            const message = error instanceof Error ? error.message : String(error);
            throw new Error(`Unable to render Mermaid diagram${location}: ${message}`, {
              cause: error
            });
          }
        }
      });
    });
  };
}

async function loadRenderer() {
  rendererPromise ??= (async () => {
    const previous = captureGlobals(["window", "document"]);
    try {
      const { default: mermaid } = await import("isomorphic-mermaid");
      const cssWindow = new Window();
      return {
        mermaid,
        globals: {
          window: globalThis.window,
          document: globalThis.document,
          CSSStyleSheet: cssWindow.CSSStyleSheet
        }
      };
    } finally {
      restoreGlobals(previous);
    }
  })();
  return rendererPromise;
}

async function renderSvg(mermaid, id, source, { fontFamily, theme }) {
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: "strict",
    htmlLabels: false,
    fontFamily,
    theme
  });
  const { svg } = await mermaid.render(id, source);
  return svg;
}

function enqueueRender(callback) {
  const result = renderQueue.then(callback, callback);
  renderQueue = result.catch(() => {});
  return result;
}

async function withTemporaryGlobals(globals, callback) {
  const previous = captureGlobals(Object.keys(globals));
  for (const [name, value] of Object.entries(globals)) {
    Object.defineProperty(globalThis, name, {
      configurable: true,
      writable: true,
      value
    });
  }
  try {
    return await callback();
  } finally {
    restoreGlobals(previous);
  }
}

function captureGlobals(names) {
  return new Map(names.map((name) => [
    name,
    Object.getOwnPropertyDescriptor(globalThis, name)
  ]));
}

function restoreGlobals(previous) {
  for (const [name, descriptor] of previous) {
    if (descriptor) Object.defineProperty(globalThis, name, descriptor);
    else delete globalThis[name];
  }
}

function diagramId(filePath, index, source) {
  const hash = createHash("sha256")
    .update(`${filePath || "unknown"}\0${index}\0${source}`)
    .digest("hex")
    .slice(0, 12);
  return `mermaid-${hash}`;
}

function visit(node, callback) {
  callback(node);
  if (!Array.isArray(node.children)) return;
  for (const child of node.children) visit(child, callback);
}
