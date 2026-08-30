const copyCode = async (block: HTMLElement) => {
  const text = block.querySelector("code")?.textContent ?? block.textContent ?? "";
  let copied = false;

  if (window.isSecureContext && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      copied = true;
    } catch {
      // Fall through to the local-file-compatible copy method.
    }
  }

  if (!copied) {
    const field = document.createElement("textarea");
    field.value = text;
    field.readOnly = true;
    field.style.cssText = "position:fixed;opacity:0;pointer-events:none";
    document.body.append(field);
    field.select();
    const legacyCopy = Reflect.get(document, "execCommand");
    copied = legacyCopy.call(document, "copy");
    field.remove();
  }

  const statusTarget = block.parentElement?.classList.contains("code-block")
    ? block.parentElement
    : block;
  statusTarget.dataset.copyStatus = copied ? "Copied" : "Copy failed";
  window.setTimeout(() => delete statusTarget.dataset.copyStatus, 1200);
};

for (const block of document.querySelectorAll<HTMLElement>("pre.astro-code")) {
  block.tabIndex = 0;
  block.setAttribute("role", "button");
  const language = block.dataset.language;
  block.setAttribute("aria-label", `Copy${language ? ` ${language}` : ""} code block`);
  block.title = "Click to copy";
  block.addEventListener("click", () => copyCode(block));
  block.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    copyCode(block);
  });
}
