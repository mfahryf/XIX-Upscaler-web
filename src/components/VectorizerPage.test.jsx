
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { VectorizerPage } from "./VectorizerPage";

vi.mock("./DemoPanel", () => ({
  DemoPanel: () => <div data-testid="demo-panel" />,
}));

describe("VectorizerPage", () => {
  it("menampilkan keenam bagian halaman", () => {
    render(<VectorizerPage />);
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(screen.getByTestId("demo-panel")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Dibuat untuk pekerjaan nyata/ })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Satu lisensi, tiga mesin/ })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Aplikasi desktop/ })).toBeInTheDocument();
    expect(screen.getByText(/Bantuan/)).toBeInTheDocument();
  });

  it("menampilkan harga dan kuota dari katalog", () => {
    render(<VectorizerPage />);
    expect(screen.getByText(/Rp99.000 \/ bulan/)).toBeInTheDocument();
    expect(screen.getByText(/5 berkas berhasil sebelum lisensi aktif/)).toBeInTheDocument();
    // Muncul dua kali dengan sengaja: sekali di daftar keuntungan lisensi,
    // sekali di syarat unduhan.
    expect(screen.getAllByText(/14 hari/)).toHaveLength(2);
  });

  it("tidak menawarkan tombol pembelian palsu saat tautan belum diisi", () => {
    render(<VectorizerPage />);
    expect(screen.getByRole("button", { name: /Tautan pembelian belum siap/ })).toBeDisabled();
    expect(screen.getByText(/Installer belum tersedia untuk diunduh/)).toBeInTheDocument();
  });

  it("tidak menampilkan atau menerima kode lisensi", () => {
    render(<VectorizerPage />);
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.queryByText(/license key/i)).not.toBeInTheDocument();
  });
});
