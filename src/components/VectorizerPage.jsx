import { useEffect, useMemo, useState } from "react";
import { Download, LogIn, Sparkles, Wand2 } from "lucide-react";
import { AppPreview } from "./AppPreview";
import { Footer } from "./Footer";
import LoginPromptModal from "./LoginPromptModal";
import { getPlatformSession, logoutHref } from "../lib/platformAuth";
import { CHECKOUT_URL, COPYRIGHT, CATALOG, DOWNLOAD_URL, FOOTER_LINKS, HERO_HIGHLIGHTS, PLAN_LABEL, PLAN_POINTS, PREVIEW, SITE } from "../content/site";

const NAV_ITEMS = [{ id: "download", href: "#download", label: "Download", Icon: Download }];

export function VectorizerPage() {
  const [platformSession, setPlatformSession] = useState({ status: "loading" });
  const [loginPromptOpen, setLoginPromptOpen] = useState(false);

  useEffect(() => {
    let active = true;
    getPlatformSession().then((session) => { if (active) setPlatformSession(session); });
    return () => { active = false; };
  }, []);

  const authenticated = platformSession.status === "authenticated";
  const authChecking = platformSession.status !== "anonymous" && !authenticated;
  const returnTo = useMemo(() => {
    if (typeof window === "undefined") return SITE.path;
    return `${window.location.pathname}${window.location.search}` || SITE.path;
  }, []);
  const accountLabel = platformSession.user?.name || platformSession.user?.email || "Account";
  const signOutUrl = `${logoutHref()}?return_to=${encodeURIComponent(returnTo)}`;

  return (
    <div className="app-shell" id="top">
      <div className="app-shell-backdrop" aria-hidden="true"><span className="ambient-blob ambient-blob-one" /><span className="ambient-blob ambient-blob-two" /><span className="ambient-blob ambient-blob-three" /></div>
      <header className="app-header" data-testid="nav-header"><div className="app-header-inner">
        <a className="app-brand" href="#top" aria-label="XIXLabs home"><img className="app-brand-logo" src="XIX.svg" alt="" /><span className="app-brand-wordmark">{SITE.shortName}</span></a>
        <nav className="app-nav" aria-label="Page navigation">{NAV_ITEMS.map(({ id, href, label, Icon }) => <a className="app-nav-link" href={href} key={id} data-testid={`nav-tab-${id}`}><Icon className="nav-icon" aria-hidden="true" />{label}</a>)}</nav>
        <div className="app-header-actions">{authenticated ? <><span className="header-account" title={platformSession.user?.email || undefined}>{accountLabel}</span><a className="button button-secondary button-compact" href={signOutUrl}>Sign out</a></> : <button type="button" className="button button-secondary button-compact" data-testid="header-sign-in" onClick={() => setLoginPromptOpen(true)} disabled={authChecking} aria-busy={platformSession.status === "loading" ? "true" : undefined}><LogIn className="nav-icon" aria-hidden="true" />Sign in</button>}</div>
      </div></header>

      <main className="page-shell page-main">
        <section className="hero" aria-labelledby="hero-title"><div className="hero-copy">
          <p className="section-label">Desktop application</p><h1 id="hero-title">{SITE.title} <span className="hero-accent">{SITE.accentTitle}</span></h1>
          <ul className="hero-highlights">{HERO_HIGHLIGHTS.map((highlight) => <li key={highlight}>{highlight}</li>)}</ul>
          <div className="hero-actions"><a className="button button-primary" href="#download"><Wand2 className="nav-icon" aria-hidden="true" />Start free trial</a><a className="button button-secondary" href="#download"><Download className="nav-icon" aria-hidden="true" />Download app</a></div>
        </div><AppPreview product={SITE.product} preview={PREVIEW} /></section>

        <section className="panel" id="download" aria-labelledby="download-title"><p className="section-label">Download</p><h2 id="download-title">Desktop app and licence</h2><div className="download-cards">
          <article className="download-card"><p className="section-label">Installer</p><h3 className="card-title">Windows desktop app</h3><p className="card-note">Process your files locally with {CATALOG.engines.join(" and ")} and keep your source files on your own computer.</p><ul className="download-points"><li>Windows 10 or newer</li><li>Ten successful files in the free trial</li><li>Batch processing with no browser upload required</li></ul>{DOWNLOAD_URL ? <a className="button button-primary" href={DOWNLOAD_URL} rel="noreferrer"><Download className="nav-icon" aria-hidden="true" />Download Windows installer</a> : <button type="button" className="button button-primary" disabled>Download link not configured</button>}</article>
          <article className="download-card"><p className="section-label">Licence</p><h3 className="card-title">One licence for the full app</h3><p className="plan-amount">{PLAN_LABEL}</p><ul className="plan-points">{PLAN_POINTS.map((point) => <li key={point}>{point}</li>)}</ul><p className="plan-footnote">Payment, license delivery, and activation are handled through the central XIXLabs gateway. The current price is always shown by the checkout provider.</p>{CHECKOUT_URL ? <a className="button button-primary" href={CHECKOUT_URL} rel="noreferrer"><Sparkles className="nav-icon" aria-hidden="true" />Get licence</a> : <button type="button" className="button button-primary" disabled>Purchase link not configured</button>}</article>
        </div></section>
      </main>
      <Footer brandName={SITE.name} logo={<img className="footer-brand-logo" src="XIX.svg" alt="" />} socialLinks={FOOTER_LINKS.social} mainLinks={FOOTER_LINKS.main} legalLinks={FOOTER_LINKS.legal} copyright={COPYRIGHT} />
      <LoginPromptModal open={loginPromptOpen} onClose={() => setLoginPromptOpen(false)} returnTo={returnTo} productName={SITE.shortName} />
    </div>
  );
}

export default VectorizerPage;
