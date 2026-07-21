---
title: Getting started
---

Put `.md` or `.mdx` files anywhere inside the external content directory, then run the builder:

```sh
bun install
bun run build
```

The generated website is written to `dist/`.

![A small Graphite Draft test image](diagram.svg "Markdown becomes a static website")

[Open a bare attachment path](example.txt), see the [bare MDX link](mdx-example.mdx),
the [explicit MDX link](./mdx-example.mdx), or a
[bare MDX link with a fragment](mdx-example.mdx#custom-markup).

[Back home](../index.md)
