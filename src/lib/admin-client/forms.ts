import { getCsrfToken, readError } from "./helpers";
import type { BindCreateFormOptions, BindJsonFormOptions } from "./types";

export function bindCreateForm(options: BindCreateFormOptions): void {
  const form = document.querySelector<HTMLFormElement>(options.formSelector);
  if (!form) return;

  const csrfToken = options.csrfToken ?? getCsrfToken();
  const method = options.method ?? "POST";

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const response = await fetch(options.endpoint, {
      method,
      headers: { "X-CSRF-Token": csrfToken },
      body: data,
    });
    if (!response.ok) {
      alert(await readError(response));
      return;
    }
    if (options.onSuccess) {
      options.onSuccess();
      return;
    }
    location.reload();
  });
}

export function bindJsonForm(options: BindJsonFormOptions): void {
  const form = document.querySelector<HTMLFormElement>(options.formSelector);
  if (!form) return;

  const csrfToken = options.csrfToken ?? getCsrfToken();
  const method = options.method ?? "POST";

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const endpoint =
      typeof options.endpoint === "function"
        ? options.endpoint(form, data)
        : options.endpoint;
    const payload = options.mapPayload
      ? options.mapPayload(data, form)
      : Object.fromEntries(data.entries());

    const response = await fetch(endpoint, {
      method,
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
    if (options.onSuccess) {
      options.onSuccess();
      return;
    }
    location.reload();
  });
}
