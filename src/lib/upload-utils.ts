export async function resizeImage(file: File): Promise<Blob> {
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
  const filesArray = Array.from(files);
  for (let index = 0; index < filesArray.length; index += 1) {
    onProgress?.(index, filesArray.length);
    const resized = await resizeImage(filesArray[index]);
    const formData = new FormData();
    formData.append("file", resized, filesArray[index].name);
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
      throw new Error("Invalid upload response");
    }
    urls.push(data.url);
  }
  onProgress?.(filesArray.length, filesArray.length);
  return urls;
}

export function parseUrls(value = ""): string[] {
  if (!value) return [];
  try {
    if (value.startsWith("[") && value.endsWith("]")) {
      return JSON.parse(value);
    }
  } catch (e) {
    // ignore
  }
  return value
    .split(",")
    .map((url) => url.trim())
    .filter(Boolean);
}
