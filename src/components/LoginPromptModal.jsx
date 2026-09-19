import { LogIn, X } from "lucide-react";
import { loginHref } from "../lib/platformAuth";

function defaultReturnTo() {
  if (typeof window === "undefined") return "/vectorizer/";
  return `${window.location.pathname}${window.location.search}` || "/vectorizer/";
}

export function LoginPromptModal({ open, onClose, returnTo = defaultReturnTo() }) {
  if (!open) return null;

  return (
    <div
      className="auth-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="auth-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-prompt-title"
      >
        <button
          type="button"
          className="auth-modal-close"
          onClick={onClose}
          aria-label="Close sign-in dialog"
        >
          <X className="nav-icon" aria-hidden="true" />
        </button>
        <img className="auth-modal-watermark" src="XIX.svg" alt="" aria-hidden="true" />
        <p className="section-label">Central account</p>
        <h2 id="login-prompt-title">Sign in to use Vectorizer</h2>
        <p className="auth-modal-copy">
          Sign in with Google to choose an image, drop a file, and use the Vectorizer trial.
        </p>
        <div className="auth-divider" aria-hidden="true">
          <span>CONTINUE WITH</span>
        </div>
        <a
          className="button button-primary auth-sign-in-button auth-provider-button"
          href={loginHref(returnTo)}
          data-testid="modal-sign-in-button"
        >
          <LogIn className="nav-icon" aria-hidden="true" />
          Continue with Google
        </a>
        <p className="auth-modal-note">You will return to this page after signing in.</p>
      </section>
    </div>
  );
}

export default LoginPromptModal;
