import { fireEvent, render, screen } from "@testing-library/react";
import { AccountMenu } from "./AccountMenu";

describe("AccountMenu", () => {
  const base = {
    name: "Test User",
    email: "test@example.com",
    picture: "",
    signOutHref: "/auth/logout?return_to=%2F",
  };

  it("menyembunyikan nama dan Sign out sampai menu dibuka", () => {
    render(<AccountMenu {...base} />);

    expect(screen.queryByRole("link", { name: "Sign out" })).not.toBeInTheDocument();
    const trigger = screen.getByTestId("account-trigger");
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(trigger);

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("link", { name: "Sign out" })).toHaveAttribute(
      "href",
      base.signOutHref
    );
    expect(screen.getByText("test@example.com")).toBeInTheDocument();
  });

  it("menutup menu dengan Escape dan mengembalikan fokus ke pemicunya", () => {
    render(<AccountMenu {...base} />);
    const trigger = screen.getByTestId("account-trigger");
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");

    fireEvent.keyDown(document, { key: "Escape" });

    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveFocus();
  });

  it("menutup menu saat menekan di luarnya", () => {
    render(<AccountMenu {...base} />);
    const trigger = screen.getByTestId("account-trigger");
    fireEvent.click(trigger);

    fireEvent.pointerDown(document.body);

    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("memakai huruf pertama nama sebagai avatar cadangan", () => {
    render(<AccountMenu name="Test User" email="" picture="" signOutHref="/x" />);

    expect(screen.getByText("T")).toBeInTheDocument();
    expect(document.querySelector("img.account-avatar")).toBeNull();
  });

  it("menampilkan foto ketika sesi menyertakannya", () => {
    render(<AccountMenu {...base} picture="/photo.png" />);

    expect(document.querySelector("img.account-avatar")).toHaveAttribute("src", "/photo.png");
  });
});
