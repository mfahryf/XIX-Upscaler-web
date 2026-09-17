
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

  // Bagian unduhan menampilkan jendela aplikasi di samping teksnya, dan dua
  // aturan yang membuatnya terbaca sebagai satu baris: jendela serta teks mulai
  // dari garis atas yang sama, dan dua kolom itu baru ditumpuk di bawah lebar
  // tempat jendela selebar 300 px masih muat. Sebelumnya jendela ditengahkan
  // secara vertikal pada baris setinggi 600 px, sehingga teks unduhan jatuh
  // lebih dari 200 px di bawah judul bagiannya dan bagian itu terbaca sebagai
  // dua baris yang berjarak jauh.
  it("menyejajarkan jendela pratinjau dengan teks unduhan pada satu baris", () => {
    const { container } = render(<VectorizerPage />);
    const grid = container.querySelector(".download-grid");
    expect(grid, "elemen .download-grid").not.toBeNull();
    expect(grid.querySelector(".download-copy"), "teks unduhan").not.toBeNull();
    expect(grid.querySelector(".app-preview"), "jendela pratinjau").not.toBeNull();

    const stylesheet = readFileSync("src/styles.css", "utf8");
    const rule = stylesheet.match(/\.download-grid\s*\{[^}]*\}/);
    expect(rule, "aturan .download-grid di styles.css").not.toBeNull();
    expect(rule[0]).toMatch(/align-items:\s*start/);

    const wide = stylesheet.match(/@media\s*\(min-width:\s*768px\)\s*\{\s*\.download-grid/);
    expect(wide, "dua kolom sejak 768 px").not.toBeNull();
  });
});
