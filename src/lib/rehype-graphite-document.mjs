export function rehypeGraphiteDocument() {
  return function transform(tree) {
    visit(tree, (node, parent, index) => {
      if (isCodeBlock(node)) {
        wrapCodeBlock(node, parent, index);
      }

      if (node.type === "element" && node.tagName === "blockquote") {
        enhanceMarkdownAlert(node);
      }

      if (isHeading(node) && typeof node.properties?.id === "string") {
        node.children.push({
          type: "element",
          tagName: "a",
          properties: {
            className: ["heading-anchor"],
            href: `#${node.properties.id}`,
            ariaHidden: "true",
            tabIndex: -1
          },
          children: [{ type: "text", value: "#" }]
        });
      }

      if (node.type !== "element" || node.tagName !== "p" || node.children?.length !== 1) {
        return;
      }

      const image = node.children[0];
      if (image.type !== "element" || image.tagName !== "img") return;
      const caption = image.properties?.title;
      if (typeof caption !== "string" || !caption.trim()) return;

      delete image.properties.title;
      node.tagName = "figure";
      node.properties = { className: ["image-figure"] };
      node.children = [
        image,
        {
          type: "element",
          tagName: "figcaption",
          properties: {},
          children: [{ type: "text", value: caption }]
        }
      ];
    });
  };
}

function isCodeBlock(node) {
  return node.type === "element"
    && node.tagName === "pre"
    && node.children?.some((child) => child.type === "element" && child.tagName === "code");
}

function wrapCodeBlock(codeBlock, parent, index) {
  if (!parent || index < 0) return;
  if (normalizeClassNames(parent.properties?.className).includes("code-block")) return;

  const code = codeBlock.children.find(
    (child) => child.type === "element" && child.tagName === "code"
  );
  const languageClass = normalizeClassNames(code?.properties?.className).find(
    (className) => className.startsWith("language-")
  );
  const language = codeBlock.properties?.dataLanguage ?? languageClass?.slice("language-".length);
  parent.children[index] = {
    type: "element",
    tagName: "div",
    properties: {
      className: ["code-block"],
      ...(typeof language === "string" ? { dataLanguage: language } : {})
    },
    children: [codeBlock]
  };
}

const alertTypes = new Set(["NOTE", "TIP", "IMPORTANT", "WARNING", "CAUTION"]);

function enhanceMarkdownAlert(blockquote) {
  const paragraphIndex = blockquote.children?.findIndex(
    (child) => child.type === "element" && child.tagName === "p"
  );
  if (paragraphIndex < 0) return;

  const paragraph = blockquote.children[paragraphIndex];
  const firstChild = paragraph.children?.[0];
  if (firstChild?.type !== "text") return;

  const marker = firstChild.value.match(/^\[!([A-Z]+)\](?:[ \t]*(?:\n|$))/i);
  const type = marker?.[1]?.toUpperCase();
  if (!type || !alertTypes.has(type)) return;

  firstChild.value = firstChild.value.slice(marker[0].length);
  if (!firstChild.value) paragraph.children.shift();
  if (paragraph.children[0]?.type === "element" && paragraph.children[0].tagName === "br") {
    paragraph.children.shift();
  }

  blockquote.properties = {
    ...blockquote.properties,
    className: [
      ...normalizeClassNames(blockquote.properties?.className),
      "markdown-alert",
      `markdown-alert-${type.toLowerCase()}`
    ]
  };

  const title = {
    type: "element",
    tagName: "p",
    properties: { className: ["markdown-alert-title"] },
    children: [{ type: "text", value: titleCase(type) }]
  };

  if (hasVisibleContent(paragraph)) {
    blockquote.children.splice(paragraphIndex, 0, title);
  } else {
    blockquote.children.splice(paragraphIndex, 1, title);
  }
}

function normalizeClassNames(className) {
  if (Array.isArray(className)) return className;
  return typeof className === "string" ? className.split(/\s+/).filter(Boolean) : [];
}

function hasVisibleContent(node) {
  return node.children?.some(
    (child) => child.type !== "text" || child.value.trim().length > 0
  );
}

function titleCase(value) {
  return value[0] + value.slice(1).toLowerCase();
}

function isHeading(node) {
  return node.type === "element" && /^h[1-6]$/.test(node.tagName);
}

function visit(node, callback, parent = null, index = -1) {
  callback(node, parent, index);
  if (!Array.isArray(node.children)) return;
  for (let childIndex = 0; childIndex < node.children.length; childIndex += 1) {
    visit(node.children[childIndex], callback, node, childIndex);
  }
}
