import { useCallback, useState } from "react";
import { durationToSeconds, type Lesson, type PlanDay } from "../utils";

export function usePlanBuilder() {
  const [plan, setPlan] = useState<PlanDay[]>([]);

  const buildPlan = useCallback(
    (lessons: Lesson[], dailyHours: number): PlanDay[] => {
      if (!lessons.length || !dailyHours || dailyHours <= 0) {
        setPlan([]);
        return [];
      }

      const dailySeconds = Math.round(dailyHours * 3600);
      const days: PlanDay[] = [];
      let current: PlanDay = { day: 1, totalSeconds: 0, lessons: [] };

      lessons.forEach((lesson) => {
        const seconds = durationToSeconds(lesson.duration) ?? 0;
        const willExceed =
          current.totalSeconds + seconds > dailySeconds &&
          current.lessons.length > 0;

        if (willExceed) {
          days.push(current);
          current = { day: current.day + 1, totalSeconds: 0, lessons: [] };
        }
        current.lessons.push(lesson);
        current.totalSeconds += seconds;
      });

      if (current.lessons.length) {
        days.push(current);
      }

      setPlan(days);
      return days;
    },
    [],
  );

  return { plan, setPlan, buildPlan };
}
