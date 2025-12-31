import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Lesson, PlanDay } from "../src/utils";
import { StudyPlan } from "../src/components/StudyPlan";

const mockBuildPlan = vi.fn();
const mockSetPlan = vi.fn();
let mockPlan: PlanDay[] = [];

vi.mock("../src/hooks/usePlanBuilder", () => ({
  usePlanBuilder: () => ({
    plan: mockPlan,
    setPlan: mockSetPlan,
    buildPlan: mockBuildPlan,
  }),
}));

const lessons: Lesson[] = [
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
];

describe("StudyPlan", () => {
  afterEach(() => {
    cleanup();
    mockBuildPlan.mockReset();
    mockSetPlan.mockReset();
    mockPlan = [];
  });

  it("renders nothing when there are no lessons", () => {
    render(<StudyPlan lessons={[]} />);
    expect(screen.queryByText(/study plan/i)).not.toBeInTheDocument();
  });

  it("shows a validation message when daily hours is invalid", async () => {
    const user = userEvent.setup();
    render(<StudyPlan lessons={lessons} />);
    const input = screen.getByLabelText(/daily hours/i);
    await user.clear(input);
    await user.type(input, "0");
    await user.click(screen.getByRole("button", { name: /build plan/i }));
    expect(
      screen.getByText(/enter daily hours greater than 0/i),
    ).toBeInTheDocument();
    expect(mockBuildPlan).not.toHaveBeenCalled();
  });

  it("calls buildPlan and reports success message", async () => {
    const user = userEvent.setup();
    mockBuildPlan.mockReturnValue([{ day: 1, totalSeconds: 900, lessons }]);
    render(<StudyPlan lessons={lessons} />);
    await user.click(screen.getByRole("button", { name: /build plan/i }));
    expect(mockBuildPlan).toHaveBeenCalledWith(lessons, 2);
    expect(
      screen.getByText(/built plan over 1 day\(s\) at 2h\/day/i),
    ).toBeInTheDocument();
  });

  it("clears the validation message when daily hours becomes valid", async () => {
    const user = userEvent.setup();
    render(<StudyPlan lessons={lessons} />);
    const input = screen.getByLabelText(/daily hours/i);
    await user.clear(input);
    await user.type(input, "0");
    await user.click(screen.getByRole("button", { name: /build plan/i }));
    expect(
      screen.getByText(/enter daily hours greater than 0/i),
    ).toBeInTheDocument();
    await user.clear(input);
    await user.type(input, "1");
    expect(
      screen.queryByText(/enter daily hours greater than 0/i),
    ).not.toBeInTheDocument();
  });

  it("renders the plan days when provided by the hook", () => {
    mockPlan = [{ day: 1, totalSeconds: 900, lessons }];
    render(<StudyPlan lessons={lessons} />);
    expect(screen.getByText(/day 1/i)).toBeInTheDocument();
    expect(screen.getByText(/how to get help/i)).toBeInTheDocument();
    expect(screen.getByText("01:04")).toBeInTheDocument();
  });
});
