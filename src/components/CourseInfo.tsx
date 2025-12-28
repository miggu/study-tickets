import type { CourseInfo as CourseInfoType } from "../utils";

type CourseInfoProps = {
  courseInfo: CourseInfoType;
};

export function CourseInfoPanel({
  courseInfo: { name, description, courseTitle, syllabusSections = [] },
}: CourseInfoProps) {
  const sectionLength = syllabusSections.length;
  return (
    <section className="panel">
      <div className="panel__header">
        <div>
          <p className="hero__eyebrow">Course</p>
          <h2>{name ?? "Course info"}</h2>
        </div>
        <span className="pill pill--ghost">
          {sectionLength ? `${sectionLength} sections` : "schema.org"}
        </span>
      </div>
      {description && <p className="course-form__hint">{description}</p>}
      {courseTitle && (
        <p className="course-form__hint">
          Fetched course title: <strong>{courseTitle}</strong>
        </p>
      )}
    </section>
  );
}
