
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { VectorizerPage } from "./VectorizerPage";
import { HERO_HIGHLIGHTS, PLAN_POINTS } from "../content/site";
import { getPlatformSession } from "../lib/platformAuth";

vi.mock("../lib/platformAuth", () => ({
  getPlatformSession: vi.fn().mockResolvedValue({ status: "anonymous" }),
  loginHref: (returnTo = "/") => `/auth/login?return_to=${encodeURIComponent(returnTo || "/")}`,
  logoutHref: () => "/auth/logout",
}));

beforeEach(() => {
  vi.mocked(getPlatformSession).mockImplementation(() => new Promise(() => {}));
});

vi.mock("./DemoPanel", () => ({
  DemoPanel: () => <div data-testid="demo-panel" />,
}));

describe("VectorizerPage", () => {
  // Section Why Vectorizer, lalu section Pricing, dihapus. Halaman kini memuat
  // empat bagian: hero, coba gratis, unduh, catatan kaki.
  it("menampilkan keempat bagian halaman", () => {
    render(<VectorizerPage />);
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(screen.getByTestId("demo-panel")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Desktop app and licence/ })
    ).toBeInTheDocument();
    expect(screen.getByText(/Support/)).toBeInTheDocument();
  });

  it("menampilkan tombol Sign in untuk pengunjung anonim", async () => {
    vi.mocked(getPlatformSession).mockResolvedValue({ status: "anonymous" });
    render(<VectorizerPage />);
    expect(await screen.findByRole("button", { name: "Sign in" })).toBeInTheDocument();
  });

  it("membuka modal login dari header", async () => {
    vi.mocked(getPlatformSession).mockResolvedValue({ status: "anonymous" });
    render(<VectorizerPage />);
    fireEvent.click(await screen.findByRole("button", { name: "Sign in" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Continue with Google/ })).toHaveAttribute(
      "href",
      expect.stringContaining("return_to=%2F")
    );
  });

  it("menampilkan harga dan kuota dari katalog", () => {
    render(<VectorizerPage />);
    expect(screen.getByText(/IDR 99,000 \/ month/)).toBeInTheDocument();
    expect(screen.getByText(/5 successful files before a licence is required/)).toBeInTheDocument();
    expect(screen.getByText(/Valid for 30 days/)).toBeInTheDocument();
    expect(screen.getByText(/Unlimited batch processing/)).toBeInTheDocument();

    // Keterangan masa pakai tanpa internet dihapus dari daftar keuntungan
    // lisensi, karena urusan aktivasi bukan alasan membeli dan penjelasannya
    // sudah ada di aplikasi. Uji ini menjaga agar kalimatnya tidak kembali
    // tanpa disadari.
    expect(screen.queryByText(/without internet/)).not.toBeInTheDocument();
    expect(screen.queryByText(/14 days/)).not.toBeInTheDocument();

    const daftar = document.querySelectorAll(".plan-points li");
    expect(daftar).toHaveLength(PLAN_POINTS.length);
  });

  it("menunjukkan tautan unduh yang mengikuti halaman release publik", () => {
    render(<VectorizerPage />);
    expect(screen.getByRole("button", { name: /Purchase link not configured/ })).toBeDisabled();
    expect(
      screen.getByRole("link", { name: /Download Windows installer/ })
    ).toHaveAttribute(
      "href",
      "https://github.com/mfahryf/XIX-Vectorizer-release/releases/latest/download/Vectorizer-latest-x64-setup.exe"
    );
  });

  it("tidak menampilkan atau menerima kode lisensi", () => {
    render(<VectorizerPage />);
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.queryByText(/license key/i)).not.toBeInTheDocument();
  });

  // Bagian harga berdiri sendiri dihapus, dan harga pindah ke kartu lisensi di
  // bagian unduhan. Karena itu tidak boleh ada satu pun tautan yang masih
  // menunjuk #pricing: tautan seperti itu akan menggulir ke tempat yang tidak
  // ada dan tidak melakukan apa pun saat diklik. Tautan yang wajib absen
  // terletak di tiga tempat, yaitu menu header, tombol di hero, dan catatan
  // kaki.
  it("tidak meninggalkan tautan ke bagian harga yang sudah dihapus", () => {
    const { container } = render(<VectorizerPage />);

    expect(container.querySelector("#pricing")).toBeNull();
    expect(container.querySelectorAll('a[href="#pricing"]')).toHaveLength(0);
    expect(screen.queryByRole("link", { name: /Pricing/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /See pricing/ })).not.toBeInTheDocument();

    // Menu header menyisakan dua tujuan, dan keduanya menunjuk bagian yang ada.
    const nav = screen.getByRole("navigation", { name: "Page navigation" });
    const tujuan = [...nav.querySelectorAll("a")].map((a) => a.getAttribute("href"));
    expect(tujuan).toEqual(["#try", "#download"]);
  });

  // Pengunjung yang sudah yakin ingin memasang aplikasinya tidak perlu
  // menggulir seluruh halaman untuk menemukan unduhannya. Tombolnya
  // diletakkan di sebelah tombol coba gratis, dan yang ditunjuk adalah bagian
  // unduhan, bukan berkas installer langsung, karena alamat installer diisi
  // dari konfigurasi dan bisa belum tersedia.
  it("menyediakan tombol unduh di sebelah tombol coba gratis", () => {
    const { container } = render(<VectorizerPage />);
    const aksi = container.querySelector(".hero-actions");
    expect(aksi, "elemen .hero-actions").not.toBeNull();

    const tautan = [...aksi.querySelectorAll("a")];
    expect(tautan).toHaveLength(2);

    // Coba gratis dulu, unduh di sebelah kanannya.
    expect(tautan[0]).toHaveTextContent("Try it free");
    expect(tautan[0]).toHaveAttribute("href", "#try");
    expect(tautan[0].className).toMatch(/button-primary/);

    expect(tautan[1]).toHaveTextContent("Download app");
    expect(tautan[1]).toHaveAttribute("href", "#download");
    // Gaya kedua, supaya hanya ada satu tombol utama di hero.
    expect(tautan[1].className).toMatch(/button-secondary/);
    expect(tautan[1].querySelector("svg"), "ikon pada tombol unduh").not.toBeNull();
  });

  // Bagian unduhan berisi dua kartu: satu menerangkan installer, satu
  // menerangkan lisensi. Harga dan tombol menuju checkout hanya boleh muncul di
  // kartu lisensi, supaya tidak ada dua tombol pembelian di satu halaman.
  it("memisahkan bagian unduhan menjadi kartu installer dan kartu lisensi", () => {
    const { container } = render(<VectorizerPage />);
    const download = container.querySelector("#download");
    expect(download, "bagian unduhan").not.toBeNull();

    const kartu = [...download.querySelectorAll(".download-card")];
    expect(kartu).toHaveLength(2);
    expect(kartu[0].querySelector(".section-label").textContent).toBe("Installer");
    expect(kartu[1].querySelector(".section-label").textContent).toBe("Licence");

    // Harga duduk di kartu lisensi, bukan di kartu installer.
    expect(kartu[0].querySelector(".plan-amount")).toBeNull();
    expect(kartu[1].querySelector(".plan-amount").textContent).toMatch(/IDR 99,000/);

    // Kedua kartu sama-sama memuat satu tombol di kakinya.
    expect(kartu[0].querySelectorAll(".button")).toHaveLength(1);
    expect(kartu[1].querySelectorAll(".button")).toHaveLength(1);
    expect(download.querySelector(".plan-points")).not.toBeNull();
    expect(download.querySelector(".download-points")).not.toBeNull();

    const stylesheet = readFileSync("src/styles.css", "utf8");
    const grid = stylesheet.match(/\.download-cards\s*\{[^}]*\}/);
    expect(grid, "aturan .download-cards di styles.css").not.toBeNull();
    expect(grid[0]).toMatch(/grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
  });

  // Jarak antar bagian diatur oleh satu kelas yang dipasang pada elemen yang
  // menampung seluruh bagian. Kelas itu pernah tertulis di stylesheet tetapi
  // tidak pernah dipakai di halaman, sehingga bagian-bagian saling menempel
  // tanpa ada yang menyadarinya: tidak ada yang rusak secara teknis, jadi tidak
  // ada uji lain yang menangkapnya. Uji ini menjaga sambungan itu.
  it("memasang kelas jarak antar bagian pada elemen yang menampungnya", () => {
    render(<VectorizerPage />);
    const main = screen.getByRole("main");
    expect(main).toHaveClass("page-main");

    const stylesheet = readFileSync("src/styles.css", "utf8");
    const rule = stylesheet.match(/\.page-main\s*\{[^}]*\}/);
    expect(rule, "aturan .page-main di styles.css").not.toBeNull();
    expect(rule[0]).toMatch(/gap:/);
  });

  // Jendela pratinjau berdiri di kolom kanan hero, menggantikan kartu hiasan
  // yang hanya memuat tiga garis dan satu kalimat. Bagian unduhan kembali
  // berisi tombol dan syarat saja, sehingga tidak ada dua bagian yang
  // menampilkan hal yang sama. Uji ini menjaga agar pratinjau tidak diam-diam
  // turun kembali ke bagian unduhan dan kartu hiasan lama tidak hidup lagi.
  it("menempatkan jendela pratinjau di hero dan membersihkan bagian unduhan", () => {
    const { container } = render(<VectorizerPage />);

    const hero = container.querySelector(".hero");
    expect(hero, "elemen .hero").not.toBeNull();
    expect(hero.querySelector(".app-preview"), "pratinjau di hero").not.toBeNull();

    const download = container.querySelector("#download");
    expect(download.querySelector(".app-preview"), "pratinjau di bagian unduhan").toBeNull();
    expect(container.querySelector(".hero-card"), "kartu hiasan lama").toBeNull();

    const stylesheet = readFileSync("src/styles.css", "utf8");
    const heroRule = stylesheet.match(/\.hero\s*\{[^}]*\}/);
    expect(heroRule, "aturan .hero di styles.css").not.toBeNull();
    expect(heroRule[0]).toMatch(/grid-template-columns:\s*minmax\(0,\s*1fr\)\s*auto/);
    expect(stylesheet).not.toMatch(/\.hero-card\s*\{/);

    // Dua sifat berikut diukur langsung di peramban pada 1440, 1280, 1024, dan
    // 900 px. Sebelum diperbaiki, judul jatuh 187 px di bawah ujung atas
    // pratinjau karena kedua kolom ditengahkan terhadap jendela setinggi 600 px,
    // dan jarak dari header mencapai 86 px karena padding atas bagian
    // ditambahkan pada padding atas pembungkus. Nilai di bawah ini yang
    // menghasilkan jarak 33-38 px dan selisih 0 px antara judul dan pratinjau.
    expect(heroRule[0]).toMatch(/align-items:\s*start/);

    const padding = heroRule[0].match(/padding:\s*clamp\(([^)]*)\)\s+0\s+clamp\(/);
    expect(padding, "padding atas hero").not.toBeNull();
    const padTopMax = parseFloat(padding[1].split(",").pop().trim());
    expect(padTopMax, "batas atas padding atas hero dalam rem").toBeLessThanOrEqual(1);
  });

  // Keunggulan aplikasi desktop dibaca sebelum pengunjung diminta menekan
  // tombol, jadi urutannya judul, daftar keunggulan, baru tombol. Uji ini
  // menjaga urutan itu dan menjaga isinya tetap berbahasa Inggris, karena
  // sisa halaman memakai bahasa Inggris dan daftar ini pernah menjadi daftar
  // tiga keterangan pendek yang isinya tumpang tindih dengan daftar baru.
  it("menampilkan keunggulan aplikasi di antara judul dan tombol", () => {
    const { container } = render(<VectorizerPage />);
    const copy = container.querySelector(".hero-copy");
    expect(copy, "elemen .hero-copy").not.toBeNull();

    const urutan = [...copy.children].map((el) => el.tagName + "." + el.className);
    const iJudul = urutan.findIndex((s) => s.startsWith("H1"));
    const iDaftar = urutan.findIndex((s) => s.includes("hero-highlights"));
    const iTombol = urutan.findIndex((s) => s.includes("hero-actions"));
    expect(iJudul, "judul hero").toBeGreaterThanOrEqual(0);
    expect(iDaftar, "daftar keunggulan").toBeGreaterThan(iJudul);
    expect(iTombol, "tombol di bawah daftar").toBeGreaterThan(iDaftar);

    const daftar = copy.querySelector(".hero-highlights");
    const butir = [...daftar.querySelectorAll("li")];
    expect(butir).toHaveLength(HERO_HIGHLIGHTS.length);
    expect(butir.map((li) => li.textContent)).toEqual([...HERO_HIGHLIGHTS]);

    // Sepuluh keunggulan yang diminta pemilik produk: tiga mesin, hasil AI,
    // artboard, ekspor, keluaran siap spesifikasi Adobe Stock, konkurensi,
    // mode Tor bawaan, padding otomatis, ukuran installer, dan tampilan.
    const teks = butir.map((li) => li.textContent).join(" | ");
    expect(teks).toMatch(/engines? — two AI-powered online, one fully local and offline/);
    expect(teks).toMatch(/clean, tidy artwork/);
    expect(teks).toMatch(/Artboard size/);
    expect(teks).toMatch(/SVG, AI, and DXF/);
    expect(teks).toMatch(/Adobe Stock spec/);
    expect(teks).toMatch(/several files at once/);
    expect(teks).toMatch(/Tor mode/);
    expect(teks).toMatch(/\+7% breathing room/);
    expect(teks).toMatch(/installer is about 7 MB/);
    expect(teks).toMatch(/Winamp-style shell, rebuilt with a modern glass finish/);

    // Daftar lama yang berisi tiga keterangan pendek sudah tidak dipakai.
    expect(container.querySelector(".hero-facts")).toBeNull();
  });

  // Jarak dari bagian unduhan ke catatan kaki harus seukuran jarak antar bagian,
  // bukan dua kali lipatnya. Sebelumnya jarak itu berasal dari margin atas
  // ditambah padding atas, sehingga pada layar lebar mencapai 144 px sementara
  // jarak antar bagian hanya 72 px, dan lubang itu terbaca sebagai bagian yang
  // hilang. Uji ini menjaga agar kedua angka itu tidak kembali terpisah.
  it("menjaga jarak catatan kaki seukuran jarak antar bagian", () => {
    const stylesheet = readFileSync("src/styles.css", "utf8");

    const main = stylesheet.match(/\.page-main\s*\{[^}]*\}/);
    expect(main, "aturan .page-main").not.toBeNull();
    const gapMax = parseFloat(main[0].match(/gap:\s*clamp\([^,]+,\s*[^,]+,\s*([\d.]+)rem\)/)[1]);
    expect(gapMax, "batas atas jarak antar bagian dalam rem").toBeGreaterThan(0);

    const footer = stylesheet.match(/\.app-footer\s*\{[^}]*\}/);
    expect(footer, "aturan .app-footer").not.toBeNull();
    const marginMax = parseFloat(
      footer[0].match(/margin:\s*clamp\([^,]+,\s*[^,]+,\s*([\d.]+)rem\)/)[1]
    );
    const padTop = parseFloat(footer[0].match(/padding:\s*([\d.]+)rem 0/)[1]);

    // Jarak mata pembaca adalah margin atas ditambah padding atas, dan jumlah
    // itu tidak boleh melebihi jarak antar bagian.
    expect(marginMax + padTop, "jarak ke isi catatan kaki dalam rem").toBeLessThanOrEqual(gapMax);

    // Pembungkus bagian tidak boleh menambah padding bawah sendiri. Padding itu
    // pernah terisi 48 px dan ikut terhitung, sehingga jaraknya membengkak
    // tanpa terlihat di aturan catatan kaki.
    const shell = stylesheet.match(/\.page-shell\s*\{[^}]*\}/);
    expect(shell, "aturan .page-shell").not.toBeNull();
    const pad = shell[0].match(/padding:\s*([^;]+);/);
    expect(pad, "padding .page-shell").not.toBeNull();
    const padBottom = pad[1].trim().split(/\s+/).pop();
    expect(padBottom, "padding bawah .page-shell").toBe("0");

    // Pada layar lebar tidak boleh ada padding atas tambahan yang mengembalikan
    // jarak jauh itu.
    const wide = stylesheet.match(/@media \(min-width: 1024px\) \{[\s\S]*?\n\}/);
    expect(wide, "blok media lebar").not.toBeNull();
    expect(wide[0]).not.toMatch(/\.app-footer\s*\{[^}]*padding-top/);
  });

  // Berkas XIX.svg berisi gambar hitam dengan latar bening, bukan bentuk
  // vektor yang dapat diwarnai. Di atas kerangka gelap halaman ini, logo hitam
  // nyaris tidak terlihat: diukur langsung di peramban, rata-rata kecerahannya
  // 27 dari 255 pada header dan 9 pada catatan kaki. Saringan di bawah
  // memutihkan setiap piksel yang tergambar tanpa menyentuh bagian beningnya.
  // Uji ini menjaga agar saringan itu tidak hilang pada salah satu tempat,
  // karena logo yang kembali hitam tidak memicu kegagalan lain di halaman dan
  // hanya akan disadari dengan melihatnya.
  it("memutihkan logo XIX di header dan catatan kaki", () => {
    const stylesheet = readFileSync("src/styles.css", "utf8");
    for (const kelas of ["app-brand-logo", "footer-brand-logo"]) {
      const aturan = stylesheet.match(new RegExp("\\." + kelas + "\\s*\\{[^}]*\\}"));
      expect(aturan, "aturan ." + kelas + " di styles.css").not.toBeNull();
      expect(aturan[0], "saringan pemutih pada ." + kelas).toMatch(
        /filter:\s*brightness\(0\)\s*invert\(1\)/
      );
    }

    // Berkas aslinya tidak disunting, karena favicon memakai berkas yang sama
    // dan di sana latarnya terang.
    const svg = readFileSync("public/XIX.svg", "utf8");
    expect(svg).toMatch(/base64,/);
    expect(svg).not.toMatch(/<rect[^>]*fill="#fff"/i);
  });
});
