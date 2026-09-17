
import { useCallback, useEffect, useRef, useState } from "react";

// Pembanding sebelum-sesudah dengan penggeser.
//
// Bentuk bingkai mengikuti bentuk gambar asli, bukan dipaksa 16:9, supaya
// gambar persegi seperti logo tidak terpotong.
//
// Selain tetikus dan sentuhan, penggeser dapat dioperasikan dengan tombol
// panah. Tombol tahan-untuk-melihat-asli disediakan karena menggeser garis
// pembatas di layar sentuh tidak nyaman.
//
// Ukuran tampilan dibatasi tinggi, bukan mengikuti lebar panel. Tanpa batas
// itu, gambar persegi akan memenuhi layar dan mendorong bagian lain halaman
// keluar dari pandangan, padahal gambar hanya perlu dilihat, bukan diukur.
export const DISPLAY_MAX_HEIGHT = 420;

export function BeforeAfterSlider({
  beforeSrc,
  afterSrc,
  beforeLabel = "Original",
  afterLabel = "Vector",
  width,
  height,
  showOriginal = false,
  maxHeight = DISPLAY_MAX_HEIGHT,
}) {
  const [position, setPosition] = useState(50);
  const [dragging, setDragging] = useState(false);
  const frameRef = useRef(null);
  const ratio = height > 0 ? width / height : 1;
  // Lebar maksimum dihitung dari batas tinggi dan bentuk gambar, sehingga
  // bingkai tetap persis mengikuti bentuk aslinya tanpa rongga di sisi.
  const maxWidth = ratio > 0 ? Math.round(maxHeight * ratio) : maxHeight;

  const positionFromEvent = useCallback((clientX) => {
    const frame = frameRef.current;
    if (!frame) return;
    const rect = frame.getBoundingClientRect();
    if (!rect.width) return;
    const next = ((clientX - rect.left) / rect.width) * 100;
    setPosition(Math.max(0, Math.min(100, next)));
  }, []);

  const onPointerDown = useCallback(
    (event) => {
      if (event.button !== undefined && event.button !== 0) return;
      event.currentTarget.setPointerCapture?.(event.pointerId);
      setDragging(true);
      positionFromEvent(event.clientX);
    },
    [positionFromEvent]
  );

  const onPointerMove = useCallback(
    (event) => {
      if (!dragging) return;
      positionFromEvent(event.clientX);
    },
    [dragging, positionFromEvent]
  );

  const onPointerUp = useCallback((event) => {
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    setDragging(false);
  }, []);

  const onKeyDown = useCallback((event) => {
    const step = event.shiftKey ? 10 : 2;
    if (event.key === "ArrowLeft") {
      setPosition((value) => Math.max(0, value - step));
    } else if (event.key === "ArrowRight") {
      setPosition((value) => Math.min(100, value + step));
    } else if (event.key === "Home") {
      setPosition(0);
    } else if (event.key === "End") {
      setPosition(100);
    } else {
      return;
    }
    event.preventDefault();
  }, []);

  useEffect(() => {
    if (!dragging) return undefined;
    const stop = () => setDragging(false);
    window.addEventListener("pointerup", stop);
    window.addEventListener("pointercancel", stop);
    return () => {
      window.removeEventListener("pointerup", stop);
      window.removeEventListener("pointercancel", stop);
    };
  }, [dragging]);

  return (
    <div className="compare" style={{ maxWidth: "min(100%, " + maxWidth + "px)" }}>
      <div
        ref={frameRef}
        className="compare-frame"
        style={{ aspectRatio: ratio > 0 ? ratio : 1 }}
        role="slider"
        tabIndex={0}
        aria-label="Comparison of the original image and the vector result. Drag the divider, or focus this comparison and use the arrow keys."
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(position)}
        aria-valuetext={"Vector result " + Math.round(position) + " percent from the left"}
        data-dragging={dragging ? "true" : "false"}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onKeyDown={onKeyDown}
      >
        <img className="compare-layer" src={afterSrc} alt="Vector result of the processed image" />
        <div
          className="compare-before"
          style={{ clipPath: "inset(0 " + (100 - position) + "% 0 0)" }}
          data-hidden={showOriginal ? "false" : "true"}
        >
          <img className="compare-layer" src={beforeSrc} alt="Original image before vectorizing" />
        </div>
        {showOriginal && (
          <div className="compare-original" aria-hidden="true">
            <img className="compare-layer" src={beforeSrc} alt="" />
          </div>
        )}
        <div className="compare-divider" style={{ left: position + "%" }} aria-hidden="true">
          <span className="compare-handle">
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path d="M9 6 4 12l5 6M15 6l5 6-5 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </div>
        <span className="compare-label compare-label-before">{beforeLabel}</span>
        <span className="compare-label compare-label-after">{afterLabel}</span>
      </div>
      <p className="compare-hint">
        <a className="compare-hint-link" href="#download">
          <strong>Download XIX Vectorizer Desktop</strong>
        </a>{" "}
        — AI-powered, detail-preserving, and built for batch processing.
      </p>
    </div>
  );
}

export default BeforeAfterSlider;
