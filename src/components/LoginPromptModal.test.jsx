import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { LoginPromptModal } from "./LoginPromptModal";

describe("LoginPromptModal", () => {
  it("tidak dirender saat ditutup", () => {
    render(<LoginPromptModal open={false} onClose={() => {}} returnTo="/vectorizer/" />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("menampilkan ajakan login Google yang kembali ke Vectorizer", () => {
    const onClose = () => {};
    render(<LoginPromptModal open onClose={onClose} returnTo="/vectorizer/" />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Sign in to use Vectorizer" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Continue with Google/ })).toHaveAttribute(
      "href",
      "/auth/login?return_to=%2Fvectorizer%2F"
    );
  });

  it("menutup ketika latar modal diklik", () => {
    let closed = false;
    const { container } = render(
      <LoginPromptModal open onClose={() => { closed = true; }} returnTo="/vectorizer/" />
    );

    fireEvent.mouseDown(container.querySelector(".auth-modal-backdrop"));
    expect(closed).toBe(true);
  });
});
