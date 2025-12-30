import { formatSeconds, type PlanDay } from "../utils";

type Props = PlanDay;

export function PlanDayCard({ day, totalSeconds, lessons }: Props) {
  return (
    <div className="plan__day">
      <div className="plan__day-header">
        <span className="pill">Day {day}</span>
        <span className="sections__duration">
          {formatSeconds(totalSeconds) || "—"}
        </span>
      </div>
      <div className="plan__day-lessons">
        {lessons.map((lesson, idx) => (
          <div className="sections__lesson" key={lesson.id}>
            <div className="sections__lesson-index">{idx + 1}</div>
            <div className="sections__lesson-text">
              {lesson.section && (
                <p className="sections__title">{lesson.section}</p>
              )}
              <p className="sections__lesson-title">{lesson.title}</p>
            </div>
            <span className="sections__duration">{lesson.duration}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
