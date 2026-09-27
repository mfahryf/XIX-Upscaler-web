
import { useCallback, useEffect, useRef, useState } from "react";
import { Download, Eye, RotateCcw } from "lucide-react";
import { BeforeAfterSlider, DISPLAY_MAX_HEIGHT } from "./BeforeAfterSlider";
import {
  ImageInputError,
  checkFile,
  formatBytes,
  imageDataToDataUrl,
  loadImage,
} from "../lib/image";
import { DEMO_LIMITS } from "../content/site";

// Width of the image prepared for display. It is derived from the display
// height limit rather than the panel width, so the result is never rendered far
// larger than what can actually be seen.
const PREVIEW_MAX_WIDTH = 1200;
const PREVIEW_MIN_WIDTH = 320;
// Keeps the preview sharp on high-density screens without making it heavy.
const PREVIEW_SHARPNESS = 1.5;

function previewWidthFor(ratio) {
  if (!(ratio > 0)) return PREVIEW_MIN_WIDTH;
  const byHeight = Math.round(DISPLAY_MAX_HEIGHT * ratio * PREVIEW_SHARPNESS);
  return Math.min(PREVIEW_MAX_WIDTH, Math.max(PREVIEW_MIN_WIDTH, byHeight));
}

function outputName(originalName, scale) {
  const base = String(originalName || "image").replace(/\.[^.]+$/, "") || "image";
  return base + "-x" + scale + ".png";
}

// The engine brings in the ONNX runtime and its WASM binary, which is megabytes.
// It is loaded only when a visitor actually starts a trial, so the page stays
// light for everyone who is just reading.
function loadEngine() {
  return import("../lib/engineRunner");
}

