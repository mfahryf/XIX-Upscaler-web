
import { Download, Sparkles, Wand2 } from "lucide-react";
import { AppPreview } from "./AppPreview";
import { DemoPanel } from "./DemoPanel";
import { Footer } from "./Footer";
import {
  CATALOG,
  CHECKOUT_URL,
  COPYRIGHT,
  DOWNLOAD_URL,
  FEATURES,
  FOOTER_LINKS,
  PLAN_LABEL,
  PLAN_POINTS,
  SITE,
} from "../content/site";

// Public XIX Vectorizer page.
//
// Its job: explain the product, offer a free trial, and provide the download.
// Licence codes and post-purchase activation stay on the central landing page's
// /payment/complete route, so no two pages do the same work.
const NAV_ITEMS = [
  { id: "try", href: "#try", label: "Try free", Icon: Wand2 },
  { id: "pricing", href: "#pricing", label: "Pricing", Icon: Sparkles },
  { id: "download", href: "#download", label: "Download", Icon: Download },
];

export function VectorizerPage() {
  const checkoutReady = CHECKOUT_URL.length > 0;

  return (
    <div className="app-shell" id="top">
      <div className="app-shell-backdrop" aria-hidden="true">
        <span className="ambient-blob ambient-blob-one" />
        <span className="ambient-blob ambient-blob-two" />
        <span className="ambient-blob ambient-blob-three" />
      </div>

      <header className="app-header" data-testid="nav-header">
        <div className="app-header-inner">
          <a className="app-brand" href="#top" aria-label="XIXLabs home">
            <img className="app-brand-logo" src="XIX.svg" alt="" />
            <span className="app-brand-wordmark">Vectorizer</span>
          </a>

          <nav className="app-nav" aria-label="Page navigation">
            {NAV_ITEMS.map(({ id, href, label, Icon }) => (
              <a className="app-nav-link" href={href} key={id} data-testid={"nav-tab-" + id}>
                <Icon className="nav-icon" aria-hidden="true" />
                {label}
              </a>
            ))}
          </nav>

          <div className="app-header-actions">
            {checkoutReady ? (
              <a className="button button-primary button-compact" href={CHECKOUT_URL} rel="noreferrer">
                <Sparkles className="nav-icon" aria-hidden="true" />
                Get licence
              </a>
            ) : (
              <span className="header-note">Purchase link not configured</span>
            )}
          </div>
        </div>
      </header>

      <main className="page-shell page-main">
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <h1 id="hero-title">
              Turn images into SVG, <span className="hero-accent">without losing the shapes</span>
            </h1>
            <div className="hero-actions">
              <a className="button button-primary" href="#try">
                Try it free
              </a>
              <a className="text-link" href="#pricing">
                See pricing
              </a>
            </div>
            <ul className="hero-facts">
              <li>Three vector engines</li>
              <li>No watermark</li>
              <li>Works offline</li>
            </ul>
          </div>
          <div className="hero-card" aria-hidden="true">
            <div className="hero-card-lines">
              <span />
              <span />
              <span />
            </div>
            <p className="hero-card-caption">
              Vector output from the V3 engine, ready to edit in a design app.
            </p>
          </div>
        </section>

        <DemoPanel />

        <section className="panel" aria-labelledby="why-title">
          <p className="section-label">Why Vectorizer</p>
          <h2 id="why-title">Built for real work</h2>
          <div className="feature-grid">
            {FEATURES.map((feature) => (
              <article className="feature" key={feature.title}>
                <h3>{feature.title}</h3>
                <p>{feature.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="panel" id="pricing" aria-labelledby="pricing-title">
          <p className="section-label">What you get</p>
          <h2 id="pricing-title">One licence, three engines</h2>
          <div className="plan">
            <div className="plan-price">
              <p className="plan-amount">{PLAN_LABEL}</p>
              <p className="plan-note">
                Valid for {CATALOG.durationDays} days, then renewable with the next payment.
              </p>
            </div>
            <ul className="plan-points">
              {PLAN_POINTS.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
            <div className="plan-actions">
              {checkoutReady ? (
                <a className="button button-primary" href={CHECKOUT_URL} rel="noreferrer">
                  Get licence
                </a>
              ) : (
                <button type="button" className="button button-primary" disabled>
                  Purchase link not configured
                </button>
              )}
              <p className="plan-footnote">
                After payment the licence code is issued by the payment provider, and the
                activation steps are on the payment result page.
              </p>
            </div>
          </div>
        </section>

        <section className="panel" id="download" aria-labelledby="download-title">
          <p className="section-label">Download</p>
          <h2 id="download-title">Desktop app</h2>
          <div className="download-grid">
            <div className="download-copy">
              {DOWNLOAD_URL ? (
                <a className="button button-primary" href={DOWNLOAD_URL} rel="noreferrer">
                  <Download className="nav-icon" aria-hidden="true" />
                  Download Windows installer
                </a>
              ) : (
                <p className="plan-footnote">
                  The installer is not available for download yet. The trial on this page already
                  uses the same engine, so you can judge the output first.
                </p>
              )}
              <ul className="download-points">
                <li>Windows 10 or newer</li>
                <li>Image processing runs on your own computer</li>
                <li>
                  After activation it works without internet for up to {CATALOG.offlineLeaseDays}{" "}
                  days
                </li>
              </ul>
            </div>
            <AppPreview />
          </div>
        </section>
      </main>

      <Footer
        brandName={SITE.name}
        logo={<img className="footer-brand-logo" src="XIX.svg" alt="" />}
        socialLinks={FOOTER_LINKS.social}
        mainLinks={FOOTER_LINKS.main}
        legalLinks={FOOTER_LINKS.legal}
        copyright={COPYRIGHT}
      />
    </div>
  );
}

export default VectorizerPage;
