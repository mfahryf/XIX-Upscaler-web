
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
import { vectorize } from "../lib/engineRunner";
import { byteLength, downloadSvg, outputName, rasterize, readSize } from "../lib/svg";
import { DEMO_LIMITS } from "../content/site";

// Width of the image prepared for display. It is derived from the display
// height limit rather than the panel width, so the result is never rendered
// far larger than what can actually be seen.
const PREVIEW_MAX_WIDTH = 1200;
const PREVIEW_MIN_WIDTH = 320;
// Keeps the preview sharp on high-density screens without making it heavy.
const PREVIEW_SHARPNESS = 1.5;

function previewWidthFor(ratio) {
  if (!(ratio > 0)) return PREVIEW_MIN_WIDTH;
  const byHeight = Math.round(DISPLAY_MAX_HEIGHT * ratio * PREVIEW_SHARPNESS);
  return Math.min(PREVIEW_MAX_WIDTH, Math.max(PREVIEW_MIN_WIDTH, byHeight));
}

// Free trial panel. One file per run, processed on the visitor's own computer,
// with progress shown honestly from the stages the engine reports.
export function DemoPanel() {
  const [state, setState] = useState("idle");
  const [message, setMessage] = useState("");
  const [stage, setStage] = useState("");
  const [fraction, setFraction] = useState(0);
  const [result, setResult] = useState(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const [dropping, setDropping] = useState(false);
  const inputRef = useRef(null);
  const runRef = useRef(0);

  useEffect(() => () => { runRef.current += 1; }, []);

  const reset = useCallback(() => {
    runRef.current += 1;
    setState("idle");
    setMessage("");
    setStage("");
    setFraction(0);
    setResult(null);
    setShowOriginal(false);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const handleFile = useCallback(async (file) => {
    const run = (runRef.current += 1);
    const alive = () => run === runRef.current;
    setMessage("");
    setResult(null);
    setShowOriginal(false);
    setStage("");
    setFraction(0);

    try {
      checkFile(file);
      setState("reading");
      const image = await loadImage(file);
      if (!alive()) return;

      setState("processing");
      setStage("Preparing file");
      const started = Date.now();
      const output = await vectorize(image, {
        onProgress: ({ label, fraction: value }) => {
          if (!alive()) return;
          setStage(label);
          setFraction(Number.isFinite(value) ? value : 0);
        },
      });
      if (!alive()) return;
      const elapsed = Date.now() - started;

      const size = readSize(output.svg) || { width: image.width, height: image.height };
      const previewWidth = previewWidthFor(size.width / size.height);
      const previewHeight = Math.max(1, Math.round((previewWidth * size.height) / size.width));
      const beforeSrc = imageDataToDataUrl(image, previewWidth);
      const afterSrc = await rasterize(output.svg, previewWidth, previewHeight);
      if (!alive()) return;

      setResult({
        beforeSrc,
        afterSrc,
        width: size.width,
        height: size.height,
        svgBytes: byteLength(output.svg),
        svg: output.svg,
        sourceName: file.name,
        elapsed,
        colors: output.settings?.colors ?? null,
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
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const busy = state === "reading" || state === "processing";

  return (
    <section className="panel demo" id="try" aria-labelledby="demo-title">
      {/* Bagian ini tidak lagi memakai judul sendiri. Judul halaman di atasnya
          sudah menjelaskan isinya, dan tombol unggahnya cukup satu: yang ada di
          dalam kotak unggah, tempat pengunjung memang melihatnya. */}
      <h2 id="demo-title" className="visually-hidden">
        Vectorize one image
      </h2>

      <input
        ref={inputRef}
        className="visually-hidden"
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) handleFile(file);
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
          <span className="dropzone-mark" aria-hidden="true">SVG</span>
          <p className="dropzone-title">Drop one image here</p>
          <p className="dropzone-detail">
            {DEMO_LIMITS.accepted}, up to {formatBytes(DEMO_LIMITS.fileBytes)}.
          </p>
          <button
            type="button"
            className="button button-primary button-compact"
            onClick={() => inputRef.current?.click()}
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
            Images with dense lines and texture take the longest. Keep this page open until it
            finishes.
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
          />
          <div className="result-actions">
            <button
              type="button"
              className="button button-primary"
              onClick={() => downloadSvg(result.svg, outputName(result.sourceName))}
            >
              <Download className="nav-icon" aria-hidden="true" />
              Save SVG
            </button>
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
          <dl className="result-stats">
            <div>
              <dt>File size</dt>
              <dd>{formatBytes(result.svgBytes)}</dd>
            </div>
            <div>
              <dt>Processing time</dt>
              <dd>{(result.elapsed / 1000).toFixed(1)} s</dd>
            </div>
            <div>
              <dt>Vector dimensions</dt>
              <dd>
                {Math.round(result.width)} x {Math.round(result.height)} px
              </dd>
            </div>
            <div>
              <dt>Colours</dt>
              <dd>{result.colors ?? "auto"}</dd>
            </div>
          </dl>
          <p className="result-note">
            This free page runs a basic engine in your browser. Download the XIX Vectorizer
            desktop app for the best results: its vectorizing is powered by AI, so it keeps
            fine detail, handles big batches, and exports SVG, AI, and DXF.
          </p>
        </div>
      )}
    </section>
  );
}

export default DemoPanel;
