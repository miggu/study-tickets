import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, afterEach } from "vitest";
import { CourseInput } from "../src/components/CourseInput";

const props = {
  loading: false,
  status: "Ready",
  error: null,
  handleSubmit: vi.fn(),
};

describe("CourseInput", () => {
  afterEach(() => {
    cleanup();
  });
  it("renders input field", () => {
    render(<CourseInput {...props} />);
    expect(
      screen.getByRole("button", { name: /extract lessons/i }),
    ).toBeInTheDocument();
  });
  it("works when user types and then clicks", async () => {
    const url =
      "https://www.udemy.com/course/typescript-the-complete-developers-guide/";
    const user = userEvent.setup();

    const handleSubmit = vi.fn();

    render(<CourseInput {...props} handleSubmit={handleSubmit} />);
    const inputElement = screen.getByRole("textbox", { name: /course url/i });
    await user.type(inputElement, url);
    await user.click(screen.getByRole("button", { name: /extract lessons/i }));
    expect(handleSubmit).toHaveBeenCalledWith(url);
  });
});
