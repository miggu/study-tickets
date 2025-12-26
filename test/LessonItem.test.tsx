import { render, screen, cleanup, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, afterEach } from "vitest";
import { LessonItem } from "../src/components/LessonItem";

const props = {
  lesson: {
    id: "0-0-How to Get Help",
    title: "How to Get Help",
    duration: "01:04",
    section: "Getting Started with Typescript",
  },
  index: 0,
  onRemoveLesson: vi.fn(),
};

describe("LessonItem", () => {
  afterEach(() => {
    cleanup();
  });
  it("renders index, title, duration", () => {
    render(<LessonItem {...props} />);
    const lesson = screen
      .getByText(/how to get help/i)
      .closest(".sections__lesson") as HTMLElement;
    expect(within(lesson).getByText(/^1$/)).toBeInTheDocument();
    expect(screen.getByText(/how to get help/i)).toBeInTheDocument();
    expect(screen.getByText("01:04")).toBeInTheDocument();
  });
  it("removes lesson when clicking on the Done button", async () => {
    const user = userEvent.setup();

    const onRemoveLesson = vi.fn();
    render(<LessonItem {...props} onRemoveLesson={onRemoveLesson} />);
    const buttonElement = screen.getByRole("button", { name: /done/i });
    await user.click(buttonElement);
    expect(onRemoveLesson).toHaveBeenCalledWith(props.lesson.id);
  });
});
