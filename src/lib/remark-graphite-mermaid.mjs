import { renderMermaidSVG } from "beautiful-mermaid";

export function remarkGraphiteMermaid(options = {}) {
  const enableExternalFonts = options.enableExternalFonts === true;
  return function transform(tree, file) {
    visit(tree, (node) => {
      if (node.type !== "code" || node.lang?.toLowerCase() !== "mermaid") return;

      try {
        let svg = renderMermaidSVG(node.value, {
          bg: "var(--graphite-diagram-bg)",
          fg: "var(--graphite-diagram-fg)",
          line: "var(--graphite-diagram-line)",
          accent: "var(--graphite-diagram-accent)",
          muted: "var(--graphite-diagram-muted)",
          surface: "var(--graphite-diagram-surface)",
          border: "var(--graphite-diagram-border)",
          font: enableExternalFonts ? "Inter" : "system-ui",
          transparent: true
        });
        if (!enableExternalFonts) {
          svg = svg.replace(
            /@import\s+url\(['"]https:\/\/fonts\.googleapis\.com\/[^)]*\);\s*/g,
            ""
          );
          svg = svg.replace(
            /font-family:\s*'system-ui',\s*system-ui,\s*sans-serif/g,
            "font-family:var(--font-sans)"
          );
        }
        node.type = "html";
        node.value = `<div class="mermaid">${svg}</div>`;
        delete node.lang;
        delete node.meta;
      } catch (error) {
        const location = file.path ? ` in ${file.path}` : "";
        throw new Error(`Unable to render Mermaid diagram${location}: ${error.message}`, {
          cause: error
        });
      }
    });
  };
}

function visit(node, callback) {
  callback(node);
  if (!Array.isArray(node.children)) return;
  for (const child of node.children) visit(child, callback);
}
