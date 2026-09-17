import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { AppPreview } from "./AppPreview";

describe("AppPreview", () => {
  it("mengumumkan diri sebagai satu gambar dengan keterangan yang berguna", () => {
    render(<AppPreview />);
    const preview = screen.getByRole("img");
    expect(preview).toHaveAttribute("aria-label", expect.stringContaining("XIX Vectorizer"));
  });

  // Bagian dalam jendela bersifat hiasan. Membacakannya kontrol demi kontrol
  // hanya akan jadi kebisingan, jadi seluruh isinya disembunyikan dari
  // teknologi bantu.
  it("menyembunyikan bagian dalam jendela dari teknologi bantu", () => {
    const { container } = render(<AppPreview />);
    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });

  it("menampilkan bagian-bagian utama jendela aplikasi", () => {
    const { container } = render(<AppPreview />);
    for (const part of [
      "pv-titlebar",
      "pv-lcd",
      "pv-status",
      "pv-seek",
      "pv-transport",
      "pv-playlist",
    ]) {
      expect(container.querySelector("." + part), part).toBeInTheDocument();
    }
    expect(container.querySelectorAll(".pv-track")).toHaveLength(5);
  });

  it("menyebut mesin V3 pada baris pengaturan", () => {
    const { container } = render(<AppPreview />);
    expect(container.querySelector(".pv-chip-wide").textContent).toContain("Vectorize V3");
  });
});

