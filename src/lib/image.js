// Memuat berkas gambar menjadi RGBA yang siap diproses mesin.
//
// Dua batas yang berbeda dan keduanya perlu:
//
// - batas ukuran berkas melindungi dari berkas yang terlalu besar untuk
//   dibaca dengan nyaman;
// - batas piksel melindungi dari gambar yang membekukan peramban, karena
//   berkas JPEG 5 MB dapat mengembang menjadi belasan megapiksel saat dibuka.
//
// Gambar di atas batas piksel diperkecil, bukan ditolak. Pengecilan dilakukan
// saat gambar dibaca lewat resizeWidth/resizeHeight, sehingga tidak ada kanvas
// perantara berukuran penuh. Cara ini dipilih karena peramban dengan batas
// luas kanvas akan gagal senyap pada gambar besar: hasilnya kosong tanpa pesan
// kesalahan yang jelas.

export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const MAX_PIXELS = 2_000_000;
export const HARD_MAX_PIXELS = 40_000_000;
export const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"];

export class ImageInputError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "ImageInputError";
    this.code = code;
  }
}

export function formatMegapixels(pixels) {
  return (pixels / 1_000_000).toFixed(2).replace(".", ",") + " MP";
}

export function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 KB";
  if (bytes < 1024 * 1024) return Math.max(1, Math.round(bytes / 1024)) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1).replace(".", ",") + " MB";
}

// Diperiksa sebelum gambar dibuka, supaya berkas yang jelas tidak sesuai
// tidak memakan waktu decode.
export function checkFile(file) {
  if (!file) {
    throw new ImageInputError("empty", "Belum ada berkas yang dipilih.");
  }
  const type = (file.type || "").toLowerCase();
  if (type && !ACCEPTED_TYPES.includes(type)) {
    throw new ImageInputError(
      "unsupported_type",
      "Format " + type + " belum didukung. Gunakan PNG, JPG, atau WebP."
    );
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new ImageInputError(
      "file_too_large",
      "Berkas " +
        formatBytes(file.size) +
        " melewati batas " +
        formatBytes(MAX_FILE_BYTES) +
        ". Pilih berkas yang lebih kecil."
    );
  }
}

function createCanvas(width, height) {
  if (typeof OffscreenCanvas === "function") {
    return new OffscreenCanvas(width, height);
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

// Gambar di atas batas diperkecil proporsional sampai luasnya masuk batas.
export function targetSize(width, height, maxPixels = MAX_PIXELS) {
  const pixels = width * height;
  if (!Number.isFinite(pixels) || pixels <= 0) {
    throw new ImageInputError("decode_failed", "Ukuran gambar tidak terbaca.");
  }
  if (pixels > HARD_MAX_PIXELS) {
    throw new ImageInputError(
      "too_many_pixels",
      "Gambar " +
        formatMegapixels(pixels) +
        " melewati batas keras " +
        formatMegapixels(HARD_MAX_PIXELS) +
        "."
    );
  }
  if (pixels <= maxPixels) {
    return { width, height, downscaled: false, pixels };
  }
  const scale = Math.sqrt(maxPixels / pixels);
  let scaledWidth = Math.max(1, Math.round(width * scale));
  let scaledHeight = Math.max(1, Math.round(height * scale));
  // Pembulatan dapat melewati batas sedikit. Kurangi satu piksel pada sisi
  // yang lebih panjang sampai benar-benar masuk, supaya batasnya benar-benar
  // dipegang dan bukan hanya mendekati.
  while (scaledWidth * scaledHeight > maxPixels && scaledWidth > 1 && scaledHeight > 1) {
    if (scaledWidth >= scaledHeight) scaledWidth -= 1;
    else scaledHeight -= 1;
  }
  return {
    width: scaledWidth,
    height: scaledHeight,
    downscaled: true,
    pixels: width * height,
  };
}

async function decode(file, target) {
  if (typeof createImageBitmap === "function") {
    const base = { imageOrientation: "from-image" };
    try {
      if (!target) return await createImageBitmap(file, base);
      return await createImageBitmap(file, {
        ...base,
        resizeWidth: target.width,
        resizeHeight: target.height,
        resizeQuality: "high",
      });
    } catch (error) {
      // Opsi kedua tidak dikenal, atau pengecilan saat decode tidak didukung.
      if (target) return decodeFullThenScale(file, target);
      throw new ImageInputError("decode_failed", "Gambar tidak dapat dibaca.");
    }
  }
  return decodeFullThenScale(file, target);
}

async function decodeFullThenScale(file, target) {
  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () =>
        reject(new ImageInputError("decode_failed", "Gambar tidak dapat dibaca."));
      element.src = url;
    });
    const natural = { width: image.naturalWidth, height: image.naturalHeight };
    if (!target) return image;
    const canvas = createCanvas(target.width, target.height);
    const context = canvas.getContext("2d");
    context.drawImage(image, 0, 0, target.width, target.height);
    return canvas;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function toImageData(decoded, target) {
  if (decoded instanceof ImageData) return decoded;
  if (decoded instanceof HTMLImageElement) {
    const canvas = createCanvas(decoded.naturalWidth, decoded.naturalHeight);
    const context = canvas.getContext("2d");
    context.drawImage(decoded, 0, 0);
    return context.getImageData(0, 0, canvas.width, canvas.height);
  }
  if (typeof OffscreenCanvas === "function" && decoded instanceof OffscreenCanvas) {
    return decoded.getContext("2d").getImageData(0, 0, decoded.width, decoded.height);
  }
  const canvas = createCanvas(target.width, target.height);
  const context = canvas.getContext("2d");
  context.drawImage(decoded, 0, 0, target.width, target.height);
  if (typeof decoded.close === "function") decoded.close();
  return context.getImageData(0, 0, target.width, target.height);
}

// Mengembalikan data RGBA beserta keterangan apakah gambar dikecilkan.
export async function loadImage(file, maxPixels = MAX_PIXELS) {
  checkFile(file);
  const bitmap = await decode(file, null);
  const natural = { width: bitmap.width, height: bitmap.height };
  const size = targetSize(natural.width, natural.height, maxPixels);
  let decoded = bitmap;
  if (size.downscaled) {
    if (typeof bitmap.close === "function") bitmap.close();
    decoded = await decode(file, size);
  }
  const image = toImageData(decoded, size);
  if (!image || !image.width || !image.height) {
    throw new ImageInputError("decode_failed", "Gambar tidak dapat dibaca.");
  }
  if (typeof decoded.close === "function") decoded.close();
  return {
    data: new Uint8ClampedArray(image.data),
    width: image.width,
    height: image.height,
    downscaled: size.downscaled || image.width !== natural.width,
    originalWidth: natural.width,
    originalHeight: natural.height,
  };
}

// Menyiapkan gambar sumber untuk lapisan "sebelum" pada pembanding. Yang
// ditampilkan adalah piksel yang benar-benar diproses mesin, bukan berkas
// mentah, supaya pembanding jujur ketika gambar dikecilkan.
export function imageDataToDataUrl(image, maxWidth = 1400) {
  const scale = image.width > maxWidth ? maxWidth / image.width : 1;
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const source = createCanvas(image.width, image.height);
  const sourceContext = source.getContext("2d");
  sourceContext.putImageData(new ImageData(image.data, image.width, image.height), 0, 0);
  const target = createCanvas(width, height);
  const targetContext = target.getContext("2d");
  targetContext.fillStyle = "#ffffff";
  targetContext.fillRect(0, 0, width, height);
  targetContext.drawImage(source, 0, 0, width, height);
  return target.toDataURL("image/png");
}
