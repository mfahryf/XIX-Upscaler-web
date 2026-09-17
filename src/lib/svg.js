
// Penyesuaian akhir pada SVG keluaran mesin, meniru langkah yang dilakukan
// aplikasi desktop supaya hasil halaman dan hasil aplikasi sama.

const VIEW_BOX = /viewBox\s*=\s*(["'])([^"']*)\1/i;
const WIDTH = /\swidth\s*=\s*(["'])([^"']*)\1/i;
const HEIGHT = /\sheight\s*=\s*(["'])([^"']*)\1/i;

export function readSize(svg) {
  const text = String(svg);
  const viewBox = text.match(VIEW_BOX);
  if (viewBox) {
    const parts = viewBox[2].trim().split(/[\s,]+/).map(Number);
    if (parts.length === 4 && parts.every((value) => Number.isFinite(value))) {
      return { width: parts[2], height: parts[3] };
    }
  }
  const width = Number.parseFloat(text.match(WIDTH)?.[2] ?? "");
  const height = Number.parseFloat(text.match(HEIGHT)?.[2] ?? "");
  if (Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0) {
    return { width, height };
  }
  return null;
}

// Mesin selalu menyertakan viewBox, tetapi berkas tanpa viewBox tetap
// diperbaiki supaya dapat diperbesar tanpa pecah.
export function ensureViewBox(svg) {
  const text = String(svg);
  if (VIEW_BOX.test(text)) return text;
  const width = Number.parseFloat(text.match(WIDTH)?.[2] ?? "");
  const height = Number.parseFloat(text.match(HEIGHT)?.[2] ?? "");
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return text;
  return text.replace(/<svg\b/i, '<svg viewBox="0 0 ' + width + " " + height + '"');
}

export function byteLength(text) {
  if (typeof TextEncoder === "function") return new TextEncoder().encode(String(text)).length;
  return String(text).length;
}

// Rasterisasi untuk tampilan. Hasil vektor dapat berisi ribuan potongan,
// sehingga digambar sekali ke kanvas lalu ditampilkan sebagai gambar.
// Resolusi memakai ukuran piksel, bukan satuan fisik, supaya tampil sama di
// semua perangkat.
export async function rasterize(svg, width, height) {
  const text = ensureViewBox(svg);
  const source = new Blob([text], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(source);
  try {
    const image = await new Promise((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("The vector result could not be displayed."));
      element.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(width));
    canvas.height = Math.max(1, Math.round(height));
    const context = canvas.getContext("2d");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/png");
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function downloadSvg(svg, filename) {
  const blob = new Blob([ensureViewBox(svg)], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function outputName(originalName) {
  const base = String(originalName || "image").replace(/\.[^.]+$/, "") || "image";
  return base + "-vectorizer.svg";
}
