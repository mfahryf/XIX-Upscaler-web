
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { VectorizerPage } from "./VectorizerPage";

vi.mock("./DemoPanel", () => ({
  DemoPanel: () => <div data-testid="demo-panel" />,
}));

describe("VectorizerPage", () => {
  it("menampilkan keenam bagian halaman", () => {
    render(<VectorizerPage />);
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(screen.getByTestId("demo-panel")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Built for real work/ })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /One licence, three engines/ })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Desktop app/ })).toBeInTheDocument();
    expect(screen.getByText(/Support/)).toBeInTheDocument();
  });

  it("menampilkan harga dan kuota dari katalog", () => {
    render(<VectorizerPage />);
    expect(screen.getByText(/IDR 99,000 \/ month/)).toBeInTheDocument();
    expect(screen.getByText(/5 successful files before a licence is required/)).toBeInTheDocument();
    // Muncul dua kali dengan sengaja: sekali di daftar keuntungan lisensi,
    // sekali di syarat unduhan.
    expect(screen.getAllByText(/14 days/)).toHaveLength(2);
  });

  it("tidak menawarkan tombol pembelian palsu saat tautan belum diisi", () => {
    render(<VectorizerPage />);
    expect(screen.getByRole("button", { name: /Purchase link not configured/ })).toBeDisabled();
    expect(screen.getByText(/installer is not available for download yet/)).toBeInTheDocument();
  });

  it("tidak menampilkan atau menerima kode lisensi", () => {
    render(<VectorizerPage />);
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.queryByText(/license key/i)).not.toBeInTheDocument();
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
});
