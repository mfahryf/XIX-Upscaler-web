
import { useEffect, useMemo, useState } from "react";
import { Download, LogIn, Sparkles, Wand2 } from "lucide-react";
import { AppPreview } from "./AppPreview";
import { DemoPanel } from "./DemoPanel";
import { Footer } from "./Footer";
import LoginPromptModal from "./LoginPromptModal";
import { getPlatformSession, logoutHref } from "../lib/platformAuth";
import {
  CHECKOUT_URL,
  COPYRIGHT,
  DOWNLOAD_URL,
  FOOTER_LINKS,
  HERO_HIGHLIGHTS,
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
  { id: "download", href: "#download", label: "Download", Icon: Download },
];

export function VectorizerPage() {
  const checkoutReady = CHECKOUT_URL.length > 0;
  const [platformSession, setPlatformSession] = useState({ status: "loading" });
  const [loginPromptOpen, setLoginPromptOpen] = useState(false);

  useEffect(() => {
    let active = true;
    getPlatformSession().then((session) => {
      if (active) setPlatformSession(session);
    });
    return () => {
      active = false;
    };
  }, []);

  const authenticated = platformSession.status === "authenticated";
  const authChecking = platformSession.status !== "anonymous" && !authenticated;
  const returnTo = useMemo(() => {
    if (typeof window === "undefined") return "/vectorizer/";
    return `${window.location.pathname}${window.location.search}` || "/vectorizer/";
  }, []);
  const accountLabel = platformSession.user?.name || platformSession.user?.email || "Account";
  const signOutUrl = `${logoutHref()}?return_to=${encodeURIComponent(returnTo)}`;

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
            {authenticated ? (
              <>
                <span className="header-account" title={platformSession.user?.email || undefined}>
                  {accountLabel}
                </span>
                <a className="button button-secondary button-compact" href={signOutUrl}>
                  Sign out
                </a>
              </>
            ) : (
              <button
                type="button"
                className="button button-secondary button-compact"
                data-testid="header-sign-in"
                onClick={() => setLoginPromptOpen(true)}
                disabled={authChecking}
                aria-busy={platformSession.status === "loading" ? "true" : undefined}
                title={
                  platformSession.status === "loading"
                    ? "Checking central account status"
                    : platformSession.status === "unavailable"
                      ? "Central account service is temporarily unavailable"
                      : undefined
                }
              >
                <LogIn className="nav-icon" aria-hidden="true" />
                Sign in
              </button>
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
            {/* Keunggulan aplikasi diletakkan di antara judul dan tombol, jadi
                pengunjung membaca alasannya sebelum diminta menekan apa pun. */}
            <ul className="hero-highlights">
              {HERO_HIGHLIGHTS.map((highlight) => (
                <li key={highlight}>{highlight}</li>
              ))}
            </ul>
            <div className="hero-actions">
              <a className="button button-primary" href="#try">
                Try it free
              </a>
              {/* Tombol unduh di sebelah tombol coba gratis. yang ditunjuk
                  adalah bagian unduhan, bukan berkas installer langsung, karena
                  alamat installer diisi dari konfigurasi dan bisa belum tersedia.
                  Bagian unduhan sudah menangani kedua keadaan itu. */}
              <a className="button button-secondary" href="#download">
                <Download className="nav-icon" aria-hidden="true" />
                Download app
              </a>
            </div>
          </div>
          {/* Kolom kanan hero menampilkan jendela aplikasi yang sebenarnya,
              bukan gambar bentuknya. Pengunjung melihat wujud produk pada
              layar pertama, tanpa harus sampai ke bagian unduhan. */}
          <AppPreview />
        </section>

        <DemoPanel
          authenticated={authenticated}
          authChecking={authChecking}
          onRequireLogin={() => setLoginPromptOpen(true)}
        />

        <section className="panel" id="download" aria-labelledby="download-title">
          <p className="section-label">Download</p>
          <h2 id="download-title">Desktop app and licence</h2>
          {/* Dua kartu berdampingan: satu menerangkan berkas yang diunduh, satu
              menerangkan lisensi yang membukanya. Harga dan kuota ikut pindah ke
              kartu lisensi, sehingga bagian harga tersendiri tidak diperlukan
              lagi dan hanya ada satu tombol menuju checkout. */}
          <div className="download-cards">
            <article className="download-card">
              <p className="section-label">Installer</p>
              <h3 className="card-title">Windows desktop app</h3>
              <p className="card-note">
                The full program: AI-powered vectorizing, three engines, batch runs, and export
                to SVG, AI, and DXF.
              </p>
              <ul className="download-points">
                <li>Windows 10 or newer</li>
                <li>Each file is processed on your own computer</li>
                <li>Free trial on all three engines, with no payment up front</li>
              </ul>
              {DOWNLOAD_URL ? (
                <a className="button button-primary" href={DOWNLOAD_URL} rel="noreferrer">
                  <Download className="nav-icon" aria-hidden="true" />
                  Download Windows installer
                </a>
              ) : (
                <button type="button" className="button button-primary" disabled>
                  Download link not configured
                </button>
              )}
            </article>

            <article className="download-card">
              <p className="section-label">Licence</p>
              <h3 className="card-title">One licence, three engines</h3>
              <p className="plan-amount">{PLAN_LABEL}</p>
              <ul className="plan-points">
                {PLAN_POINTS.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
              <p className="plan-footnote">
                After payment the licence code is issued by the payment provider, and the
                activation steps are on the payment result page.
              </p>
              {checkoutReady ? (
                <a className="button button-primary" href={CHECKOUT_URL} rel="noreferrer">
                  <Sparkles className="nav-icon" aria-hidden="true" />
                  Get licence
                </a>
              ) : (
                <button type="button" className="button button-primary" disabled>
                  Purchase link not configured
                </button>
              )}
            </article>
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
      <LoginPromptModal
        open={loginPromptOpen}
        onClose={() => setLoginPromptOpen(false)}
        returnTo={returnTo}
      />
    </div>
  );
}

export default VectorizerPage;
