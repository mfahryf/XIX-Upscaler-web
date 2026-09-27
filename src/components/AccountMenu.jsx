import { useEffect, useRef, useState } from "react";

// The signed-in account sits behind one avatar button in the header: the name
// and the sign-out action appear only after it is opened. Showing both beside
// the avatar pushed the header around on narrow screens, and the menu is also
// where the email can be shown without competing with the page navigation.
function initial(label) {
  const first = String(label || "").trim().charAt(0);
  return first ? first.toUpperCase() : "?";
}

export function AccountMenu({
  name = "",
  email = "",
  picture = "",
  signOutHref = "/auth/logout",
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const triggerRef = useRef(null);
  const label = name || email || "Account";

  // Closing on an outside press or on Escape is what a menu is expected to do;
  // without it the only way out would be the trigger itself.
  useEffect(() => {
    if (!open) return undefined;

    const onPointerDown = (event) => {
      if (!menuRef.current?.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="account-menu" ref={menuRef}>
      <button
        type="button"
        className="account-trigger"
        ref={triggerRef}
        data-testid="account-trigger"
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls="account-menu-dropdown"
        title={email || label}
        onClick={() => setOpen((value) => !value)}
      >
        {picture ? (
          <img className="account-avatar" src={picture} alt="" />
        ) : (
          <span className="account-avatar account-avatar-initial" aria-hidden="true">
            {initial(label)}
          </span>
        )}
        <span className="account-trigger-name">{label}</span>
        <span className="account-trigger-icon" aria-hidden="true">
          &#9662;
        </span>
      </button>

      <div
        className="account-dropdown"
        id="account-menu-dropdown"
        hidden={!open}
        aria-label="Account menu"
      >
        <p className="account-identity">
          <span className="account-identity-name">{label}</span>
          {email && email !== label ? (
            <span className="account-identity-email">{email}</span>
          ) : null}
        </p>
        <a className="account-action" href={signOutHref}>
          Sign out
        </a>
      </div>
    </div>
  );
}

export default AccountMenu;
