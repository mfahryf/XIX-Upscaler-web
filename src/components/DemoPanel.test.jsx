
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
const { loadImage, imageDataToDataUrl } = await import("../lib/image");
const { rasterize } = await import("../lib/svg");

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
    expect(screen.getByText(/Drop one image here/)).toBeInTheDocument();
    expect(screen.getByText(/up to 5.0 MB/)).toBeInTheDocument();
  });

  it("memproses satu berkas lalu menampilkan pembanding dan keterangan hasil", async () => {
    const { container } = render(<DemoPanel />);
    pickFile(container, "logo.png");

    await waitFor(() => expect(screen.getByText("Save SVG")).toBeInTheDocument());

    expect(vectorize).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("slider")).toBeInTheDocument();
    expect(screen.getByText("File size")).toBeInTheDocument();
    expect(screen.getByText(/^1 KB$/)).toBeInTheDocument();
    expect(screen.getByText(/Colours/)).toBeInTheDocument();
    expect(screen.getByText(/full size/)).toBeInTheDocument();
  });

  it("menyiapkan gambar hasil pada ukuran tampilan, bukan ukuran aslinya", async () => {
    // Gambar persegi 3000 px: tanpa batas, hasilnya akan memenuhi layar.
    loadImage.mockResolvedValue({
      data: new Uint8ClampedArray(4),
      width: 1414,
      height: 1414,
      downscaled: true,
      originalWidth: 3000,
      originalHeight: 3000,
    });
    vectorize.mockResolvedValue({
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3000 3000"></svg>',
      stats: { bytes: 900 },
      settings: { colors: 24 },
    });
    const { container } = render(<DemoPanel />);
    pickFile(container);

    await waitFor(() => expect(screen.getByText("Save SVG")).toBeInTheDocument());

    // 630 = batas tinggi tampilan 420 px dikali cadangan ketajaman 1,5.
    expect(rasterize).toHaveBeenCalledWith(expect.stringContaining("<svg"), 630, 630);
    expect(imageDataToDataUrl).toHaveBeenCalledWith(expect.anything(), 630);
    // Ukuran tampilan tidak mengubah keterangan dimensi vektor, yang tetap
    // melaporkan ukuran sesungguhnya.
    expect(screen.getByText(/3000 x 3000 px/)).toBeInTheDocument();
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

    await waitFor(() => expect(screen.getByText("Save SVG")).toBeInTheDocument());
    expect(screen.getByText(/processed at 0.40 MP/)).toBeInTheDocument();
    expect(screen.getByText(/10.00 MP/)).toBeInTheDocument();
  });

  it("menampilkan pesan ketika berkas ditolak", async () => {
    loadImage.mockRejectedValue(
      new ImageInputError("file_too_large", "The file is 6.0 MB, above the 5.0 MB limit.")
    );
    const { container } = render(<DemoPanel />);
    pickFile(container);

    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
    expect(screen.getByText(/above the 5.0 MB limit/)).toBeInTheDocument();
    expect(screen.queryByText("Save SVG")).not.toBeInTheDocument();
  });

  it("dapat diulang setelah gagal", async () => {
    loadImage.mockRejectedValue(new ImageInputError("decode_failed", "The image could not be read."));
    const { container } = render(<DemoPanel />);
    pickFile(container);
    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());

    fireEvent.click(screen.getByText("Try again"));
    expect(screen.getByText(/Drop one image here/)).toBeInTheDocument();
  });

  it("menyebut tahap kemajuan dari mesin", async () => {
    vectorize.mockImplementation(async (_image, { onProgress }) => {
      onProgress?.({ stage: "Tracing boundaries", label: "Tracing outlines", fraction: 0.55 });
      await new Promise((resolve) => setTimeout(resolve, 0));
      return {
        svg: '<svg viewBox="0 0 10 10"></svg>',
        stats: { bytes: 10 },
        settings: { colors: 3 },
      };
    });
    const { container } = render(<DemoPanel />);
    pickFile(container);

    await waitFor(() => expect(screen.getByText("Tracing outlines")).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText("Save SVG")).toBeInTheDocument());
  });
});
