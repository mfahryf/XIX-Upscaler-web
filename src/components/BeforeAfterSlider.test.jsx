
import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
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
    expect(screen.getByText("Asli")).toBeInTheDocument();
    expect(screen.getByText("Vektor")).toBeInTheDocument();
  });
});

