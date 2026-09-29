import { createHash } from "node:crypto";
import JavaScriptObfuscator from "javascript-obfuscator";

// Penyamaran dijalankan pada hasil build, bukan pada berkas di `src/`. Sumber
// tetap terbaca apa adanya; yang berubah hanya keluaran `dist/`.
//
// Hanya berkas mesin yang disamarkan, bukan seluruh bundel. Berkas itulah yang
// memuat logika pemrosesan gambar; menyamarkan sisanya berarti ikut menyamarkan
// kode React yang tidak ada nilainya untuk disembunyikan dan memperbesar berkas
// yang diunduh setiap pengunjung.
//
// `mangleProperties` sengaja tidak dipakai. Runtime WebAssembly memanggil balik
// ke JavaScript lewat nama properti berbentuk string, dan mengganti nama itu
// akan memutus panggilan tersebut dengan kegagalan yang tidak menunjuk ke sini.
//
// Angka di bawah datang dari pengukuran, bukan tebakan. Pada loop per-petak,
// melandaikan alur kontrol dengan ambang 0.5 menambah sekitar 1,3 detik untuk
// gambar 1200x800, sementara penggantian nama dan pengumpulan string praktis
// tidak menambah apa pun. Ambang 0.25 menahan biaya itu di sekitar sepertiganya
// sambil tetap menyamarkan alur kontrol di sebagian fungsi.
const OPTIONS = {
  compact: true,
  stringArray: true,
  stringArrayThreshold: 1,
  stringArrayEncoding: ["base64"],
  stringArrayRotate: true,
  stringArrayShuffle: true,
  stringArrayWrappersCount: 1,
  stringArrayWrappersType: "variable",
  identifierNamesGenerator: "hexadecimal",
  renameGlobals: false,
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.25,
  deadCodeInjection: false,
  selfDefending: false,
  debugProtection: false,
  disableConsoleOutput: false,
  unicodeEscapeSequence: false,
  sourceMap: false,
  target: "browser",
};

// Rujukan ke berkas mesin lain harus tetap berbentuk teks biasa. Kalau ikut masuk
// ke kumpulan string yang disandikan, nama berkas yang sudah berhash tidak lagi
// bisa ditemukan dan diganti saat penamaan ulang, sehingga halaman akan meminta
// berkas dengan nama lama dan gagal dimuat. Nama berkas mesin sendiri karena itu
// dikecualikan lewat `reservedStrings`, sementara string lain tetap disandikan.
function optionsFor(names) {
  return { ...OPTIONS, reservedStrings: names.map((name) => name + "-") };
}

const HASH_LENGTH = 8;
const HASH_PATTERN = new RegExp(`-[A-Za-z0-9_-]{${HASH_LENGTH}}$`);
const MAX_PASSES = 6;

function baseName(fileName) {
  return fileName.slice(fileName.lastIndexOf("/") + 1);
}

// Direktori keluaran, termasuk garis miring penutupnya. Nama baru harus tetap
// berada di direktori yang sama; aset hasil build diletakkan di bawah `assets/`,
// dan memindahkannya ke akar akan memutus rujukan dari halaman.
function directoryOf(fileName) {
  const slash = fileName.lastIndexOf("/");
  return slash === -1 ? "" : fileName.slice(0, slash + 1);
}

// Nama tanpa akhiran dan tanpa hash, sehingga nama baru tidak menumpuk hash.
function stem(fileName) {
  return baseName(fileName).replace(/\.js$/, "").replace(HASH_PATTERN, "");
}

function matches(fileName, names) {
  if (!fileName.endsWith(".js")) return false;
  const base = baseName(fileName);
  return names.some((name) => base === name || base.startsWith(name + "-"));
}

function textOf(output) {
  const source = output.type === "chunk" ? output.code : output.source;
  if (typeof source === "string") return source;
  if (source instanceof Uint8Array) return new TextDecoder().decode(source);
  return null;
}

