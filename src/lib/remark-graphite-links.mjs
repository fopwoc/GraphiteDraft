import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const externalUrl = /^(?:[a-z][a-z+.-]*:|\/|#)/i;
const markdownExtension = /\.(?:md|mdx)$/i;

export function remarkGraphiteLinks(options = {}) {
  const contentRoot = path.resolve(options.contentDirectory || "./content");
  const base = options.base && options.base !== "/"
    ? `/${options.base.replace(/^\/+|\/+$/g, "")}`
    : "";

  return function transform(tree, file) {
    const sourcePath = getSourcePath(file);
    if (!sourcePath) return;

    visit(tree, (node) => {
      if ((node.type !== "link" && node.type !== "image") || !node.url || externalUrl.test(node.url)) return;

      const match = node.url.match(/^([^?#]*)([?#].*)?$/);
      if (!match || !match[1]) return;

      const target = path.resolve(path.dirname(sourcePath), decodeURI(match[1]));
      const relative = path.relative(contentRoot, target);
      if (relative.startsWith("..") || path.isAbsolute(relative)) return;
      if (!existsSync(target)) {
        throw new Error(
          `Broken local ${node.type === "image" ? "image" : "link"} in ${sourcePath}: ${node.url}`
        );
      }

      if (node.type === "image") return;

      const suffix = match[2] || "";
      const outputPath = markdownExtension.test(relative)
        ? pageRoute(relative)
        : relative.split(path.sep).map(encodeURIComponent).join("/");
      node.url = `${base}/${outputPath}${suffix}`.replace(/\/+/g, "/");
    });
  };
}

function getSourcePath(file) {
  const value = file.path || file.history?.at(-1);
  if (!value) return undefined;
  return value.startsWith("file:") ? fileURLToPath(value) : path.resolve(value);
}

function pageRoute(relativePath) {
  const withoutExtension = relativePath.replace(markdownExtension, "");
  if (withoutExtension.toLowerCase() === "404") return "404.html";
  const withoutIndex = withoutExtension.replace(/(^|[\\/])index$/i, "");
  const route = withoutIndex
    .split(path.sep)
    .filter(Boolean)
    .map(encodeURIComponent)
    .join("/");
  return route ? `${route}/` : "";
}

function visit(node, callback) {
  callback(node);
  if (!Array.isArray(node.children)) return;
  for (const child of node.children) visit(child, callback);
}
