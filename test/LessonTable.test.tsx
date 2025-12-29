import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { LessonTable } from "../src/components/LessonTable";

const props = {
  lessons: [
    {
      id: "0-0-How to Get Help",
      title: "How to Get Help",
      duration: "01:04",
      section: "Getting Started with Typescript",
    },
    {
      id: "0-1-Join Our Community!",
      title: "Join Our Community!",
      duration: "00:07",
      section: "Getting Started with Typescript",
    },
    {
      id: "0-2-Course Resources",
      title: "Course Resources",
      duration: "00:38",
      section: "Getting Started with Typescript",
    },
  ],
  onRemoveSection: vi.fn(),
  onRemoveLesson: vi.fn(),
};

describe("LessonTable", () => {
  afterEach(() => {
    cleanup();
  });
  it("it's showing Episodes & Durations", () => {
    render(<LessonTable {...props} />);
    const HeaderElement = screen.getByRole("heading", {
      name: /episodes & durations/i,
    });
    expect(HeaderElement).toBeInTheDocument();
    expect(
      screen.getByText(/3\s*items/i, { selector: ".pill" }),
    ).toBeInTheDocument();
  });
  it("works when user types and then clicks", async () => {});
});
