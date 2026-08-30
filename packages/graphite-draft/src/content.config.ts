import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "zod";

const contentDirectory = process.env.GRAPHITE_CONTENT_DIR || "../../examples/content";

const pages = defineCollection({
  loader: glob({
    base: contentDirectory,
    pattern: "**/*.{md,mdx}"
  }),
  schema: z.looseObject({
    title: z.string().optional(),
    draft: z.boolean().optional()
  })
});

export const collections = { pages };
