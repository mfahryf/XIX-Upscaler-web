import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { Footer } from "./Footer";

const MAIN = [
  { href: "#try", label: "Try free" },
  { href: "mailto:hello@xixlabs.net", label: "Support" },
];
const LEGAL = [{ href: "/healthz", label: "Service status" }];
const COPYRIGHT = { text: "(c) 2026 XIXLabs", license: "All rights reserved" };

function renderFooter(props = {}) {
  return render(
    <Footer
      brandName="XIXLabs"
      logo={<span data-testid="brand-logo" />}
      mainLinks={MAIN}
      legalLinks={LEGAL}
      copyright={COPYRIGHT}
      {...props}
    />
  );
}

describe("Footer", () => {
  it("menampilkan logo, nama brand, dan keterangan hak cipta", () => {
    renderFooter();
    expect(screen.getByTestId("brand-logo")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "XIXLabs" })).toBeInTheDocument();
    expect(screen.getByText("(c) 2026 XIXLabs")).toBeInTheDocument();
    expect(screen.getByText("All rights reserved")).toBeInTheDocument();
  });

  it("menampilkan tautan utama di dalam navigasi bernama", () => {
    renderFooter();
    const nav = screen.getByRole("navigation", { name: "Footer navigation" });
    expect(within(nav).getByRole("link", { name: "Try free" })).toHaveAttribute("href", "#try");
    expect(within(nav).getByRole("link", { name: "Support" })).toHaveAttribute(
      "href",
      "mailto:hello@xixlabs.net"
    );
  });

  it("menampilkan tautan legal", () => {
    renderFooter();
    expect(screen.getByRole("link", { name: "Service status" })).toHaveAttribute("href", "/healthz");
  });

  // Baris sosial disembunyikan saat kosong, supaya halaman tidak menampilkan
  // tautan yang tidak menuju ke mana pun.
  it("menyembunyikan baris sosial ketika tidak ada tautan sosial", () => {
    renderFooter();
    expect(screen.queryByRole("list", { name: "Social links" })).not.toBeInTheDocument();
  });

  it("menampilkan tautan sosial di tab baru dengan rel yang aman", () => {
    renderFooter({
      socialLinks: [{ icon: <span>X</span>, href: "https://example.com/xix", label: "Example" }],
    });
    const list = screen.getByRole("list", { name: "Social links" });
    const link = within(list).getByRole("link", { name: "Example" });
    expect(link).toHaveAttribute("href", "https://example.com/xix");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noreferrer");
  });

  it("menyembunyikan baris lisensi tambahan bila tidak diberikan", () => {
    renderFooter({ copyright: { text: "(c) 2026 XIXLabs" } });
    expect(screen.getByText("(c) 2026 XIXLabs")).toBeInTheDocument();
    expect(screen.queryByText("All rights reserved")).not.toBeInTheDocument();
  });

  it("tetap tampil tanpa daftar tautan sama sekali", () => {
    renderFooter({ mainLinks: [], legalLinks: [] });
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
    expect(screen.getByText("(c) 2026 XIXLabs")).toBeInTheDocument();
  });
});

