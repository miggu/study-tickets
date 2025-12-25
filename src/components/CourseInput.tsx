import type { FormEventHandler } from "react";

type CourseInputProps = {
  courseUrl: string;
  loading: boolean;
  status: string;
  error: string | null;
  onCourseUrlChange: (value: string) => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
};

export function CourseInput({
  courseUrl,
  loading,
  status,
  error,
  onCourseUrlChange,
  onSubmit,
}: CourseInputProps) {
  return (
    <>
      <form className="course-form" onSubmit={onSubmit}>
        <label htmlFor="courseUrl">Course URL</label>
        <div className="course-form__row">
          <input
            id="courseUrl"
            name="courseUrl"
            value={courseUrl}
            onChange={(event) => onCourseUrlChange(event.target.value)}
            placeholder="https://www.udemy.com/course/your-course"
            aria-label="Course URL"
          />
          <button type="submit" disabled={loading}>
            {loading ? "Reading…" : "Extract lessons"}
          </button>
        </div>
        <p className="course-form__hint">
          We fetch the curriculum_context from Udemy and list every lecture with
          its duration.
        </p>
      </form>
      <p className={`status ${error ? "status--error" : ""}`}>
        {error ?? status}
      </p>
    </>
  );
}
