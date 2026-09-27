import { render, screen } from "@testing-library/react";
import { AppPreview } from "./AppPreview";
import { ENGINES, PREVIEW, SITE, engineLabel } from "../content/site";

describe("AppPreview", () => {
  it("renders the configured desktop product preview", () => {
    render(<AppPreview product={SITE.product} preview={PREVIEW} />);
    const preview = screen.getByRole("img");
    expect(preview).toHaveAttribute("aria-label", expect.stringContaining(SITE.product));
    expect(preview).toHaveTextContent(PREVIEW.brand);
    const selected = ENGINES.find((engine) => engine.id === PREVIEW.selectedEngine);
    expect(preview).toHaveTextContent(engineLabel(selected));
    expect(preview).toHaveTextContent(PREVIEW.format);
  });
});
