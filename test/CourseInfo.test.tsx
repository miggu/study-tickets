import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { CourseInfoPanel } from "../src/components/CourseInfo";

const props = {
  courseTitle: "Typescript: The Complete Developer's Guide",
  syllabusSections: [
    {
      name: "Getting Started with Typescript",
      timeRequired: "40:49",
    },
    {
      name: "What is a Type System?",
      timeRequired: "20:17",
    },
    {
      name: "Type Annotations in Action",
      timeRequired: "40:53",
    },
  ],
  sectionCount: 3,
};

describe("CourseInfoPanel", () => {
  it("renders the course title and section count", () => {
    render(<CourseInfoPanel {...props} />);
    expect(
      screen.getByRole("heading", {
        name: /typescript: the complete developer's guide/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/3 sections/i)).toBeInTheDocument();
    expect(screen.getByText(/fetched course title/i)).toBeInTheDocument();
  });
});
