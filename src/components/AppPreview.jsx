import { Check, Files, Folder, KeyRound, Minus, Pause, Play, Settings, Square, Trash2, X } from "lucide-react";

// Static preview of the XIX Vectorizer desktop window.
//
// The layout mirrors the real app: a narrow window holding the title bar, the
// LCD readout, the status line, the engine row, the progress bar, the transport
// controls, and the playlist. Nothing here is interactive. It exists so a
// visitor can see what the app looks like before installing it.
//
// The window is exposed as a single image with a label, and its parts are
// hidden from assistive technology. A pretend interface read control by control
// would be noise rather than information.

const PLAYLIST = [
  { name: "logo-mark.png", state: "done" },
  { name: "hero-illustration.jpg", state: "done" },
  { name: "badge-icon.webp", state: "active" },
  { name: "diagram-flow.png", state: "queued" },
  { name: "spread-flatlay.jpg", state: "queued" },
];

const BARS = 10;

export function AppPreview() {
  return (
    <div
      className="app-preview"
      role="img"
      aria-label="XIX Vectorizer desktop window, showing the engine selector, progress bar, transport controls, and a playlist of images being vectorized"
    >
      <div className="pv-window" aria-hidden="true">
        <div className="pv-titlebar">
          <span className="pv-brand">
            <img src="XIX.svg" alt="" />
            <b>VECTORIZER</b>
            <i>by XIXLabs.net</i>
          </span>
          <span className="pv-win-controls">
            <span className="pv-win-button"><Minus /></span>
            <span className="pv-win-button"><X /></span>
          </span>
        </div>

        <div className="pv-display">
          <span className="pv-lcd">
            <b>12/24</b>
            <i>SVG &#183; Full-bleed</i>
          </span>
          <span className="pv-eq">
            {Array.from({ length: BARS }, (_, index) => (
              <span className="pv-eq-bar" key={index} />
            ))}
            <b className="pv-eq-timer">1:24</b>
          </span>
        </div>

        <p className="pv-status">VECTORIZING 12 OF 24 &#8212; BADGE-ICON.WEBP</p>

        <div className="pv-row">
          <span className="pv-chip pv-chip-wide">Vectorize V3<sup>&#8319;&#7476;&#7476;&#7476;&#7504;&#7504;</sup></span>
          <span className="pv-chip">2x</span>
        </div>
        <div className="pv-row">
          <span className="pv-chip pv-chip-wide">Full-bleed</span>
          <span className="pv-chip">SVG</span>
        </div>

        <div className="pv-seek">
          <span className="pv-seek-fill" />
          <span className="pv-seek-thumb" />
        </div>

        <div className="pv-transport">
          <span className="pv-btn"><Play /></span>
          <span className="pv-btn pv-btn-dim"><Pause /></span>
          <span className="pv-btn pv-btn-dim"><Square /></span>
          <span className="pv-btn"><Files /></span>
          <span className="pv-btn"><Folder /></span>
          <span className="pv-toggles">
            <span className="pv-tgbtn">ADV</span>
            <span className="pv-tgbtn"><Settings /></span>
            <span className="pv-tgbtn"><KeyRound /></span>
          </span>
        </div>

        <div className="pv-playlist">
          <div className="pv-playlist-head">PLAYLIST</div>
          <ul className="pv-tracks">
            {PLAYLIST.map((track, index) => (
              <li className="pv-track" data-state={track.state} key={track.name}>
                <span className="pv-track-num">{index + 1}.</span>
                <span className="pv-track-name">{track.name}</span>
                <span className="pv-track-state">
                  {track.state === "done" ? <Check /> : track.state === "active" ? "&#8635;" : "\u2013"}
                </span>
              </li>
            ))}
          </ul>
          <div className="pv-playlist-foot">
            <span className="pv-btn"><Trash2 /></span>
            <span className="pv-tgbtn">OFF</span>
            <span className="pv-playlist-note">14 of 24 files done</span>
            <span className="pv-btn"><Folder /></span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AppPreview;

