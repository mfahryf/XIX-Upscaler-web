
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
});
