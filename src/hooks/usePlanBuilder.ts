import { useCallback, useState } from "react";
import { durationToSeconds, type PlanDay, type Section } from "../utils";

export function usePlanBuilder() {
  const [plan, setPlan] = useState<PlanDay[]>([]);

  const buildPlan = useCallback(
    (sections: Section[], dailyHours: number): PlanDay[] => {
      if (!sections.length || !dailyHours || dailyHours <= 0) {
        setPlan([]);
        return [];
      }

      const dailySeconds = Math.round(dailyHours * 3600);
      const days: PlanDay[] = [];
      let current: PlanDay = { day: 1, totalSeconds: 0, lessons: [] };

      sections.forEach((section) => {
        (section.lessons || []).forEach((lesson) => {
          const seconds = durationToSeconds(lesson.duration) ?? 0;
          const willExceed =
            current.totalSeconds + seconds > dailySeconds &&
            current.lessons.length > 0;

          if (willExceed) {
            days.push(current);
            current = { day: current.day + 1, totalSeconds: 0, lessons: [] };
          }
          current.lessons.push({ ...lesson, section: section.title });
          current.totalSeconds += seconds;
        });
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
