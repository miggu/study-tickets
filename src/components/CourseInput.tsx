import { useState } from "react";

type CourseInputProps = {
  loading: boolean;
  status: string;
  error: string | null;
  handleSubmit: (courseUrl: string) => void;
};

export function CourseInput({
  loading,
  status,
  error,
  handleSubmit,
}: CourseInputProps) {
  const [courseUrl, setCourseUrl] = useState("");

  return (
    <>
      <form
        className="course-form"
        onSubmit={(event) => {
          event.preventDefault();
          handleSubmit(courseUrl);
        }}
      >
        <label htmlFor="courseUrl">Course URL</label>
        <div className="course-form__row">
          <input
            id="courseUrl"
            name="courseUrl"
            value={courseUrl}
            onChange={(event) => setCourseUrl(event.target.value)}
            placeholder="https://www.udemy.com/course/your-course"
            aria-label="Course URL"
          />
          <button type="submit" disabled={loading} className="button-primary">
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
