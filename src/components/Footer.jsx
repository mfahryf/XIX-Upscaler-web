// Shared page footer.

// Layout follows the footer used across XIXLabs: a brand row with social links
// on the right, then a second row holding the main links, the legal links, and
// the copyright block.
//
// Everything is passed in, so another app page can reuse the component with its
// own links. The social list is optional: when it is empty the row is not
// rendered at all, which keeps the page free of links that lead nowhere.
//
// On wide screens the copyright block spans both rows on the left while the two
// link groups sit right-aligned, matching the reference layout.
export function Footer({
  brandName,
  logo,
  socialLinks = [],
  mainLinks = [],
  legalLinks = [],
  copyright,
}) {
  return (
    <footer className="app-footer">
      <div className="footer-top">
        <a className="footer-brand" href="#top" aria-label={brandName}>
          {logo}
          <span className="footer-brand-name">{brandName}</span>
        </a>

        {socialLinks.length > 0 && (
          <ul className="footer-social" aria-label="Social links">
            {socialLinks.map((link) => (
              <li key={link.href}>
                <a
                  className="footer-social-link"
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={link.label}
                  title={link.label}
                >
                  {link.icon}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="footer-body">
        <div className="footer-copyright">
          <div>{copyright.text}</div>
          {copyright.license && <div>{copyright.license}</div>}
        </div>

        {mainLinks.length > 0 && (
          <nav className="footer-main" aria-label="Footer navigation">
            <ul>
              {mainLinks.map((link) => (
                <li key={link.href}>
                  <a href={link.href}>{link.label}</a>
                </li>
              ))}
            </ul>
          </nav>
        )}

        {legalLinks.length > 0 && (
          <div className="footer-legal">
            <ul>
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <a href={link.href}>{link.label}</a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </footer>
  );
}

export default Footer;

