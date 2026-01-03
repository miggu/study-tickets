import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi, type Mock } from "vitest";
import { usePlanBuilder } from "../src/hooks/usePlanBuilder";
import type { PlanDay, Section } from "../src/utils";
import { StudyPlan } from "../src/components/StudyPlan";

vi.mock("../src/hooks/usePlanBuilder");

const buildPlan = vi.fn();

const mockSections: Section[] = [
  {
    title: "Section 1",
    timeRequired: "25:00",
    lessons: [
      {
        id: "1",
        title: "Lesson 1",
        duration: "00:10:00",
      },
      {
        id: "2",
        title: "Lesson 2",
        duration: "00:15:00",
      },
    ],
  },
];

const mockPlan: PlanDay[] = [
  {
    day: 1,
    totalSeconds: 1500,
    lessons: [
      {
        id: "1",
        title: "Lesson 1",
        duration: "00:10:00",
        section: "Section 1",
      },
      {
        id: "2",
        title: "Lesson 2",
        duration: "00:15:00",
        section: "Section 1",
      },
    ],
  },
];

(usePlanBuilder as Mock).mockReturnValue({
  plan: [],
  buildPlan,
});

describe("StudyPlan", () => {
  afterEach(() => {
    vi.clearAllMocks();
    cleanup();
  });

  it("renders correctly when there are lessons", () => {
    render(<StudyPlan sections={mockSections} />);
    expect(screen.getByText(/study plan/i)).toBeInTheDocument();
  });

  it("shows a validation message when daily hours is invalid", async () => {
    const user = userEvent.setup();
    render(<StudyPlan sections={mockSections} />);
    const dailyHoursInput = screen.getByLabelText(/daily hours/i);
    await user.clear(dailyHoursInput);
    await user.type(dailyHoursInput, "0");

    const buildPlanButton = screen.getByRole("button", { name: /build plan/i });
    await user.click(buildPlanButton);

    expect(
      screen.getByText(/Enter daily hours greater than 0/i),
    ).toBeInTheDocument();
  });

  it("clears the validation message when daily hours becomes valid", async () => {
    const user = userEvent.setup();
    render(<StudyPlan sections={mockSections} />);

    // Trigger the validation message
    const dailyHoursInput = screen.getByLabelText(/daily hours/i);
    await user.clear(dailyHoursInput);
    await user.type(dailyHoursInput, "0");
    const buildPlanButton = screen.getByRole("button", { name: /build plan/i });
    await user.click(buildPlanButton);
    expect(
      screen.getByText(/Enter daily hours greater than 0/i),
    ).toBeInTheDocument();

    // Correct the input value
    await user.clear(dailyHoursInput);
    await user.type(dailyHoursInput, "2");
    expect(
      screen.queryByText(/Enter daily hours greater than 0/i),
    ).not.toBeInTheDocument();
  });

  it("calls buildPlan and reports success message", async () => {
    const user = userEvent.setup();
    buildPlan.mockReturnValue(mockPlan);
    render(<StudyPlan sections={mockSections} />);

    const dailyHoursInput = screen.getByLabelText(/daily hours/i);
    await user.clear(dailyHoursInput);
    await user.type(dailyHoursInput, "3");

    const buildPlanButton = screen.getByRole("button", { name: /build plan/i });
    await user.click(buildPlanButton);

    expect(buildPlan).toHaveBeenCalledWith(mockSections, 3);
    expect(
      screen.getByText(/Built plan over 1 day\(s\) at 3h\/day/i),
    ).toBeInTheDocument();
  });

  it("renders the plan days when provided by the hook", () => {
    (usePlanBuilder as Mock).mockReturnValue({
      plan: mockPlan,
      buildPlan: vi.fn(),
    });

    render(<StudyPlan sections={mockSections} />);
    expect(screen.getByText(/day 1/i)).toBeInTheDocument();
    expect(screen.getByText(/lesson 1/i)).toBeInTheDocument();
  });
});
