"use client";

// Compresses/resizes an image file in the browser and returns a base64 data URL.
// Keeps payloads small enough to store directly in Postgres without needing
// external file storage.
export function fileToCompressedDataUrl(
  file: File,
  opts: { maxWidth?: number; maxHeight?: number; quality?: number } = {}
): Promise<string> {
  const { maxWidth = 900, maxHeight = 900, quality = 0.72 } = opts;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Gagal membaca fail"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Gagal memuat imej"));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas tidak disokong"));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

// Plain base64 data-URL read, no compression — used for non-image files
// (PDF) where canvas-based resizing doesn't apply.
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Gagal membaca fail"));
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });
}
