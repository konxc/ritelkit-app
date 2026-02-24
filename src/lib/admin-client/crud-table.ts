import { collectRowFields, getCsrfToken, readError } from "./helpers";
import type { BindCrudTableOptions } from "./types";

export function bindCrudTable(options: BindCrudTableOptions): void {
  const csrfToken = options.csrfToken ?? getCsrfToken();
  const rowSelector = options.rowSelector ?? "tr[data-id]";
  const deleteConfirm = options.deleteConfirm ?? "Hapus data ini?";
  const reloadOnSave = options.reloadOnSave ?? false;
  const reloadOnDelete = options.reloadOnDelete ?? true;

  document.querySelectorAll(rowSelector).forEach((row) => {
    row.addEventListener("click", async (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const action = target.getAttribute("data-action");
      if (!action) return;

      const id = row.getAttribute("data-id");
      if (!id) return;

      const extraAction = options.extraActions?.[action];
      if (extraAction) {
        await extraAction({ action, id, row, target, csrfToken });
        return;
      }

      if (action === "delete") {
        if (!confirm(deleteConfirm)) return;
        const response = await fetch(`${options.basePath}/${id}`, {
          method: "DELETE",
          headers: { "X-CSRF-Token": csrfToken },
        });
        if (!response.ok) {
          alert(await readError(response));
          return;
        }
        if (reloadOnDelete) location.reload();
        return;
      }

      if (action === "save") {
        const rawFields = collectRowFields(row);
        let payload: Record<string, unknown>;
        try {
          payload = options.mapFields
            ? options.mapFields(rawFields, row)
            : rawFields;
        } catch (error) {
          alert(error instanceof Error ? error.message : "Data tidak valid");
          return;
        }
        const response = await fetch(`${options.basePath}/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": csrfToken,
          },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          alert(await readError(response));
          return;
        }
        if (reloadOnSave) location.reload();
      }
    });
  });
}
