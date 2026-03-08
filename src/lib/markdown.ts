export function renderMarkdown(input: string) {
  const escapeHtml = (val: string) =>
    val.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const lines = input.split("\n");
  const blocks: string[] = [];
  let listBuffer: string[] = [];

  const flushList = () => {
    if (listBuffer.length === 0) return;
    blocks.push(`<ul>${listBuffer.map((li) => `<li>${li}</li>`).join("")}</ul>`);
    listBuffer = [];
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flushList();
      continue;
    }
    if (line.startsWith("- ")) {
      listBuffer.push(escapeHtml(line.slice(2)));
      continue;
    }
    flushList();
    if (line.startsWith("### ")) {
      blocks.push(`<h3>${escapeHtml(line.slice(4))}</h3>`);
      continue;
    }
    if (line.startsWith("## ")) {
      blocks.push(`<h2>${escapeHtml(line.slice(3))}</h2>`);
      continue;
    }
    if (line.startsWith("# ")) {
      blocks.push(`<h1>${escapeHtml(line.slice(2))}</h1>`);
      continue;
    }
    blocks.push(`<p>${escapeHtml(line)}</p>`);
  }
  flushList();

  let html = blocks.join("\n");
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
  html = html.replace(/`(.+?)`/g, "<code>$1</code>");
  return html;
}
