
import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { BeforeAfterSlider, DISPLAY_MAX_HEIGHT } from "./BeforeAfterSlider";

function renderSlider(props = {}) {
  return render(
    <BeforeAfterSlider
      beforeSrc="data:image/png;base64,AAAA"
      afterSrc="data:image/png;base64,BBBB"
      width={1000}
      height={1000}
      {...props}
    />
  );
}

describe("BeforeAfterSlider", () => {
  it("membatasi lebar tampilan dari batas tinggi pada gambar persegi", () => {
    const { container } = renderSlider();
    const wrapper = container.querySelector(".compare");
    expect(wrapper).toHaveStyle({ maxWidth: "min(100%, " + DISPLAY_MAX_HEIGHT + "px)" });
  });

  it("memberi ruang lebih lebar pada gambar mendatar tanpa melewati batas tinggi", () => {
    const { container } = renderSlider({ width: 2000, height: 500 });
    const wrapper = container.querySelector(".compare");
    // Bentuk 4:1 berarti lebar boleh sampai empat kali batas tinggi.
    expect(wrapper).toHaveStyle({ maxWidth: "min(100%, " + DISPLAY_MAX_HEIGHT * 4 + "px)" });
  });

  it("menjaga bentuk bingkai sesuai bentuk gambar", () => {
    renderSlider({ width: 1600, height: 900 });
    const frame = screen.getByRole("slider");
    expect(frame).toHaveStyle({ aspectRatio: 1600 / 900 });
  });

  it("dapat digeser dengan tombol panah", () => {
    renderSlider();
    const frame = screen.getByRole("slider");
    expect(frame).toHaveAttribute("aria-valuenow", "50");

    fireEvent.keyDown(frame, { key: "ArrowRight" });
    expect(frame).toHaveAttribute("aria-valuenow", "52");

    fireEvent.keyDown(frame, { key: "ArrowLeft", shiftKey: true });
    expect(frame).toHaveAttribute("aria-valuenow", "42");
  });

  it("batas geser berhenti di ujung", () => {
    renderSlider();
    const frame = screen.getByRole("slider");
    fireEvent.keyDown(frame, { key: "Home" });
    expect(frame).toHaveAttribute("aria-valuenow", "0");
    fireEvent.keyDown(frame, { key: "End" });
    expect(frame).toHaveAttribute("aria-valuenow", "100");
  });

  it("menampilkan label sebelum dan sesudah", () => {
    renderSlider();
    expect(screen.getByText("Original")).toBeInTheDocument();
    expect(screen.getByText("Vector")).toBeInTheDocument();
  });

  // Petunjuk menggeser digantikan ajakan mengunduh aplikasi desktop, dan
  // ajakannya menunjuk bagian unduhan di halaman. Aturan menggeser tetap
  // tersedia, tetapi pindah ke label pembaca layar pada bingkai pembanding,
  // sehingga pengguna pembaca layar tidak kehilangan caranya.
  it("mengajak mengunduh aplikasi desktop dengan tautan ke bagian unduhan", () => {
    renderSlider();
    const tautan = screen.getByRole("link", { name: "Download XIX Vectorizer Desktop" });
    expect(tautan).toHaveAttribute("href", "#download");
    expect(tautan.querySelector("strong")).not.toBeNull();

    const petunjuk = tautan.closest(".compare-hint");
    expect(petunjuk).not.toBeNull();
    expect(petunjuk.textContent).toMatch(/AI-powered, detail-preserving, and built for batch/);
    // Kalimat lama sudah tidak dipakai lagi.
    expect(petunjuk.textContent).not.toMatch(/arrow keys/);

    const label = screen.getByRole("slider").getAttribute("aria-label");
    expect(label).toMatch(/arrow keys/);
  });

  it("memakai ukuran huruf yang lebih besar daripada petunjuk lama", () => {
    const stylesheet = readFileSync("src/styles.css", "utf8");
    const aturan = stylesheet.match(/\.compare-hint\s*\{[^}]*\}/);
    expect(aturan, "aturan .compare-hint di styles.css").not.toBeNull();
    const ukuran = aturan[0].match(/font-size:\s*([\d.]+)rem/);
    expect(ukuran, "ukuran huruf .compare-hint").not.toBeNull();
    // Nilai sebelumnya 0,8 rem.
    expect(parseFloat(ukuran[1])).toBeGreaterThan(0.8);
  });
});
