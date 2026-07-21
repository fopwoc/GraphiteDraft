import { defineConfig, presetTypography, presetWind4 } from "unocss";
import { systemMonoFontStack, systemSansFontStack } from "./src/lib/fonts.mjs";

export default defineConfig({
  presets: [
    presetWind4({ dark: "media" }),
    presetTypography({
      cssExtend: {
        blockquote: {
          color: "inherit",
          "font-style": "normal",
          "font-weight": "400",
          quotes: "none"
        },
        "blockquote p:first-of-type::before": { content: "none" },
        "blockquote p:last-of-type::after": { content: "none" },
        code: {
          "border-radius": ".3em",
          background: "var(--graphite-inline-code-bg)",
          padding: ".12em .35em",
          "font-weight": "500"
        },
        "code::before": { content: "none" },
        "code::after": { content: "none" }
      }
    })
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
          --graphite-inline-code-bg: #e7e5e4;
          --graphite-mark-bg: #fef08a;
          --graphite-note: #2563eb;
          --graphite-tip: #15803d;
          --graphite-important: #7c3aed;
          --graphite-warning: #b45309;
          --graphite-caution: #dc2626;
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
          border: 1px solid var(--graphite-border);
          border-inline-start: .25rem solid var(--graphite-link);
          border-radius: .625rem;
          background: color-mix(in srgb, var(--graphite-soft-bg) 88%, transparent);
          box-shadow: 0 1px 2px color-mix(in srgb, currentColor 7%, transparent);
          padding: .75rem 1rem;
        }
        .prose blockquote > :first-child { margin-block-start: 0; }
        .prose blockquote > :last-child { margin-block-end: 0; }
        .prose .markdown-alert { --graphite-alert: var(--graphite-note); }
        .prose .markdown-alert-note { --graphite-alert: var(--graphite-note); }
        .prose .markdown-alert-tip { --graphite-alert: var(--graphite-tip); }
        .prose .markdown-alert-important { --graphite-alert: var(--graphite-important); }
        .prose .markdown-alert-warning { --graphite-alert: var(--graphite-warning); }
        .prose .markdown-alert-caution { --graphite-alert: var(--graphite-caution); }
        .prose .markdown-alert {
          border-inline-start-color: var(--graphite-alert);
          background: color-mix(in srgb, var(--graphite-alert) 8%, var(--graphite-soft-bg));
        }
        .prose .markdown-alert-title {
          display: flex;
          align-items: center;
          gap: .5rem;
          color: var(--graphite-alert);
          font-size: .875rem;
          font-weight: 700;
          letter-spacing: .025em;
        }
        .prose .markdown-alert-title::before {
          width: .55rem;
          height: .55rem;
          flex: none;
          border-radius: 999px;
          background: currentColor;
          box-shadow: 0 0 0 .2rem color-mix(in srgb, currentColor 16%, transparent);
          content: "";
        }
        .prose li.task-list-item {
          list-style: none;
        }
        .prose li.task-list-item::marker { content: ""; }
        .prose li.task-list-item > input[type="checkbox"]:first-child {
          width: 1rem;
          height: 1rem;
          margin: 0 .6rem 0 -1.45rem;
          vertical-align: -.14em;
          accent-color: var(--graphite-link);
          opacity: 1;
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
        .astro-code,
        .astro-code span {
          color: var(--shiki-light) !important;
          background-color: var(--shiki-light-bg) !important;
          font-style: var(--shiki-light-font-style) !important;
          font-weight: var(--shiki-light-font-weight) !important;
          text-decoration: var(--shiki-light-text-decoration) !important;
        }
        .prose .code-block {
          position: relative;
          margin-block: 1.7142857em;
        }
        .prose .code-block pre.astro-code { margin-block: 0; }
        pre.astro-code { cursor: copy; }
        .code-block::after {
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
        .code-block[data-copy-status]::after { content: attr(data-copy-status); }
        .mermaid-diagram {
          overflow-x: auto;
          margin-block: 1.5rem;
          padding-block: 1rem;
        }
        .mermaid-diagram svg {
          display: block;
          height: auto;
          margin-inline: auto;
        }
        .mermaid-theme-dark { display: none; }
        @media (hover: none) {
          .prose .heading-anchor { opacity: .4; }
        }
        @media (prefers-color-scheme: dark) {
          .mermaid-theme-light { display: none; }
          .mermaid-theme-dark { display: block; }
          :root {
            --graphite-link: #60a5fa;
            --graphite-border: #3f3f46;
            --graphite-soft-bg: #18181b;
            --graphite-inline-code-bg: #27272a;
            --graphite-mark-bg: #713f12;
            --graphite-note: #60a5fa;
            --graphite-tip: #4ade80;
            --graphite-important: #a78bfa;
            --graphite-warning: #fbbf24;
            --graphite-caution: #f87171;
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
