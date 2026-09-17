
import { describe, expect, it } from "vitest";
import { byteLength, ensureViewBox, outputName, readSize } from "./svg";

describe("readSize", () => {
  it("membaca ukuran dari viewBox", () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 120" width="160" height="120"></svg>';
    expect(readSize(svg)).toEqual({ width: 160, height: 120 });
  });

  it("memakai atribut width dan height bila tidak ada viewBox", () => {
    expect(readSize('<svg width="758" height="713"></svg>')).toEqual({ width: 758, height: 713 });
  });

  it("mengembalikan null bila tidak ada ukuran", () => {
    expect(readSize("<svg></svg>")).toBeNull();
  });
});

describe("ensureViewBox", () => {
  it("tidak mengubah svg yang sudah punya viewBox", () => {
    const svg = '<svg viewBox="0 0 10 10"></svg>';
    expect(ensureViewBox(svg)).toBe(svg);
  });

  it("menambahkan viewBox dari width dan height", () => {
    expect(ensureViewBox('<svg width="20" height="10"></svg>')).toContain('viewBox="0 0 20 10"');
  });

  it("membiarkan svg tanpa ukuran apa adanya", () => {
    const svg = "<svg></svg>";
    expect(ensureViewBox(svg)).toBe(svg);
  });
});

describe("outputName", () => {
  it("mengganti ekstensi dengan penanda vektor", () => {
    expect(outputName("foto keren.PNG")).toBe("foto keren-vectorizer.svg");
  });

  it("memakai nama cadangan bila kosong", () => {
    expect(outputName("")).toBe("image-vectorizer.svg");
  });
});

describe("byteLength", () => {
  it("menghitung panjang berkas", () => {
    expect(byteLength("<svg></svg>")).toBe(11);
  });
});
