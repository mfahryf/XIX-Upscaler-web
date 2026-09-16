
import { DemoPanel } from "./DemoPanel";
import { CATALOG, CHECKOUT_URL, DOWNLOAD_URL, FEATURES, PLAN_LABEL, PLAN_POINTS, SITE } from "../content/site";

// Halaman publik XIX Vectorizer.
//
// Perannya: penjelasan produk, percobaan gratis, dan unduhan. Urusan kode
// lisensi dan aktivasi setelah pembayaran tetap berada di halaman
// /payment/complete milik landing pusat, sehingga tidak ada dua halaman yang
// mengerjakan hal yang sama.
export function VectorizerPage() {
  const checkoutReady = CHECKOUT_URL.length > 0;

  return (
    <div className="shell" id="atas">
      <div className="aurora" aria-hidden="true">
        <span className="aurora-blob aurora-blob-one" />
        <span className="aurora-blob aurora-blob-two" />
        <span className="aurora-blob aurora-blob-three" />
      </div>

      <header className="page-header">
        <a className="brand" href="#atas" aria-label="XIXLabs">
          <span className="brand-mark" aria-hidden="true">XIX</span>
          <span className="brand-name">{SITE.name}</span>
        </a>
        <nav className="page-nav" aria-label="Navigasi halaman">
          <a href="#coba">Coba gratis</a>
          <a href="#harga">Harga</a>
          <a href="#unduh">Unduh</a>
          {checkoutReady && (
            <a className="button button-primary button-compact" href={CHECKOUT_URL} rel="noreferrer">
              Beli lisensi
            </a>
          )}
        </nav>
      </header>

      <main className="page-main">
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="section-label">{SITE.product}</p>
            <h1 id="hero-title">
              Ubah gambar menjadi SVG, <span className="hero-accent">tanpa kehilangan bentuk</span>
            </h1>
            <p className="hero-lede">{SITE.tagline}</p>
            <div className="hero-actions">
              <a className="button button-primary" href="#coba">
                Coba gratis sekarang
              </a>
              <a className="text-link" href="#harga">
                Lihat harga
              </a>
            </div>
            <ul className="hero-facts">
              <li>Tiga mesin vektor</li>
              <li>Tanpa watermark</li>
              <li>Bisa dipakai offline</li>
            </ul>
          </div>
          <div className="hero-card" aria-hidden="true">
            <div className="hero-card-lines">
              <span />
              <span />
              <span />
            </div>
            <p className="hero-card-caption">
              Vektor hasil mesin V3, siap disunting di aplikasi desain.
            </p>
          </div>
        </section>

        <DemoPanel />

        <section className="panel" aria-labelledby="kenapa-title">
          <p className="section-label">Kenapa Vectorizer</p>
          <h2 id="kenapa-title">Dibuat untuk pekerjaan nyata</h2>
          <div className="feature-grid">
            {FEATURES.map((feature) => (
              <article className="feature" key={feature.title}>
                <h3>{feature.title}</h3>
                <p>{feature.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="panel" id="harga" aria-labelledby="harga-title">
          <p className="section-label">Yang Anda dapat</p>
          <h2 id="harga-title">Satu lisensi, tiga mesin</h2>
          <div className="plan">
            <div className="plan-price">
              <p className="plan-amount">{PLAN_LABEL}</p>
              <p className="plan-note">
                Berlaku {CATALOG.durationDays} hari, lalu dapat diperpanjang dengan pembayaran
                berikutnya.
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
                  Beli lisensi
                </a>
              ) : (
                <button type="button" className="button button-primary" disabled>
                  Tautan pembelian belum siap
                </button>
              )}
              <p className="plan-footnote">
                Setelah membayar, kode lisensi diterbitkan penyedia pembayaran dan langkah
                aktivasinya ada di halaman hasil pembayaran.
              </p>
            </div>
          </div>
        </section>

        <section className="panel" id="unduh" aria-labelledby="unduh-title">
          <p className="section-label">Unduh</p>
          <h2 id="unduh-title">Aplikasi desktop</h2>
          {DOWNLOAD_URL ? (
            <a className="button button-primary" href={DOWNLOAD_URL} rel="noreferrer">
              Unduh installer Windows
            </a>
          ) : (
            <p className="plan-footnote">
              Installer belum tersedia untuk diunduh. Percobaan di halaman ini sudah memakai mesin
              yang sama, sehingga hasilnya dapat dinilai lebih dulu.
            </p>
          )}
          <ul className="download-points">
            <li>Windows 10 atau lebih baru</li>
            <li>Pemrosesan gambar berjalan di komputer Anda</li>
            <li>Setelah aktivasi, dapat dipakai tanpa internet sampai {CATALOG.offlineLeaseDays} hari</li>
          </ul>
        </section>
      </main>

      <footer className="page-footer">
        <span>(c) {SITE.name}</span>
        <span className="footer-links">
          <a href="mailto:hello@xixlabs.net">Bantuan</a>
          <a href="/healthz">Status layanan</a>
          <a href="#atas">Kembali ke atas</a>
        </span>
      </footer>
    </div>
  );
}

export default VectorizerPage;

