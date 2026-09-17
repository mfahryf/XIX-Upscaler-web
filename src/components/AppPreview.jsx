import {
  Files,
  Folder,
  FolderOpen,
  KeyRound,
  Minus,
  Pause,
  Play,
  Settings,
  Sparkles,
  Square,
  Trash2,
  X,
} from "lucide-react";

// Static preview of the XIX Vectorizer desktop window.
//
// The window is copied from the app rather than drawn from scratch: same 300 x
// 600 shell with its 6 px transparent margin, 34 px title bar, 122 px LCD,
// 30 x 24 transport buttons, ten activity bars at the heights the app sets, and
// the sunset palette the app ships with. Keeping the app's own numbers is what
// makes the preview read as the real window instead of a lookalike.
//
// The frame is taken mid batch: nine of twelve files done, one failed, the ninth
// still going, and everything the app locks while a batch runs is dimmed the way
// the app dims it. The playlist rows follow the app's own layout and ordering -
// two digit number, state marker, file name, then OK / ERR / progress / size.
//
// The window is exposed as one image with a label, and its parts are hidden from
// assistive technology. A pretend interface read control by control would be
// noise, since nothing here can be operated.

// Row heights the app assigns to the ten activity bars.
const BARS = [40, 70, 30, 90, 55, 75, 35, 60, 45, 80];

// Same glyphs the app writes into the state cell of each row.
const MARKERS = {
  done: "\u2714",
  fail: "\u2718",
  processing: "\u23f3",
  queued: "\u00b7",
};

// Twelve files, six done, one failed, one running at 47%, three still queued.
// The trailing cell follows the app: "OK" when a file finished, "ERR" when it
// failed, the percentage while it runs, and the file size before it starts.
const PLAYLIST = [
  { name: "logo-mark.png", state: "done", trailing: "OK" },
  { name: "hero-illustration.jpg", state: "done", trailing: "OK" },
  { name: "badge-icon.webp", state: "done", trailing: "OK" },
  { name: "product-shot.png", state: "done", trailing: "OK" },
  { name: "banner-wide.jpg", state: "done", trailing: "OK" },
  { name: "icon-set-32.png", state: "done", trailing: "OK" },
  { name: "flatlay-scene.jpg", state: "fail", trailing: "ERR" },
  { name: "packaging.webp", state: "done", trailing: "OK" },
  { name: "diagram-flow.png", state: "processing", trailing: "47%" },
  { name: "mockup-device.png", state: "queued", trailing: "128.4 KB" },
  { name: "pattern-tile.jpg", state: "queued", trailing: "356.2 KB" },
  { name: "poster-a3.png", state: "queued", trailing: "902.1 KB" },
];

// The advanced panel is open by default in the app, showing the output folder
// and the sliders the V3 engine exposes.
const ADV_ROWS = [
  { id: "target_mp", label: "TARGET MP", value: "25", percent: 20 },
  { id: "colors", label: "COLOR (0 = AUTO)", value: "0", percent: 0 },
];

export function AppPreview() {
  return (
    <div
      className="app-preview"
      role="img"
      aria-label="XIX Vectorizer desktop window: 9 of 12 files processed with one failure, the Vectorize V3 engine selected, and a playlist of twelve images"
    >
      <div className="pv-app" data-run="1" aria-hidden="true">
        <div className="pv-titlebar">
          <span className="pv-label">
            <img className="pv-label-brand" src="XIX.svg" alt="" />
            <span className="pv-label-name">VECTORIZER</span>
            <span className="pv-label-byline">by XIXLabs.net</span>
          </span>
          <span className="pv-win-controls">
            <span className="pv-win-button"><Minus /></span>
            <span className="pv-win-button"><X /></span>
          </span>
        </div>

        <div className="pv-display">
          <span className="pv-lcd">
            <span className="pv-lcd-clock">
              9/12
              <span className="pv-lcd-errors">&#10008;1</span>
            </span>
            <span className="pv-lcd-meta">
              <b>SVG</b>
              <span>Full-bleed</span>
            </span>
          </span>
          <span className="pv-eq">
            {BARS.map((height, index) => (
              <span className="pv-eq-bar" style={{ height: height + "%" }} key={index} />
            ))}
            <b className="pv-eq-timer">2:06</b>
          </span>
        </div>

        <div className="pv-marquee-wrap">
          <span className="pv-marquee">PROCESSING 47%</span>
        </div>

        <div className="pv-cfg-row">
          <span className="pv-dd">
            <span className="pv-dd-label">Vectorize V3 &#8317;&#7464;&#8319;&#737;&#7526;&#8319;&#7497;&#8318;</span>
            <i className="pv-dd-arrow">&#9662;</i>
          </span>
          <span className="pv-dd">
            <span className="pv-dd-label">Full-bleed</span>
            <i className="pv-dd-arrow">&#9662;</i>
          </span>
          <span className="pv-dd">
            <span className="pv-dd-label">SVG</span>
            <i className="pv-dd-arrow">&#9662;</i>
          </span>
        </div>

        <div className="pv-seek-wrap">
          <span className="pv-seek-track">
            <span className="pv-seek-fill" style={{ width: "67%" }} />
            <span className="pv-seek-thumb" style={{ left: "calc(67% - 4px)" }} />
          </span>
        </div>

        <div className="pv-transport">
          <span className="pv-tbtn pv-start"><Play /></span>
          <span className="pv-tbtn"><Pause /></span>
          <span className="pv-tbtn"><Square /></span>
          <span className="pv-tbtn pv-sep pv-locked"><Files /></span>
          <span className="pv-tbtn pv-locked"><Folder /></span>
          <span className="pv-toggles">
            <span className="pv-tgbtn pv-locked">ADV</span>
            <span className="pv-tgbtn pv-locked"><Settings /></span>
            <span className="pv-tgbtn pv-locked"><KeyRound /></span>
          </span>
        </div>

        <div className="pv-adv pv-locked">
          <span className="pv-adv-row">
            <span className="pv-adv-label">OUTPUT</span>
            <span className="pv-adv-input">C:/out</span>
            <span className="pv-adv-pick"><FolderOpen /></span>
          </span>
          {ADV_ROWS.map((row) => (
            <span className="pv-adv-row pv-adv-mp" key={row.id}>
              <span className="pv-adv-label">{row.label}</span>
              <span className="pv-adv-range">
                <span className="pv-adv-thumb" style={{ left: "calc(" + row.percent + "% - 6px)" }} />
              </span>
              <span className="pv-adv-value">{row.value}</span>
            </span>
          ))}
        </div>

        <div className="pv-playlist">
          <div className="pv-playlist-titlebar">
            <span className="pv-playlist-label">PLAYLIST</span>
          </div>
          <div className="pv-pl-body">
            <ul className="pv-pl-list">
              {PLAYLIST.map((file, index) => (
                <li className="pv-track" data-state={file.state} key={file.name}>
                  <span className="pv-track-num">{String(index + 1).padStart(2, "0")}</span>
                  <span className="pv-track-state">{MARKERS[file.state]}</span>
                  <span className="pv-track-title">{file.name}</span>
                  <span className="pv-track-len">{file.trailing}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="pv-pl-status">
            <span>12 file</span>
            <span>READY</span>
          </div>
          <div className="pv-pl-toolbar">
            <span className="pv-pl-btn pv-locked"><Trash2 /></span>
            <span className="pv-pl-btn pv-fx pv-locked">
              <Sparkles />
              <span className="pv-fx-name">OFF</span>
            </span>
            <span className="pv-pl-grow" />
            <span className="pv-pl-btn pv-locked"><FolderOpen /></span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AppPreview;
