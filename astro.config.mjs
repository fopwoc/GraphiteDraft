import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import { rehypeHeadingIds, unified } from "@astrojs/markdown-remark";
import UnoCSS from "unocss/astro";
import { remarkGraphiteLinks } from "./src/lib/remark-graphite-links.mjs";
import { remarkGraphiteMermaid } from "./src/lib/remark-graphite-mermaid.mjs";
import { rehypeGraphiteDocument } from "./src/lib/rehype-graphite-document.mjs";

export default defineConfig({
  site: process.env.SITE_URL || "http://localhost:4321",
  base: "/",
  cacheDir: process.env.GRAPHITE_CACHE_DIR || "./node_modules/.astro",
  outDir: process.env.GRAPHITE_BUILD_DIR || "./dist",
  output: "static",
  trailingSlash: "always",
  vite: {
    build: {
      assetsInlineLimit: 0
    }
  },
  integrations: [UnoCSS(), mdx()],
  markdown: {
    shikiConfig: {
      themes: {
        light: "github-light",
        dark: "github-dark"
      },
      defaultColor: false
    },
    processor: unified({
      gfm: true,
      remarkPlugins: [
        [remarkGraphiteLinks, {
          contentDirectory: process.env.GRAPHITE_CONTENT_DIR || "./examples/content"
        }],
        [remarkGraphiteMermaid, {
          enableExternalFonts: process.env.GRAPHITE_ENABLE_EXTERNAL_FONTS === "true"
        }]
      ],
      rehypePlugins: [rehypeHeadingIds, rehypeGraphiteDocument]
    })
  }
});
