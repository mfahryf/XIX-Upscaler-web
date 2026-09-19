import { describe, expect, it, vi } from "vitest";
import { getPlatformSession, loginHref, logoutHref } from "./platformAuth";

describe("platformAuth", () => {
  it("membentuk tautan masuk yang kembali ke halaman aplikasi", () => {
    expect(loginHref("/vectorizer/")).toBe("/auth/login?return_to=%2Fvectorizer%2F");
    expect(logoutHref()).toBe("/auth/logout");
  });

  it("membaca pengunjung anonim dari sesi platform", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ authenticated: false }),
    });

    await expect(getPlatformSession(fetchImpl)).resolves.toEqual({ status: "anonymous" });
    expect(fetchImpl).toHaveBeenCalledWith("/api/session", {
      credentials: "same-origin",
      headers: { accept: "application/json" },
    });
  });

  it("mengembalikan identitas yang sudah dibersihkan", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        authenticated: true,
        user: { name: "Vector User", email: "vector@example.com", picture: "https://example.com/p.png", access_token: "secret" },
      }),
    });

    await expect(getPlatformSession(fetchImpl)).resolves.toEqual({
      status: "authenticated",
      user: {
        name: "Vector User",
        email: "vector@example.com",
        picture: "https://example.com/p.png",
      },
    });
  });
});
