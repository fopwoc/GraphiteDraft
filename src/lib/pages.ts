import type { CollectionEntry } from "astro:content";

export type PageEntry = CollectionEntry<"pages">;

export function routeFromId(id: string): string {
  const withoutExtension = id.replace(/\.(md|mdx)$/i, "");
  if (withoutExtension.toLowerCase() === "404") return "404.html";
  const withoutIndex = withoutExtension.replace(/(^|\/)index$/i, "");
  return withoutIndex.replace(/^\/+|\/+$/g, "");
}

export function titleFor(page: PageEntry): string {
  if (page.data.title) return page.data.title;
  const route = routeFromId(page.id);
  const name = route.split("/").filter(Boolean).at(-1) || "Home";
  return name
    .replace(/[-_]+/g, " ")
    .replace(/\b\p{L}/gu, (letter) => letter.toUpperCase());
}
