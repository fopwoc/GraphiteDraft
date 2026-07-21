export function rehypeGraphiteDocument() {
  return function transform(tree) {
    visit(tree, (node) => {
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

function isHeading(node) {
  return node.type === "element" && /^h[1-6]$/.test(node.tagName);
}

function visit(node, callback) {
  callback(node);
  if (!Array.isArray(node.children)) return;
  for (const child of node.children) visit(child, callback);
}
