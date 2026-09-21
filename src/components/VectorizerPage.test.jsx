import { render, screen, waitFor } from "@testing-library/react";
import { VectorizerPage } from "./VectorizerPage";
import { CHECKOUT_URL, HERO_HIGHLIGHTS, SITE } from "../content/site";

describe("desktop product page", () => {
  beforeEach(() => { global.fetch = async () => ({ ok: true, json: async () => ({ authenticated: false }) }); });

  it("shows product copy, preview, and sign-in action", async () => {
    render(<VectorizerPage />);
    expect(screen.getByRole("heading", { name: new RegExp(SITE.title) })).toBeInTheDocument();
    expect(screen.getByText(SITE.shortName)).toBeInTheDocument();
    expect(screen.getByRole("img")).toHaveAttribute("aria-label", expect.stringContaining(SITE.product));
    expect(screen.getByTestId("header-sign-in")).toBeInTheDocument();
    expect(document.querySelectorAll(".hero-highlights > li")).toHaveLength(HERO_HIGHLIGHTS.length);
    expect(document.querySelectorAll(".download-points > li")).toHaveLength(3);
    expect(document.querySelectorAll(".plan-points > li")).toHaveLength(4);
    await waitFor(() => expect(screen.getByTestId("header-sign-in")).not.toBeDisabled());
  });

  it("links the purchase action to the configured production checkout", async () => {
    render(<VectorizerPage />);
    expect(screen.getByRole("link", { name: "Get licence" })).toHaveAttribute("href", CHECKOUT_URL);
    await waitFor(() => expect(screen.getByTestId("header-sign-in")).not.toBeDisabled());
  });
});
