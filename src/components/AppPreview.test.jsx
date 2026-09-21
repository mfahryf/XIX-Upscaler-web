import { render, screen } from "@testing-library/react";
import { AppPreview } from "./AppPreview";
import { PREVIEW, SITE } from "../content/site";

describe("AppPreview", () => {
  it("renders the configured desktop product preview", () => {
    render(<AppPreview product={SITE.product} preview={PREVIEW} />);
    const preview = screen.getByRole("img");
    expect(preview).toHaveAttribute("aria-label", expect.stringContaining(SITE.product));
    expect(preview).toHaveTextContent(PREVIEW.brand);
    expect(preview).toHaveTextContent(PREVIEW.selectedEngine);
    expect(preview).toHaveTextContent(PREVIEW.format);
  });
});
