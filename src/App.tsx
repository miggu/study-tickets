import type { FormEvent } from "react";
import { useState } from "react";
import {
  lessonsFromCurriculum,
  normalizeUdemyCourseUrl,
  udemyUrlToStorageKey,
  type CourseSchema,
  type Lesson,
} from "./utils";
import { LessonTable } from "./components/LessonTable";
import { StudyPlan } from "./components/StudyPlan";
import { useLocalStorage } from "./hooks/useLocalStorage";
import "./App.css";

type Course = {
  lessons: Lesson[];
  courseInfo: CourseSchema | null;
};
const fetchCurriculumContext = async (url: string) => {
  const proxiedUrl = `/api/curriculum?url=${encodeURIComponent(url)}`;
  const response = await fetch(proxiedUrl);
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `Fetching curriculum failed (${response.status}). ${text || ""}`.trim()
    );
  }
  return response.json();
};

function App() {
  const [courseUrl, setCourseUrl] = useState("");
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>(
    "Ready. Paste a URL and extract."
  );
  const [courseInfo, setCourseInfo] = useState<CourseSchema | null>(null);
  const [readStorage, writeStorage] = useLocalStorage();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const { normalizedUrl, error: urlError } =
      normalizeUdemyCourseUrl(courseUrl);
    if (!normalizedUrl) {
      setError(urlError ?? "Enter a valid Udemy course URL.");
      setStatus("Waiting for a valid course URL.");
      return;
    }

    setError(null);
    setStatus("Fetching curriculum via API…");
    setLoading(true);
    setCourseInfo(null);

    try {
      const storageKey = udemyUrlToStorageKey(normalizedUrl);
      const cachedCourse = readStorage<Course>(storageKey);
      if (
        cachedCourse &&
        Array.isArray(cachedCourse.lessons) &&
        cachedCourse.lessons.length
      ) {
        setLessons(cachedCourse.lessons);
        setCourseInfo(cachedCourse.courseInfo ?? null);
        setStatus(`Loaded ${cachedCourse.lessons.length} lessons from cache.`);
        return;
      }

      const curriculum = await fetchCurriculumContext(normalizedUrl);
      const { lessons: curriculumLessons, courseSchema: curriculumInfo } =
        lessonsFromCurriculum(curriculum);
      if (!curriculumLessons.length) {
        throw new Error("Curriculum API did not return any sections/items");
      }

      setLessons(curriculumLessons);
      setCourseInfo(curriculumInfo);
      writeStorage(storageKey, {
        lessons: curriculumLessons,
        courseInfo: curriculumInfo,
      });
      setStatus(`Done. Parsed ${curriculumLessons.length} lessons from API.`);
    } catch (err) {
      console.error(err);
      const message =
        err instanceof Error
          ? err.message
          : "Could not read the URL. Try again or check your connection.";
      setError(message);
      setStatus("No lessons found.");
      setLessons([]);
    } finally {
      setLoading(false);
    }
  };

  const removeSection = (title: string) => {
    setLessons((prev) => prev.filter((lesson) => lesson.section !== title));
    setStatus(`Removed section "${title}".`);
  };

  const removeLesson = (id: string) => {
    setLessons((prev) => prev.filter((lesson) => lesson.id !== id));
    setStatus("Removed a lesson.");
  };

  return (
    <div className="app">
      <header className="hero">
        <div className="hero__text">
          <p className="hero__eyebrow">Course capture</p>
          <h1>Turn a course URL into a Trello-ready lesson list.</h1>
          <p className="hero__lede">
            Paste a Udemy course and we will parse the curriculum directly from
            the API.
          </p>
        </div>
        <div className="hero__badge">alpha</div>
      </header>

      <section className="panel">
        <form className="course-form" onSubmit={handleSubmit}>
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
            <button type="submit" disabled={loading}>
              {loading ? "Reading…" : "Extract lessons"}
            </button>
          </div>
          <p className="course-form__hint">
            We fetch the curriculum_context from Udemy and list every lecture
            with its duration.
          </p>
        </form>
        <p className={`status ${error ? "status--error" : ""}`}>
          {error ?? status}
        </p>
      </section>

      {courseInfo && (
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
      )}

      <div className="layout">
        <LessonTable
          lessons={lessons}
          onRemoveLesson={removeLesson}
          onRemoveSection={removeSection}
        />

        <StudyPlan
          lessons={lessons}
          loading={loading}
          onPlanMessage={setStatus}
        />
      </div>
    </div>
  );
}

export default App;
