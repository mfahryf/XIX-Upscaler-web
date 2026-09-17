import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { AppPreview } from "./AppPreview";

describe("AppPreview", () => {
  it("mengumumkan diri sebagai satu gambar dengan keterangan yang berguna", () => {
    render(<AppPreview />);
    const preview = screen.getByRole("img");
    expect(preview).toHaveAttribute("aria-label", expect.stringContaining("XIX Vectorizer"));
    expect(preview).toHaveAttribute("aria-label", expect.stringContaining("three engines"));
  });

  // Bagian dalam jendela bersifat hiasan. Membacakannya kontrol demi kontrol
  // hanya akan jadi kebisingan, jadi seluruh isinya disembunyikan dari
  // teknologi bantu.
  it("menyembunyikan bagian dalam jendela dari teknologi bantu", () => {
    const { container } = render(<AppPreview />);
    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });

  // Urutan bagian mengikuti tata letak aplikasi: titlebar, display, marquee,
  // baris pengaturan, progress bar, transport, panel lanjutan, lalu playlist.
  it("menampilkan bagian-bagian utama jendela aplikasi", () => {
    const { container } = render(<AppPreview />);
    for (const part of [
      "pv-titlebar",
      "pv-lcd",
      "pv-marquee-wrap",
      "pv-cfg-row",
      "pv-seek-wrap",
      "pv-transport",
      "pv-adv",
      "pv-playlist",
    ]) {
      expect(container.querySelector("." + part), part).toBeInTheDocument();
    }
  });

  // Daftar engine dibuka supaya pengunjung tahu aplikasi desktop punya tiga
  // mesin, dengan V3 sebagai yang sedang dipakai.
  it("menampilkan daftar tiga engine dengan V3 terpilih", () => {
    const { container } = render(<AppPreview />);
    const options = [...container.querySelectorAll(".pv-dd-opt")];
    expect(options).toHaveLength(3);
    expect(options.map((el) => el.textContent)).toEqual([
      expect.stringContaining("Vectorize V1"),
      expect.stringContaining("Vectorize V2"),
      expect.stringContaining("Vectorize V3"),
    ]);
    expect(options[0]).not.toHaveClass("pv-dd-selected");
    expect(options[1]).not.toHaveClass("pv-dd-selected");
    expect(options[2]).toHaveClass("pv-dd-selected");
  });

  // Baris playlist meniru aplikasi: nomor dua digit, penanda status, nama
  // berkas, lalu hasilnya (OK / persen / ukuran berkas).
  it("menuliskan baris playlist dengan urutan dan penanda milik aplikasi", () => {
    const { container } = render(<AppPreview />);
    const rows = container.querySelectorAll(".pv-track");
    expect(rows).toHaveLength(12);

    const first = rows[0];
    expect(first.querySelector(".pv-track-num").textContent).toBe("01");
    expect(first.querySelector(".pv-track-state").textContent).toBe("\u2714");
    expect(first.querySelector(".pv-track-len").textContent).toBe("OK");
    expect(first).toHaveAttribute("data-state", "done");

    expect(rows[9].querySelector(".pv-track-state").textContent).toBe("\u23f3");
    expect(rows[9].querySelector(".pv-track-len").textContent).toBe("47%");
    expect(rows[10].querySelector(".pv-track-len").textContent).toBe("128.4 KB");
  });

  // Semua berkas pada pratinjau berhasil, jadi tidak ada baris bertanda gagal.
  it("tidak menampilkan baris yang gagal", () => {
    const { container } = render(<AppPreview />);
    expect(container.querySelector('[data-state="fail"]')).toBeNull();
    for (const state of container.querySelectorAll(".pv-track-state")) {
      expect(state.textContent).not.toBe("\u2718");
    }
  });

  it("menyebut mesin V3 pada baris pengaturan", () => {
    const { container } = render(<AppPreview />);
    const labels = [...container.querySelectorAll(".pv-dd-label")].map((el) => el.textContent);
    expect(labels[0]).toContain("Vectorize V3");
    expect(labels[1]).toBe("Full-bleed");
  });

  // Aplikasi meredupkan kontrol yang tidak bisa dipakai selama proses berjalan,
  // tetapi tombol start / pause / stop tetap terang.
  it("meredupkan kontrol yang terkunci saat proses berjalan", () => {
    const { container } = render(<AppPreview />);
    expect(container.querySelector(".pv-app")).toHaveAttribute("data-run", "1");

    // Tombol start / pause / stop tetap aktif selama proses berjalan...
    const transport = container.querySelectorAll(".pv-transport .pv-tbtn");
    expect(transport).toHaveLength(5);
    for (const index of [0, 1, 2]) {
      expect(transport[index]).not.toHaveClass("pv-locked");
    }

    // ...sedangkan pemilih berkas, ADV, settings, lisensi, dan toolbar
    // playlist ikut diredupkan.
    expect(transport[3]).toHaveClass("pv-locked");
    expect(transport[4]).toHaveClass("pv-locked");
    for (const toggle of container.querySelectorAll(".pv-tgbtn")) {
      expect(toggle).toHaveClass("pv-locked");
    }
    for (const button of container.querySelectorAll(".pv-pl-btn")) {
      expect(button).toHaveClass("pv-locked");
    }
  });
});