function setText(output, text) {
  if (output.type === "chunk") output.code = text;
  else output.source = text;
}

function hashOf(text) {
  return createHash("sha256").update(text).digest("hex").slice(0, HASH_LENGTH);
}

function keyOf(bundle, output) {
  return Object.keys(bundle).find((candidate) => bundle[candidate] === output);
}

/// Menyamarkan chunk dan aset mesin yang namanya tercantum di `names`.
///
/// Seluruh pekerjaan dilakukan di `generateBundle`, bukan di `renderChunk`.
/// Alasannya ditemukan dari kegagalan nyata: nama berkas berhash dihitung dari
/// isi sebelum penyamaran, sehingga berkas yang isinya berubah tetap memakai
/// alamat lama — dan alamat berhash disimpan di cache pengunjung selama setahun,
/// jadi perubahan tidak akan pernah terlihat. Contohnya chunk yang merujuk
/// berkas mesin menanam hash versi lama pada rujukannya, sementara berkas mesin
/// yang benar-benar ditulis memakai hash baru, dan halaman meminta berkas yang
/// tidak ada.
///
/// Di sini nama diturunkan dari isi akhir, lalu setiap rujukan ke nama lama
/// ditulis ulang di seluruh keluaran. Menulis ulang mengubah isi berkas yang
/// merujuk, jadi berkas itu ikut dinamai, dan seterusnya sampai tidak ada lagi
/// yang berubah.
export function obfuscateEngine(names) {
  return {
    name: "xix-obfuscate-engine",
    apply: "build",
    enforce: "post",
    generateBundle(_options, bundle) {
      const changed = new Set();

      for (const output of Object.values(bundle)) {
        if (output.type !== "chunk" && output.type !== "asset") continue;
        if (!matches(output.fileName, names)) continue;
        const text = textOf(output);
        if (text === null) continue;
        setText(output, JavaScriptObfuscator.obfuscate(text, optionsFor(names)).getObfuscatedCode());
        changed.add(output);
      }

      if (changed.size === 0) return;

      for (let pass = 0; pass < MAX_PASSES && changed.size > 0; pass += 1) {
        const renamed = new Map();
        for (const output of changed) {
          if (!output.fileName.endsWith(".js")) continue;
          const text = textOf(output);
          if (text === null) continue;
          const next = `${directoryOf(output.fileName)}${stem(output.fileName)}-${hashOf(text)}.js`;
          if (next === output.fileName) continue;
          // Rujukan di dalam bundel tidak selalu memakai bentuk yang sama dengan
          // `fileName`: impor antar chunk ditulis relatif (`./nama-berkas.js`),
          // sedangkan rujukan ber-base memakai bentuk penuh. Keduanya dipetakan
          // supaya tidak ada yang tertinggal dan menunjuk berkas yang tak ada.
          renamed.set(output.fileName, next);
          renamed.set(baseName(output.fileName), baseName(next));
          const key = keyOf(bundle, output);
          if (key !== undefined) delete bundle[key];
          output.fileName = next;
          bundle[next] = output;
        }

        changed.clear();
        if (renamed.size === 0) break;

        for (const output of Object.values(bundle)) {
          const text = textOf(output);
          if (text === null) continue;
          let replaced = text;
          for (const [from, to] of renamed) replaced = replaced.split(from).join(to);
          if (replaced === text) continue;
          setText(output, replaced);
          changed.add(output);
        }

        // Daftar impor dipakai menyusun petunjuk pramuat di halaman, jadi
        // namanya harus ikut diperbarui meski isi berkasnya tidak berubah.
        for (const output of Object.values(bundle)) {
          if (output.type !== "chunk") continue;
          output.imports = (output.imports ?? []).map((name) => renamed.get(name) ?? name);
          output.dynamicImports = (output.dynamicImports ?? []).map((name) => renamed.get(name) ?? name);
        }
      }
    },
  };
}
