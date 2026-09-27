
import { useCallback, useEffect, useRef, useState } from "react";

// Before-and-after comparison with a divider.
//
// The frame follows the shape of the original image instead of being forced to
// 16:9, so square artwork is not cropped.
//
// Beyond mouse and touch, the divider can be moved with the arrow keys. A
// hold-to-see-original button is provided because dragging the divider line on a
// touch screen is awkward.
//
// Display size is limited by height rather than by panel width. Without that
// limit a square image fills the screen and pushes the rest of the page out of
// view, when the image only needs to be seen, not measured.
//
// `transparent` draws a checkerboard behind the result, because a background
// removal result is transparent and would otherwise be indistinguishable from
// the page background.
export const DISPLAY_MAX_HEIGHT = 420;

export function BeforeAfterSlider({
  beforeSrc,
  afterSrc,
  beforeLabel = "Original",
  afterLabel = "Upscaled",
  width,
  height,
  showOriginal = false,
  maxHeight = DISPLAY_MAX_HEIGHT,
  transparent = false,
  hint = null,
}) {
  const [position, setPosition] = useState(50);
  const [dragging, setDragging] = useState(false);
  const frameRef = useRef(null);
  const ratio = height > 0 ? width / height : 1;
  // Maximum width comes from the height limit and the image shape, so the frame
  // follows the original proportions exactly without leaving a gap at the sides.
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
        className={"compare-frame" + (transparent ? " compare-frame-alpha" : "")}
        style={{ aspectRatio: ratio > 0 ? ratio : 1 }}
        role="slider"
        tabIndex={0}
        aria-label="Comparison of the original image and the result. Drag the divider, or focus this comparison and use the arrow keys."
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(position)}
        aria-valuetext={"Result " + Math.round(position) + " percent from the left"}
        data-dragging={dragging ? "true" : "false"}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onKeyDown={onKeyDown}
      >
        <img className="compare-layer" src={afterSrc} alt="Result of the background removal" />
        <div
          className="compare-before"
          style={{ clipPath: "inset(0 " + (100 - position) + "% 0 0)" }}
          data-hidden={showOriginal ? "false" : "true"}
        >
          <img className="compare-layer" src={beforeSrc} alt="Original image before background removal" />
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
      <p className="compare-hint">{hint}</p>
    </div>
  );
}

export default BeforeAfterSlider;
