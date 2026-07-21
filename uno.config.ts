import { defineConfig, presetTypography, presetWind4 } from "unocss";
import { systemMonoFontStack, systemSansFontStack } from "./src/lib/fonts.mjs";

export default defineConfig({
  presets: [
    presetWind4({ dark: "media" }),
    presetTypography()
  ],
  preflights: [
    {
      getCSS: () => `
        :root {
          color-scheme: light dark;
          font-synthesis: none;
          --font-sans: ${systemSansFontStack};
          --font-mono: ${systemMonoFontStack};
          --graphite-link: #1d4ed8;
          --graphite-border: #d6d3d1;
          --graphite-soft-bg: #f5f5f4;
          --graphite-mark-bg: #fef08a;
          --graphite-diagram-bg: transparent;
          --graphite-diagram-fg: #27272a;
          --graphite-diagram-line: #71717a;
          --graphite-diagram-accent: #2563eb;
          --graphite-diagram-muted: #71717a;
          --graphite-diagram-surface: #f4f4f5;
          --graphite-diagram-border: #a1a1aa;
        }
        img, video, svg { max-width: 100%; height: auto; }
        body { font-kerning: normal; font-optical-sizing: auto; }
        ::selection { background: color-mix(in srgb, var(--graphite-link) 24%, transparent); }
        :focus-visible { outline: 2px solid var(--graphite-link); outline-offset: 3px; }
        code, pre, kbd, samp { font-variant-ligatures: none; }
        .prose { overflow-wrap: anywhere; }
        .prose :is(h1, h2, h3, h4) { text-wrap: balance; }
        .prose :is(p, li, figcaption) { text-wrap: pretty; }
        .prose :is(h1, h2, h3, h4, h5, h6) { scroll-margin-block-start: 2rem; }
        .prose a {
          text-decoration-thickness: .08em;
          text-underline-offset: .18em;
          text-decoration-skip-ink: auto;
        }
        .prose a:hover { color: var(--graphite-link); }
        .prose .heading-anchor {
          margin-inline-start: .35em;
          color: var(--graphite-link);
          opacity: 0;
          font-size: .72em;
          font-weight: 500;
          text-decoration: none;
        }
        .prose :is(h1, h2, h3, h4, h5, h6):hover .heading-anchor { opacity: .55; }
        .prose blockquote {
          border-inline-start-color: var(--graphite-link);
          border-radius: 0 .375rem .375rem 0;
          background: var(--graphite-soft-bg);
          padding-block: .25rem;
          padding-inline-end: 1rem;
        }
        .prose table {
          display: block;
          width: max-content;
          max-width: 100%;
          overflow-x: auto;
        }
        .prose th,
        .prose td { padding: .625rem .875rem; }
        .prose th { background: var(--graphite-soft-bg); }
        .prose details {
          margin-block: 1.5em;
          border: 1px solid var(--graphite-border);
          border-radius: .5rem;
          padding: .75rem 1rem;
        }
        .prose summary { cursor: pointer; font-weight: 600; }
        .prose details[open] summary { margin-block-end: .75rem; }
        .prose kbd {
          border: 1px solid var(--graphite-border);
          border-bottom-width: 2px;
          border-radius: .3rem;
          background: var(--graphite-soft-bg);
          padding: .08em .4em;
          font-family: var(--font-mono);
          font-size: .85em;
        }
        .prose mark {
          border-radius: .2em;
          background: var(--graphite-mark-bg);
          color: inherit;
          padding-inline: .15em;
        }
        .prose hr { border-color: var(--graphite-border); }
        .prose img { border-radius: .375rem; }
        .prose .image-figure { text-align: center; }
        .prose .image-figure img { margin-inline: auto; }
        .prose .image-figure figcaption {
          color: color-mix(in srgb, currentColor 70%, transparent);
          font-size: .875rem;
        }
        pre.astro-code { position: relative; cursor: copy; }
        pre.astro-code::after {
          content: attr(data-language);
          position: absolute;
          inset-block-start: .5rem;
          inset-inline-end: .5rem;
          padding: .125rem .375rem;
          border-radius: .25rem;
          color: var(--graphite-diagram-fg);
          background: var(--graphite-diagram-surface);
          font-family: var(--font-sans);
          font-size: .75rem;
          line-height: 1.25rem;
          pointer-events: none;
        }
        pre.astro-code[data-copy-status]::after { content: attr(data-copy-status); }
        .mermaid { overflow-x: auto; padding-block: 1rem; text-align: center; }
        @media (hover: none) {
          .prose .heading-anchor { opacity: .4; }
        }
        @media (prefers-color-scheme: dark) {
          :root {
            --graphite-link: #60a5fa;
            --graphite-border: #3f3f46;
            --graphite-soft-bg: #18181b;
            --graphite-mark-bg: #713f12;
            --graphite-diagram-fg: #e4e4e7;
            --graphite-diagram-line: #a1a1aa;
            --graphite-diagram-accent: #60a5fa;
            --graphite-diagram-muted: #a1a1aa;
            --graphite-diagram-surface: #27272a;
            --graphite-diagram-border: #71717a;
          }
          .astro-code, .astro-code span {
            color: var(--shiki-dark) !important;
            background-color: var(--shiki-dark-bg) !important;
            font-style: var(--shiki-dark-font-style) !important;
            font-weight: var(--shiki-dark-font-weight) !important;
            text-decoration: var(--shiki-dark-text-decoration) !important;
          }
        }
      `
    }
  ]
});
