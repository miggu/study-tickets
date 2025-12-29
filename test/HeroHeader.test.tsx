import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { HeroHeader } from "../src/components/HeroHeader";

const props = {
  title: "Your Title",
  description: "Your Description",
  badge: "alpha",
};

describe("HeroHeader", () => {
  it("renders title, description, and badge", () => {
    render(<HeroHeader {...props} />);
    expect(
      screen.getByRole("heading", { name: /your title/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/your description/i)).toBeInTheDocument();
    expect(screen.getByText(/alpha/i)).toBeInTheDocument();
  });
});
