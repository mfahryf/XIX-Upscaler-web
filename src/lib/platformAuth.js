export function loginHref(returnTo = "/") {
  return `/auth/login?return_to=${encodeURIComponent(returnTo || "/")}`;
}

export function logoutHref() {
  return "/auth/logout";
}

function normalizeUser(user) {
  return {
    name: typeof user?.name === "string" ? user.name : "",
    email: typeof user?.email === "string" ? user.email : "",
    picture: typeof user?.picture === "string" ? user.picture : "",
  };
}

export async function getPlatformSession(fetchImpl = globalThis.fetch) {
  if (typeof fetchImpl !== "function") return { status: "unavailable" };

  try {
    const response = await fetchImpl("/api/session", {
      credentials: "same-origin",
      headers: { accept: "application/json" },
    });
    if (!response.ok) return { status: "unavailable" };

    const payload = await response.json();
    if (!payload || payload.authenticated !== true || !payload.user) {
      return { status: "anonymous" };
    }

    return { status: "authenticated", user: normalizeUser(payload.user) };
  } catch {
    return { status: "unavailable" };
  }
}
