---
title: Images, captions, and copied files
---

An image title becomes a visible caption:

![Markdown becomes a static website](../assets/diagram.svg "A local SVG with a caption")

Non-Markdown files retain their directory relationship and can be linked
directly:

- [Open a copied text file](../assets/example.txt)
- [Open untouched HTML](../raw.html)

Markdown can point to an arbitrary non-Markdown file:

[Open the small fake `.bin` file](../assets/sample.bin)

Graphite Draft copies the file unchanged and keeps the link valid. A plain
Markdown link does not force a download: the host's `Content-Type` header and
the browser decide whether clicking it downloads the file or opens it. Static
hosts commonly serve unknown `.bin` files as `application/octet-stream`, which
normally triggers a download.

[Back to examples](../index.md)
