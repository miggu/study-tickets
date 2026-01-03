import { useState } from "react";
import { usePlanBuilder } from "../hooks/usePlanBuilder";
import { type Section } from "../utils";
import { PlanDayCard } from "./PlanDayCard";

type Props = {
  sections: Section[];
  loading?: boolean;
};

export function StudyPlan({ sections, loading }: Props) {
  const [dailyHours, setDailyHours] = useState<number>(2);
  const [planMessage, setPlanMessage] = useState<{
    text: string;
    isError: boolean;
  } | null>(null);
  const { plan, buildPlan } = usePlanBuilder();

  const generatePlan = () => {
    if (dailyHours === 0) {
      setPlanMessage({
        text: "Enter daily hours greater than 0.",
        isError: true,
      });
      return;
    }

    setPlanMessage(null); // Clear any previous error messages

    const days = buildPlan(sections, dailyHours);
    setPlanMessage({
      text: `Built plan over ${days.length} day(s) at ${dailyHours}h/day.`,
      isError: false,
    });
  };

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
  );
}
