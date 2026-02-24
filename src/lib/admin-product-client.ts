export function parseUrls(value = ""): string[] {
  return value
    .split(",")
    .map((url) => url.trim())
    .filter(Boolean);
}

async function resizeImage(file: File): Promise<Blob> {
  const image = await createImageBitmap(file);
  const maxSize = 1200;
  const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
  const width = Math.round(image.width * scale);
  const height = Math.round(image.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return file;
  context.drawImage(image, 0, 0, width, height);
  return await new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob || file), "image/webp", 0.85);
  });
}

export async function uploadFiles(
  files: FileList | File[],
  csrfToken: string,
  onProgress?: (current: number, total: number) => void,
): Promise<string[]> {
  const urls: string[] = [];
  for (let index = 0; index < files.length; index += 1) {
    onProgress?.(index, files.length);
    const resized = await resizeImage(files[index]);
    const formData = new FormData();
    formData.append("file", resized, files[index].name);
    const response = await fetch("/api/admin/upload-image", {
      method: "POST",
      headers: { "X-CSRF-Token": csrfToken },
      body: formData,
    });
    if (!response.ok) {
      throw new Error(await response.text());
    }
    const data = (await response.json()) as { url?: string };
    if (!data.url) {
      throw new Error("Response upload tidak valid");
    }
    urls.push(data.url);
  }
  onProgress?.(files.length, files.length);
  return urls;
}

export function renderGallery(
  container: HTMLElement,
  urls: string[],
  onChange: (next: string[]) => void,
): void {
  container.innerHTML = "";
  container.setAttribute("data-has", urls.length ? "true" : "false");

  urls.forEach((url, index) => {
    const item = document.createElement("div");
    item.className = "thumb-item";
    item.draggable = true;
    item.dataset.index = String(index);

    const image = document.createElement("img");
    image.src = url;
    image.alt = "preview";

    const actions = document.createElement("div");
    actions.className = "thumb-actions";

    const leftButton = document.createElement("button");
    leftButton.type = "button";
    leftButton.textContent = "◀";
    leftButton.onclick = () => {
      if (index === 0) return;
      const next = [...urls];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      onChange(next);
    };

    const rightButton = document.createElement("button");
    rightButton.type = "button";
    rightButton.textContent = "▶";
    rightButton.onclick = () => {
      if (index === urls.length - 1) return;
      const next = [...urls];
      [next[index + 1], next[index]] = [next[index], next[index + 1]];
      onChange(next);
    };

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.textContent = "✕";
    deleteButton.onclick = () => {
      const next = urls.filter((_, i) => i !== index);
      onChange(next);
    };

    actions.appendChild(leftButton);
    actions.appendChild(rightButton);
    actions.appendChild(deleteButton);
    item.appendChild(image);
    item.appendChild(actions);
    container.appendChild(item);

    item.addEventListener("dragstart", (event) => {
      event.dataTransfer?.setData("text/plain", String(index));
    });
    item.addEventListener("dragover", (event) => event.preventDefault());
    item.addEventListener("drop", (event) => {
      event.preventDefault();
      const from = Number(event.dataTransfer?.getData("text/plain"));
      const to = index;
      if (Number.isNaN(from) || from === to) return;
      const next = [...urls];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      onChange(next);
    });
  });
}

export function attachDrop(
  element: HTMLElement | null,
  onFiles: (files: FileList) => Promise<void>,
): void {
  if (!element) return;
  element.addEventListener("dragover", (event) => {
    event.preventDefault();
    element.classList.add("dragging");
  });
  element.addEventListener("dragleave", () => element.classList.remove("dragging"));
  element.addEventListener("drop", async (event) => {
    event.preventDefault();
    element.classList.remove("dragging");
    const files = event.dataTransfer?.files;
    if (!files || !files.length) return;
    await onFiles(files);
  });
}
