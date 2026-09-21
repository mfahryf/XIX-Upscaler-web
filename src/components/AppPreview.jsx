import { Files, Folder, FolderOpen, KeyRound, Minus, Pause, Play, Settings, Sparkles, Square, X } from "lucide-react";

const MARKERS = { done: "\u2714", processing: "\u23F3", queued: "\u00B7" };
const BARS = [40, 70, 30, 90, 55, 75, 35, 60, 45, 80];
const DEFAULTS = { accent: "#ffb36b", accent2: "#ff6b9d", accent3: "#ffd166", bgOne: "#ff8c5a", bgTwo: "#ff5a8c", bgThree: "#ffc850", bgBase: "#2b0f18" };
const CSS_VAR_NAMES = { accent: "--pv-accent", accent2: "--pv-accent-2", accent3: "--pv-accent-3", bgOne: "--pv-bg-one", bgTwo: "--pv-bg-two", bgThree: "--pv-bg-three", bgBase: "--pv-bg-base" };

export function AppPreview({ product = "XIX desktop app", preview = {} }) {
  const palette = { ...DEFAULTS, ...(preview.palette || {}) };
  const variables = Object.fromEntries(Object.entries(palette).map(([key, value]) => [CSS_VAR_NAMES[key] || `--pv-${key}`, value]));
  const files = preview.files || [];
  const engines = preview.engines || [];
  const label = `${product} desktop window: ${preview.count || "0/0"} files shown, ${preview.selectedEngine || "default engine"} selected, and a playlist of ${preview.totalFiles || files.length} files`;
  return <div className="app-preview" role="img" aria-label={label} style={variables}>
    <div className="pv-app" data-run="1" aria-hidden="true">
      <div className="pv-titlebar"><span className="pv-label"><img className="pv-label-brand" src="XIX.svg" alt="" /><span className="pv-label-name">{preview.brand || product.toUpperCase()}</span><span className="pv-label-byline">by XIXLabs.net</span></span><span className="pv-win-controls"><span className="pv-win-button"><Minus /></span><span className="pv-win-button"><X /></span></span></div>
      <div className="pv-display"><span className="pv-lcd"><span className="pv-lcd-clock">{preview.count || "0/0"}</span><span className="pv-lcd-meta"><b>{preview.format || "AUTO"}</b><span>{preview.fit || "Batch"}</span></span></span><span className="pv-eq">{BARS.map((height, index) => <span className="pv-eq-bar" style={{ height: `${height}%` }} key={index} />)}<b className="pv-eq-timer">{preview.timer || "0:00"}</b></span></div>
      <div className="pv-marquee-wrap"><span className="pv-marquee">{preview.status || "READY"}</span></div>
      <div className="pv-cfg-row"><span className="pv-dd"><span className="pv-dd-head"><span className="pv-dd-label">{preview.selectedEngine || "Engine"}</span><i className="pv-dd-arrow">&#9662;</i></span><span className="pv-dd-list">{engines.map((engine) => <span className={"pv-dd-opt" + (engine.name === preview.selectedEngine ? " pv-dd-selected" : "")} key={engine.name}>{engine.name} <small>{engine.mode}</small></span>)}</span></span>{preview.fit && <span className="pv-dd"><span className="pv-dd-head"><span className="pv-dd-label">{preview.fit}</span><i className="pv-dd-arrow">&#9662;</i></span></span>}<span className="pv-dd"><span className="pv-dd-head"><span className="pv-dd-label">{preview.format || "AUTO"}</span><i className="pv-dd-arrow">&#9662;</i></span></span></div>
      <div className="pv-seek-wrap"><span className="pv-seek-track"><span className="pv-seek-fill" style={{ width: `${preview.progress || 0}%` }} /><span className="pv-seek-thumb" style={{ left: `calc(${preview.progress || 0}% - 4px)` }} /></span></div>
      <div className="pv-transport"><span className="pv-tbtn pv-start"><Play /></span><span className="pv-tbtn"><Pause /></span><span className="pv-tbtn"><Square /></span><span className="pv-tbtn pv-sep pv-locked"><Files /></span><span className="pv-tbtn pv-locked"><Folder /></span><span className="pv-toggles"><span className="pv-tgbtn pv-locked">ADV</span><span className="pv-tgbtn pv-locked"><Settings /></span><span className="pv-tgbtn pv-locked"><KeyRound /></span></span></div>
      <div className="pv-adv pv-locked"><span className="pv-adv-row"><span className="pv-adv-label">OUTPUT</span><span className="pv-adv-input">C:/out</span><span className="pv-adv-pick"><FolderOpen /></span></span>{(preview.advancedRows || []).map((row) => <span className="pv-adv-row pv-adv-mp" key={row.id}><span className="pv-adv-label">{row.label}</span><span className="pv-adv-range"><span className="pv-adv-thumb" style={{ left: `calc(${row.percent}% - 6px)` }} /></span><span className="pv-adv-value">{row.value}</span></span>)}</div>
      <div className="pv-playlist"><div className="pv-playlist-titlebar"><span className="pv-playlist-label">PLAYLIST</span></div><div className="pv-pl-body"><ul className="pv-pl-list">{files.map(([name, state, trailing], index) => <li className="pv-track" data-state={state} key={`${name}-${index}`}><span className="pv-track-num">{String(index + 1).padStart(2, "0")}</span><span className="pv-track-state">{MARKERS[state] || MARKERS.queued}</span><span className="pv-track-title">{name}</span><span className="pv-track-len">{trailing}</span></li>)}</ul></div><div className="pv-pl-status"><span>{preview.totalFiles || files.length} file</span><span>READY</span></div><div className="pv-pl-toolbar"><span className="pv-pl-btn pv-locked"><Sparkles /></span><span className="pv-pl-btn pv-fx pv-locked"><Sparkles /><span className="pv-fx-name">OFF</span></span><span className="pv-pl-grow" /><span className="pv-pl-btn pv-locked"><FolderOpen /></span></div></div>
    </div>
  </div>;
}

export default AppPreview;
