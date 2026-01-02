import { renderHook, act } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { usePlanBuilder } from "../src/hooks/usePlanBuilder";
import type { Lesson } from "../src/utils";

const lessons: Lesson[] = [
  {
    id: "0-0-How to Get Help",
    title: "How to Get Help",
    duration: "10:30", // 630s
    section: "Getting Started with Typescript",
  },
  {
    id: "0-1-Join Our Community!",
    title: "Join Our Community!",
    duration: "05:15", // 315s
    section: "Getting Started with Typescript",
  },
  {
    id: "0-2-Course Resources",
    title: "Course Resources",
    duration: "25:00", // 1500s
    section: "Getting Started with Typescript",
  },
  {
    id: "1-0-Do Not Skip - Course Overview",
    title: "Do Not Skip - Course Overview",
    duration: "45:00", // 2700s
    section: "What is a Type System?",
  },
  {
    id: "1-1-Types",
    title: "Types",
    duration: "30:00", // 1800s
    section: "What is a Type System?",
  },
];

describe("usePlanBuilder", () => {
  it("should return an empty plan for no lessons", () => {
    const { result } = renderHook(() => usePlanBuilder());
    act(() => {
      result.current.buildPlan([], 2);
    });
    expect(result.current.plan).toEqual([]);
  });

  it("should return an empty plan for invalid daily hours", () => {
    const { result } = renderHook(() => usePlanBuilder());
    act(() => {
      result.current.buildPlan(lessons, 0);
    });
    expect(result.current.plan).toEqual([]);
    act(() => {
      result.current.buildPlan(lessons, -1);
    });
    expect(result.current.plan).toEqual([]);
  });

  it("should group lessons into a single day", () => {
    const { result } = renderHook(() => usePlanBuilder());
    act(() => {
      result.current.buildPlan(lessons, 2);
    });
    expect(result.current.plan).toHaveLength(1);
    expect(result.current.plan[0].day).toBe(1);
    expect(result.current.plan[0].lessons).toHaveLength(5);
    expect(result.current.plan[0].totalSeconds).toBe(6945);
  });

  it("should split lessons across multiple days", () => {
    const { result } = renderHook(() => usePlanBuilder());
    act(() => {
      result.current.buildPlan(lessons, 1);
    });
    expect(result.current.plan).toHaveLength(3);
    expect(result.current.plan[0].day).toBe(1);
    expect(result.current.plan[0].lessons).toHaveLength(3);
    expect(result.current.plan[0].totalSeconds).toBe(2445);
    expect(result.current.plan[1].day).toBe(2);
    expect(result.current.plan[1].lessons).toHaveLength(1);
    expect(result.current.plan[1].totalSeconds).toBe(2700);
    expect(result.current.plan[2].day).toBe(3);
    expect(result.current.plan[2].lessons).toHaveLength(1);
    expect(result.current.plan[2].totalSeconds).toBe(1800);
  });

  it("should handle a lesson longer than daily hours", () => {
    const longLesson: Lesson[] = [
      {
        id: "1",
        title: "Long Lesson",
        duration: "03:00:00",
        section: "Section 1",
      },
      {
        id: "2",
        title: "Short Lesson",
        duration: "00:15:00",
        section: "Section 1",
      },
    ];
    const { result } = renderHook(() => usePlanBuilder());
    act(() => {
      result.current.buildPlan(longLesson, 2);
    });
    expect(result.current.plan).toHaveLength(2);
    expect(result.current.plan[0].day).toBe(1);
    expect(result.current.plan[0].lessons).toHaveLength(1);
    expect(result.current.plan[0].totalSeconds).toBe(10800);
    expect(result.current.plan[1].day).toBe(2);
    expect(result.current.plan[1].lessons).toHaveLength(1);
  });

  it("should update the plan state", () => {
    const { result } = renderHook(() => usePlanBuilder());
    expect(result.current.plan).toEqual([]);
    act(() => {
      result.current.buildPlan(lessons, 1.5);
    });
    expect(result.current.plan).not.toEqual([]);
    expect(result.current.plan).toHaveLength(2);
  });
});
