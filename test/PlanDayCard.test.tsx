import { render, screen, within, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { PlanDayCard } from "../src/components/PlanDayCard";

describe("PlanDayCard", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders day label and total duration", () => {
    render(
      <PlanDayCard
        day={2}
        totalSeconds={3723}
        lessons={[
          {
            id: "1",
            title: "Intro",
            duration: "01:02",
            section: "Getting Started",
          },
        ]}
      />,
    );
    expect(screen.getByText(/day 2/i)).toBeInTheDocument();
    expect(screen.getByText("1:02:03")).toBeInTheDocument();
  });

  it("renders lesson details with section and index", () => {
    render(
      <PlanDayCard
        day={1}
        totalSeconds={62}
        lessons={[
          {
            id: "1",
            title: "Intro",
            duration: "01:02",
            section: "Getting Started",
          },
          {
            id: "2",
            title: "Setup",
            duration: "02:00",
          },
        ]}
      />,
    );
    const introLesson = screen
      .getByText(/intro/i)
      .closest(".sections__lesson") as HTMLElement;
    expect(
      within(introLesson).getByText(/getting started/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/setup/i)).toBeInTheDocument();
    expect(screen.getByText("01:02")).toBeInTheDocument();
    expect(screen.getByText("02:00")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });
});