// Free trial panel. One file per run, upscaled on the visitor's own computer by
// the same ESRGAN models the desktop app ships.
export function DemoPanel({
  authenticated = true,
  authChecking = false,
  onRequireLogin = () => {},
}) {
  const [state, setState] = useState("idle");
  const [message, setMessage] = useState("");
  const [stage, setStage] = useState("");
  const [fraction, setFraction] = useState(0);
  const [result, setResult] = useState(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const [dropping, setDropping] = useState(false);
  const [scale, setScale] = useState(4);
  const inputRef = useRef(null);
  const runRef = useRef(0);

  useEffect(() => () => { runRef.current += 1; }, []);

  const reset = useCallback(() => {
    runRef.current += 1;
    setResult(null);
    setState("idle");
    setMessage("");
    setStage("");
    setFraction(0);
    setShowOriginal(false);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const handleFile = useCallback(async (file, chosenScale) => {
    const run = (runRef.current += 1);
    const alive = () => run === runRef.current;
    setResult(null);
    setMessage("");
    setShowOriginal(false);
    setStage("");
    setFraction(0);

    try {
      checkFile(file);
      setState("reading");
      const image = await loadImage(file);
      if (!alive()) return;

      setState("processing");
      setStage("Loading model");
      const { upscale } = await loadEngine();
      if (!alive()) return;
      const output = await upscale(image, {
        scale: chosenScale,
        onProgress: ({ label, fraction: value }) => {
          if (!alive()) return;
          setStage(label);
          setFraction(Number.isFinite(value) ? value : 0);
        },
      });
      if (!alive()) return;

      const previewWidth = previewWidthFor(image.width / image.height);
      setResult({
        beforeSrc: imageDataToDataUrl(image, previewWidth),
        afterSrc: output.url,
        width: image.width,
        height: image.height,
        outputWidth: output.width,
        outputHeight: output.height,
        scale: chosenScale,
        downscaled: image.downscaled,
        sourceName: file.name,
      });
      setFraction(1);
      setState("done");
    } catch (error) {
      if (!alive()) return;
      const text =
        error instanceof ImageInputError || typeof error?.message === "string"
          ? error.message
          : "The file could not be processed.";
      setMessage(text);
      setState("error");
    }
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      setDropping(false);
      const file = event.dataTransfer?.files?.[0];
      if (!file) return;
      if (authChecking) return;
      if (!authenticated) {
        onRequireLogin();
        return;
      }
      handleFile(file, scale);
    },
    [authChecking, authenticated, handleFile, onRequireLogin, scale]
  );

  const openFilePicker = useCallback(() => {
    if (authChecking) return;
    if (!authenticated) {
      onRequireLogin();
      return;
    }
    inputRef.current?.click();
  }, [authChecking, authenticated, onRequireLogin]);

  const busy = state === "reading" || state === "processing";

  return (
    <section className="panel demo" id="try" aria-labelledby="demo-title">
      {/* This section carries no visible heading of its own: the page heading
          above it already explains the contents, and one upload button is
          enough — the one inside the drop zone, where visitors look for it. */}
      <h2 id="demo-title" className="visually-hidden">
        Upscale one image
      </h2>

      <input
        ref={inputRef}
        className="visually-hidden"
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          if (authChecking) {
            event.target.value = "";
            return;
          }
          if (!authenticated) {
            event.target.value = "";
            onRequireLogin();
            return;
          }
          // The scale chosen before picking the file is the one that runs, so the
          // control below is read only when a run starts.
          handleFile(file, scale);
        }}
      />

      {state === "idle" && (
        <div
          className="dropzone"
          data-dropping={dropping ? "true" : "false"}
          onDragOver={(event) => {
            event.preventDefault();
            setDropping(true);
          }}
          onDragLeave={() => setDropping(false)}
          onDrop={onDrop}
        >
          <span className="dropzone-mark" aria-hidden="true">{scale}x</span>
          <p className="dropzone-title">Drop one image here</p>
          <p className="dropzone-detail">
            {DEMO_LIMITS.accepted}, up to {formatBytes(DEMO_LIMITS.fileBytes)}. Output at {scale}x.
            Large images are prepared first, so the result is shown as the engine produced it.
          </p>
          <div className="demo-scale" role="group" aria-label="Upscale factor">
            {[2, 4].map((value) => (
              <button
                key={value}
                type="button"
                className={"button button-compact " + (value === scale ? "button-primary" : "button-secondary")}
                aria-pressed={value === scale}
                onClick={() => setScale(value)}
              >
                {value}x
              </button>
            ))}
          </div>
          <button
            type="button"
            className="button button-primary button-compact"
            onClick={openFilePicker}
          >
            Choose image
          </button>
        </div>
      )}

      {busy && (
        <div className="progress" role="status" aria-live="polite">
          <div className="progress-head">
            <span className="progress-stage">{state === "reading" ? "Reading file" : stage}</span>
            <span className="progress-value">
              {state === "reading" ? "" : Math.round(fraction * 100) + "%"}
            </span>
          </div>
          <div className="progress-track">
            <div
              className="progress-bar"
              data-indeterminate={state === "reading" ? "true" : "false"}
              style={state === "reading" ? undefined : { width: Math.round(fraction * 100) + "%" }}
            />
          </div>
          <p className="progress-note">
            The first run downloads the offline model, about 1 MB, and your browser caches it
            afterwards. Dense images take longer because the engine works through them in tiles.
          </p>
        </div>
      )}

      {state === "error" && (
        <div className="alert" role="alert">
          <strong>The image could not be processed.</strong>
          <p>{message}</p>
          <button type="button" className="button button-secondary" onClick={reset}>
            <RotateCcw className="nav-icon" aria-hidden="true" />
            Try again
          </button>
        </div>
      )}

      {state === "done" && result && (
        <div className="result">
          <BeforeAfterSlider
            beforeSrc={result.beforeSrc}
            afterSrc={result.afterSrc}
            width={result.width}
            height={result.height}
            showOriginal={showOriginal}
            hint={
              <>
                <a className="compare-hint-link" href="#download">
                  <strong>Download XIX Upscaler Desktop</strong>
                </a>{" "}
                — full-size source files, video work, and batch runs.
              </>
            }
          />
          {result.downscaled && (
            <p className="result-note">
              The source was larger than {formatBytes(DEMO_LIMITS.fileBytes)} worth of pixels, so it
              was prepared at a smaller size before upscaling. The {result.scale}x result is shown as
              the engine produced it.
            </p>
          )}
          <div className="result-actions">
            <a
              className="button button-primary"
              href={result.afterSrc}
              download={outputName(result.sourceName, result.scale)}
            >
              <Download className="nav-icon" aria-hidden="true" />
              Save PNG
            </a>
            <button
              type="button"
              className="button button-secondary"
              onPointerDown={() => setShowOriginal(true)}
              onPointerUp={() => setShowOriginal(false)}
              onPointerLeave={() => setShowOriginal(false)}
              onKeyDown={(event) => {
                if (event.key === " " || event.key === "Enter") setShowOriginal(true);
              }}
              onKeyUp={(event) => {
                if (event.key === " " || event.key === "Enter") setShowOriginal(false);
              }}
              onBlur={() => setShowOriginal(false)}
            >
              <Eye className="nav-icon" aria-hidden="true" />
              Hold to see original
            </button>
            <button type="button" className="button button-secondary" onClick={reset}>
              <RotateCcw className="nav-icon" aria-hidden="true" />
              Start over
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

export default DemoPanel;
