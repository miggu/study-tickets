import type { CourseInfo as CourseInfoType } from "../utils";

type CourseInfoProps = {
  courseInfo: CourseInfoType;
};

export function CourseInfoPanel({ courseInfo }: CourseInfoProps) {
  return (
    <section className="panel">
      <div className="panel__header">
        <div>
          <p className="hero__eyebrow">Course</p>
          <h2>{courseInfo.name ?? "Course info"}</h2>
        </div>
        <span className="pill pill--ghost">
          {courseInfo.syllabusSections?.length
            ? `${courseInfo.syllabusSections.length} sections`
            : "schema.org"}
        </span>
      </div>
      {courseInfo.description && (
        <p className="course-form__hint">{courseInfo.description}</p>
      )}
      {courseInfo.courseTitle && (
        <p className="course-form__hint">
          Fetched course title: <strong>{courseInfo.courseTitle}</strong>
        </p>
      )}
    </section>
  );
}
