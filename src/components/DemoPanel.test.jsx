
import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { DemoPanel } from "./DemoPanel";
import { ImageInputError } from "../lib/image";

vi.mock("../lib/engineRunner", () => ({
  vectorize: vi.fn(),
}));

vi.mock("../lib/svg", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, rasterize: vi.fn(async () => "data:image/png;base64,AAAA") };
});

vi.mock("../lib/image", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    loadImage: vi.fn(),
    imageDataToDataUrl: vi.fn(() => "data:image/png;base64,BBBB"),
  };
});

const { vectorize } = await import("../lib/engineRunner");
const { loadImage } = await import("../lib/image");

const IMAGE = {
  data: new Uint8ClampedArray(4),
  width: 100,
  height: 50,
  downscaled: false,
  originalWidth: 100,
  originalHeight: 50,
};

function pickFile(container, name = "gambar.png") {
  const input = container.querySelector('input[type="file"]');
  const file = new File([new Uint8Array(2)], name, { type: "image/png" });
  fireEvent.change(input, { target: { files: [file] } });
  return file;
}

beforeEach(() => {
  vi.clearAllMocks();
  loadImage.mockResolvedValue(IMAGE);
  vectorize.mockResolvedValue({
    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 50"></svg>',
    stats: { bytes: 1200 },
    settings: { colors: 8 },
  });
});

describe("DemoPanel", () => {
  it("menampilkan kotak unggah pada keadaan awal", () => {
    render(<DemoPanel />);
    expect(screen.getByText(/Letakkan satu gambar di sini/)).toBeInTheDocument();
    expect(screen.getByText(/maksimal 5,0 MB/)).toBeInTheDocument();
  });

  it("memproses satu berkas lalu menampilkan pembanding dan keterangan hasil", async () => {
    const { container } = render(<DemoPanel />);
    pickFile(container, "logo.png");

    await waitFor(() => expect(screen.getByText("Simpan SVG")).toBeInTheDocument());

    expect(vectorize).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("slider")).toBeInTheDocument();
    expect(screen.getByText("Ukuran berkas")).toBeInTheDocument();
    expect(screen.getByText(/^1 KB$/)).toBeInTheDocument();
    expect(screen.getByText(/Warna/)).toBeInTheDocument();
    expect(screen.getByText(/ukuran aslinya/)).toBeInTheDocument();
  });

  it("menjelaskan saat gambar dikecilkan", async () => {
    loadImage.mockResolvedValue({
      data: new Uint8ClampedArray(4),
      width: 800,
      height: 500,
      downscaled: true,
      originalWidth: 4000,
      originalHeight: 2500,
    });
    const { container } = render(<DemoPanel />);
    pickFile(container);

    await waitFor(() => expect(screen.getByText("Simpan SVG")).toBeInTheDocument());
    expect(screen.getByText(/diproses pada 0,40 MP/)).toBeInTheDocument();
    expect(screen.getByText(/10,00 MP/)).toBeInTheDocument();
  });

  it("menampilkan pesan ketika berkas ditolak", async () => {
    loadImage.mockRejectedValue(
      new ImageInputError("file_too_large", "Berkas 6,0 MB melewati batas 5,0 MB.")
    );
    const { container } = render(<DemoPanel />);
    pickFile(container);

    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
    expect(screen.getByText(/melewati batas 5,0 MB/)).toBeInTheDocument();
    expect(screen.queryByText("Simpan SVG")).not.toBeInTheDocument();
  });

  it("dapat diulang setelah gagal", async () => {
    loadImage.mockRejectedValue(new ImageInputError("decode_failed", "Gambar tidak dapat dibaca."));
    const { container } = render(<DemoPanel />);
    pickFile(container);
    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());

    fireEvent.click(screen.getByText("Coba lagi"));
    expect(screen.getByText(/Letakkan satu gambar di sini/)).toBeInTheDocument();
  });

  it("menyebut tahap kemajuan dari mesin", async () => {
    vectorize.mockImplementation(async (_image, { onProgress }) => {
      onProgress?.({ stage: "Tracing boundaries", label: "Menelusuri garis", fraction: 0.55 });
      await new Promise((resolve) => setTimeout(resolve, 0));
      return {
        svg: '<svg viewBox="0 0 10 10"></svg>',
        stats: { bytes: 10 },
        settings: { colors: 3 },
      };
    });
    const { container } = render(<DemoPanel />);
    pickFile(container);

    await waitFor(() => expect(screen.getByText("Menelusuri garis")).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText("Simpan SVG")).toBeInTheDocument());
  });
});
