export function getCsrfToken(): string {
  return document.querySelector("meta[name='csrf-token']")?.getAttribute("content") || "";
}

export function collectRowFields(row: Element): Record<string, string> {
  const fields: Record<string, string> = {};
  row.querySelectorAll("[data-field]").forEach((cell) => {
    const field = cell.getAttribute("data-field");
    if (!field) return;
    if (
      cell instanceof HTMLSelectElement ||
      cell instanceof HTMLInputElement ||
      cell instanceof HTMLTextAreaElement
    ) {
      fields[field] = String(cell.value);
      return;
    }
    fields[field] = String(cell.textContent?.trim() || "");
  });
  return fields;
}

export async function readError(response: Response): Promise<string> {
  const text = await response.text();
  return text || `Request gagal (${response.status})`;
}
