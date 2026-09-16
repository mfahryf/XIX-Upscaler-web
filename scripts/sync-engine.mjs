
// Menyalin mesin vektor dari repo aplikasi desktop ke repo halaman ini.
//
// Sumber kebenaran ada di XIX-Vectorizer. Berkas di src/engine adalah salinan
// yang dihasilkan, bukan berkas yang dirawat tangan, supaya kedua sisi tidak
// menyimpang.
//
// Dua bentuk berkas ditangani berbeda:
//
// - worker.js disalin apa adanya. Isinya sudah mandiri dan hanya memakai
//   postMessage, sehingga dapat langsung dijalankan sebagai worker browser.
// - detect.js di sumber berbentuk CommonJS, sedangkan halaman ini ESM.
//   Salinannya dibungkus menjadi modul ESM agar dapat diimpor. Pembungkusan
//   dilakukan di sini supaya berkas sumber tidak perlu diubah.
//
// Runner Node milik aplikasi desktop tidak ikut, karena halaman bekerja dengan
// berkas yang dipilih pengunjung, bukan path berkas.
//
// Sidik jari disimpan untuk dua sisi, karena keduanya diperiksa di tempat yang
// berbeda:
//
// - sidik jari sumber diperiksa saat pengembangan, ketika repo XIX-Vectorizer
//   tersedia di sebelah repo ini;
// - sidik jari berkas hasil diperiksa saat build image, ketika repo sumber
//   tidak tersedia. Dengan begitu build tetap mandiri, dan berkas hasil yang
//   tercampur tanpa disengaja tetap terdeteksi.
//
// Mode:
//   (tanpa argumen)      salin ulang mesin dan perbarui sidik jari
//   --verify             periksa sidik jari sumber (butuh repo sumber)
//   --verify-generated   periksa sidik jari berkas hasil (tanpa repo sumber)

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..");
const lockPath = join(here, "engine.lock.json");
const destDir = join(repoRoot, "src", "engine");

const SOURCE_FILES = ["worker.js", "detect.js"];
const GENERATED_FILES = ["worker.js", "detect.js"];
const SOURCE_REF = "XIX-Vectorizer/src-tauri/pngtosvg-runtime";

const sha256 = (buffer) => createHash("sha256").update(buffer).digest("hex");
const mode = process.argv.includes("--verify-generated")
  ? "verify-generated"
  : process.argv.includes("--verify")
    ? "verify"
    : "sync";

const lock = existsSync(lockPath) ? JSON.parse(readFileSync(lockPath, "utf8")) : null;

// Membungkus modul CommonJS menjadi ESM tanpa mengubah berkas sumbernya.
function wrapCommonJs(sourceText, name) {
  return [
    "// Berkas ini dihasilkan oleh scripts/sync-engine.mjs. Jangan disunting.",
    "// Sumber: " + SOURCE_REF + "/" + name,
    "",
    "const cjs = { exports: {} };",
    "(function (module, exports) {",
    sourceText.replace(/\r\n/g, "\n").trimEnd(),
    "})(cjs, cjs.exports);",
    "",
    "export const detectImageType = cjs.exports.detectImageType;",
    "export default cjs.exports;",
    "",
  ].join("\n");
}

function generate(name, buffer) {
  if (name === "detect.js") return Buffer.from(wrapCommonJs(buffer.toString("utf8"), name), "utf8");
  return buffer;
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

function sourceDir() {
  const override = (process.env.XIX_VECTORIZER_ENGINE_DIR || "").trim();
  if (override) return resolve(override);
  return resolve(repoRoot, "..", "XIX-Vectorizer", "src-tauri", "pngtosvg-runtime");
}

// Memeriksa berkas hasil memakai sidik jari yang tercatat. Tidak memerlukan
// repo sumber, sehingga dapat dijalankan di dalam build image.
if (mode === "verify-generated") {
  if (!lock?.generated) fail("Belum ada sidik jari berkas hasil. Jalankan npm run engine:sync.");
  const problems = GENERATED_FILES.filter((name) => {
    const file = join(destDir, name);
    if (!existsSync(file)) return true;
    return sha256(readFileSync(file)) !== lock.generated[name];
  });
  if (problems.length) {
    fail(
      "Berkas mesin hasil tidak sesuai sidik jari: " + problems.join(", ") + "\n" +
        "Jalankan npm run engine:sync pada mesin yang memiliki repo XIX-Vectorizer."
    );
  }
  console.log("Berkas mesin hasil sesuai sidik jari yang tercatat.");
  process.exit(0);
}

const source = sourceDir();
if (!existsSync(source)) {
  fail(
    "Mesin tidak ditemukan di " + source + ".\n" +
      "Set XIX_VECTORIZER_ENGINE_DIR ke folder pngtosvg-runtime milik repositori " +
      "XIX-Vectorizer, atau letakkan kedua repositori bersebelahan."
  );
}

const sourceHashes = {};
const generated = {};
for (const name of SOURCE_FILES) {
  const from = join(source, name);
  if (!existsSync(from)) fail("Berkas mesin tidak ditemukan: " + from);
  const buffer = readFileSync(from);
  sourceHashes[name] = sha256(buffer);
  generated[name] = generate(name, buffer);
}

if (mode === "verify") {
  const problems = SOURCE_FILES.filter((name) => lock?.sourceHashes?.[name] !== sourceHashes[name]);
  if (problems.length) {
    fail(
      "Sidik jari mesin sumber berubah: " + problems.join(", ") + "\n" +
        "Jalankan npm run engine:sync, lalu periksa perubahan mesinnya sebelum ikut tersimpan."
    );
  }
  console.log("Mesin sumber sesuai sidik jari yang tercatat.");
  process.exit(0);
}

for (const name of SOURCE_FILES) {
  const before = lock?.sourceHashes?.[name];
  if (before && before !== sourceHashes[name]) {
    console.warn(
      "Perhatian: mesin " + name + " berubah (" + before.slice(0, 12) + " -> " + sourceHashes[name].slice(0, 12) + ")"
    );
  }
}

mkdirSync(destDir, { recursive: true });
const generatedHashes = {};
for (const name of GENERATED_FILES) {
  const buffer = generated[name];
  writeFileSync(join(destDir, name), buffer);
  generatedHashes[name] = sha256(buffer);
}

writeFileSync(
  lockPath,
  JSON.stringify(
    {
      note: "Sidik jari mesin. Dihasilkan oleh scripts/sync-engine.mjs.",
      sourceRepo: SOURCE_REF,
      sourceHashes,
      generated: generatedHashes,
    },
    null,
    2
  ) + "\n"
);

console.log("Mesin disalin ke src/engine: " + SOURCE_FILES.join(", "));
