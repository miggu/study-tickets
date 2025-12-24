import { useEffect, useState } from "react";
import { usePlanBuilder } from "../hooks/usePlanBuilder";
import { type Lesson } from "../utils";
import { PlanDayCard } from "./PlanDayCard";

type Props = {
  lessons: Lesson[];
  loading?: boolean;
  onPlanMessage?: (message: string) => void;
};

export function StudyPlan({ lessons, loading, onPlanMessage }: Props) {
  const [dailyHours, setDailyHours] = useState<number>(2);
  const { plan, setPlan, buildPlan } = usePlanBuilder();
  const hasLessons = lessons.length > 0;

  console.log(lessons);

  useEffect(() => {
    setPlan([]);
  }, [lessons, setPlan]);

  const generatePlan = () => {
    if (!hasLessons) {
      onPlanMessage?.("Import a course first.");
      return;
    }
    if (!dailyHours || dailyHours <= 0) {
      onPlanMessage?.("Enter daily hours greater than 0.");
      return;
    }

    const days = buildPlan(lessons, dailyHours);
    onPlanMessage?.(
      `Built plan over ${days.length} day(s) at ${dailyHours}h/day.`
    );
  };

  if (!hasLessons) return null;

  return (
    <section className="panel panel--plan">
      <div className="panel__header">
        <div>
          <p className="hero__eyebrow">Study plan</p>
          <h2>Split by daily time</h2>
        </div>
      </div>
      <div className="plan__form">
        <label htmlFor="dailyHours">Daily hours</label>
        <div className="plan__input-row">
          <input
            id="dailyHours"
            type="number"
            min="0.25"
            step="0.25"
            value={dailyHours}
            onChange={(e) => setDailyHours(Number(e.target.value))}
          />
          <button type="button" onClick={generatePlan} disabled={loading}>
            Build plan
          </button>
        </div>
      </div>
      {plan.length > 0 && (
        <div className="plan__list">
          {plan.map((day) => (
            <PlanDayCard day={day} key={day.day} />
          ))}
        </div>
      )}
    </section>
  );
}
