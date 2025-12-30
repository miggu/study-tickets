import { render, screen, within, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, afterEach } from "vitest";
import { SectionBlock } from "../src/components/SectionBlock";

const section = {
  title: "Getting Started",
  lessons: [
    {
      id: "0-0-Welcome To The Course!",
      title: "Welcome To The Course!",
      duration: "01:20",
      section: "Getting Started",
    },
    {
      id: "0-1-What Is NextJS? Why Would You Use It?",
      title: "What Is NextJS? Why Would You Use It?",
      duration: "02:20",
      section: "Getting Started",
    },
  ],
  totalSeconds: 5098,
};

const props = {
  section,
  isOpen: false,
  onToggle: vi.fn(),
  onRemoveSection: vi.fn(),
  onRemoveLesson: vi.fn(),
};

describe("SectionBlock", () => {
  afterEach(() => {
    cleanup();
  });
  it("renders section header details", () => {
    render(<SectionBlock {...props} />);
    expect(
      screen.getByRole("button", { name: /getting started/i }),
    ).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByText(/2 items/i)).toBeInTheDocument();
    expect(screen.getByText("1:24:58")).toBeInTheDocument();
  });

  it("toggles the section when the header button is clicked", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(<SectionBlock {...props} onToggle={onToggle} />);
    await user.click(screen.getByRole("button", { name: /getting started/i }));
    expect(onToggle).toHaveBeenCalledWith(section.title);
  });

  it("removes section when clicking Done", async () => {
    const user = userEvent.setup();
    const onRemoveSection = vi.fn();
    render(<SectionBlock {...props} onRemoveSection={onRemoveSection} />);
    const header = screen
      .getByRole("button", { name: /getting started/i })
      .closest(".sections__header") as HTMLElement;
    await user.click(within(header).getByRole("button", { name: /done/i }));
    expect(onRemoveSection).toHaveBeenCalledWith(section.title);
  });

  it("renders lessons and allows removing a lesson when open", async () => {
    const user = userEvent.setup();
    const onRemoveLesson = vi.fn();
    render(<SectionBlock {...props} isOpen onRemoveLesson={onRemoveLesson} />);
    const lesson = screen
      .getByText(/welcome to the course/i)
      .closest(".sections__lesson") as HTMLElement;
    expect(
      screen.getByText(/what is nextjs\? why would you use it\?/i),
    ).toBeInTheDocument();
    await user.click(within(lesson).getByRole("button", { name: /done/i }));
    expect(onRemoveLesson).toHaveBeenCalledWith(section.lessons[0].id);
  });
});
