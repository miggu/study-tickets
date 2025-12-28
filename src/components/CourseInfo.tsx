import type { CourseInfo as CourseInfoType } from "../utils";

type CourseInfoProps = CourseInfoType;

export function CourseInfoPanel({
  description,
  courseTitle,
  syllabusSections = [],
}: CourseInfoProps) {
  const sectionLength = syllabusSections.length;
  return (
    <section className="panel">
      <div className="panel__header">
        <div>
          <p className="hero__eyebrow">Course</p>
          <h2>Course info</h2>
        </div>
        <span className="pill pill--ghost">{`${sectionLength} sections`}</span>
      </div>
      <p className="course-form__hint">{description}</p>
      <p className="course-form__hint">
        Fetched course title: <strong>{courseTitle}</strong>
      </p>
    </section>
  );
}
