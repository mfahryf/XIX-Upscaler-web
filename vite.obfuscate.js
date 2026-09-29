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

// Nama dasar berkas hasil build, tanpa hash dan tanpa direktori. Vite menambahkan
// hash delapan karakter pada chunk, sementara aset yang disalin apa adanya bisa
// tidak berhash sama sekali.
function baseName(fileName) {
  const withoutDirectory = fileName.slice(fileName.lastIndexOf("/") + 1);
  return withoutDirectory.replace(/\.js$/, "");
}

function isTarget(fileName, names) {
  if (!fileName.endsWith(".js")) return false;
  const base = baseName(fileName);
  return names.some((name) => base === name || base.startsWith(name + "-"));
}

/// Menyamarkan chunk dan aset mesin yang namanya tercantum di `names`.
export function obfuscateEngine(names) {
  return {
    name: "xix-obfuscate-engine",
    apply: "build",
    enforce: "post",
    generateBundle(_options, bundle) {
      for (const output of Object.values(bundle)) {
        if (output.type !== "chunk" && output.type !== "asset") continue;
        if (!isTarget(output.fileName, names)) continue;

        const source = output.type === "chunk" ? output.code : output.source;
        const text = typeof source === "string" ? source : new TextDecoder().decode(source);
        const obfuscated = JavaScriptObfuscator.obfuscate(text, OPTIONS).getObfuscatedCode();
        if (output.type === "chunk") output.code = obfuscated;
        else output.source = obfuscated;
      }
    },
  };
}
