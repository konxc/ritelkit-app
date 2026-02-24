import { bindCrudTable, getCsrfToken } from "./admin-client";

export function initCmsPageAdmin(): void {
  const form = document.querySelector<HTMLFormElement>("#cms-form");
  if (!form) return;

  const csrfToken = getCsrfToken();
  const clearButton = document.querySelector("#cms-clear");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const pageId = String(data.get("page_id") || "");
    const payload = {
      title: data.get("title"),
      slug: data.get("slug"),
      content_md: data.get("content_md"),
      is_active: data.get("is_active"),
    };
    const response = await fetch(
      pageId ? `/api/admin/cms-pages/${pageId}` : "/api/admin/cms-pages",
      {
        method: pageId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        body: JSON.stringify(payload),
      },
    );
    if (!response.ok) {
      alert(await response.text());
      return;
    }
    location.reload();
  });

  clearButton?.addEventListener("click", () => {
    (form.querySelector("input[name='page_id']") as HTMLInputElement).value = "";
    (form.querySelector("input[name='title']") as HTMLInputElement).value = "";
    (form.querySelector("input[name='slug']") as HTMLInputElement).value = "";
    (form.querySelector("textarea[name='content_md']") as HTMLTextAreaElement).value = "";
  });

  bindCrudTable({
    basePath: "/api/admin/cms-pages",
    deleteConfirm: "Hapus halaman ini?",
    extraActions: {
      edit: async ({ id, row }) => {
        const contentResponse = await fetch(`/api/admin/cms-pages/${id}`);
        if (!contentResponse.ok) {
          alert(await contentResponse.text());
          return;
        }
        const data = (await contentResponse.json()) as { content_md?: string };
        const content = form.querySelector(
          "textarea[name='content_md']",
        ) as HTMLTextAreaElement | null;
        const title = row.querySelector("[data-field='title']")?.textContent || "";
        const slug = row.querySelector("[data-field='slug']")?.textContent || "";
        const isActive =
          row.querySelector("[data-field='is_active']")?.textContent || "true";

        (form.querySelector("input[name='page_id']") as HTMLInputElement).value = id;
        (form.querySelector("input[name='title']") as HTMLInputElement).value = title.trim();
        (form.querySelector("input[name='slug']") as HTMLInputElement).value = slug.trim();
        const selectElement = form.querySelector(
          "select[name='is_active']",
        ) as HTMLSelectElement | null;
        if (selectElement) {
          selectElement.value = isActive.trim() || "true";
        }
        if (content) content.value = data.content_md || "";
      },
    },
    mapFields: (fields) => {
      const content = form.querySelector(
        "textarea[name='content_md']",
      ) as HTMLTextAreaElement | null;
      return {
        ...fields,
        content_md: content?.value || "",
      };
    },
  });
}
