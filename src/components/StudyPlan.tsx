import { useEffect, useState } from "react";
import { usePlanBuilder } from "../hooks/usePlanBuilder";
import { type Lesson } from "../utils";
import { PlanDayCard } from "./PlanDayCard";

type Props = {
  lessons: Lesson[];
  loading?: boolean;
};

export function StudyPlan({ lessons, loading }: Props) {
  const [dailyHours, setDailyHours] = useState<number>(2);
  const [planMessage, setPlanMessage] = useState<{
    text: string;
    isError: boolean;
  } | null>(null);
  const { plan, setPlan, buildPlan } = usePlanBuilder();
  const hasLessons = lessons.length > 0;

  useEffect(() => {
    setPlan([]);
    setPlanMessage(null);
  }, [lessons, setPlan]);

  const generatePlan = () => {
    if (!dailyHours || dailyHours <= 0) {
      setPlanMessage({
        text: "Enter daily hours greater than 0.",
        isError: true,
      });
      return;
    }

    const days = buildPlan(lessons, dailyHours);
    setPlanMessage({
      text: `Built plan over ${days.length} day(s) at ${dailyHours}h/day.`,
      isError: false,
    });
  };

  return hasLessons ? (
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
            onChange={(e) => {
              const nextValue = Number(e.target.value);
              setDailyHours(nextValue);
              if (planMessage?.isError && nextValue > 0) {
                setPlanMessage(null);
              }
            }}
          />
          <button type="button" onClick={generatePlan} disabled={loading}>
            Build plan
          </button>
        </div>
        {planMessage && (
          <p
            className={`plan__message ${
              planMessage.isError ? "plan__message--error" : ""
            }`}
            role={planMessage.isError ? "alert" : undefined}
          >
            {planMessage.text}
          </p>
        )}
      </div>
      {plan.length > 0 && (
        <div className="plan__list">
          {plan.map((day) => (
            <PlanDayCard {...day} key={day.day} />
          ))}
        </div>
      )}
    </section>
  ) : null;
}
