import type { FormEvent } from "react";
import { useState } from "react";
import {
  normalizeUdemyCourseUrl,
  udemyUrlToStorageKey,
  type Course,
  type Lesson,
} from "./utils";
import { LessonTable } from "./components/LessonTable";
import { StudyPlan } from "./components/StudyPlan";
import { useLocalStorage } from "./hooks/useLocalStorage";
import "./App.css";

const fetchCourse = async (url: string) => {
  const proxiedUrl = `/api/curriculum?url=${encodeURIComponent(url)}`;
  const response = await fetch(proxiedUrl);
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `Fetching curriculum failed (${response.status}). ${text || ""}`.trim()
    );
  }
  return response.json() as Promise<{
    lessons: Lesson[];
    course: Course | null;
  }>;
};

function App() {
  const [courseUrl, setCourseUrl] = useState("");
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>(
    "Ready. Paste a URL and extract."
  );
  const [course, setCourse] = useState<Course | null>(null);
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
    setStatus("Fetching course via API…");
    setLoading(true);
    setCourse(null);

    try {
      const storageKey = udemyUrlToStorageKey(normalizedUrl);
      const cachedCourse = readStorage<{
        lessons: Lesson[];
        course: Course | null;
      }>(storageKey);
      if (
        cachedCourse &&
        Array.isArray(cachedCourse.lessons) &&
        cachedCourse.lessons.length
      ) {
        setLessons(cachedCourse.lessons);
        setCourse(cachedCourse.course ?? null);
        setStatus(`Loaded ${cachedCourse.lessons.length} lessons from cache.`);
        return;
      }

      const { lessons: courseLessons, course } =
        await fetchCourse(normalizedUrl);
      if (!courseLessons.length) {
        throw new Error("Course API did not return any sections/items");
      }

      setLessons(courseLessons);
      setCourse(course);
      writeStorage(storageKey, {
        lessons: courseLessons,
        course,
      });
      setStatus(`Done. Parsed ${courseLessons.length} lessons from API.`);
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

      {course && (
        <section className="panel">
          <div className="panel__header">
            <div>
              <p className="hero__eyebrow">Course</p>
              <h2>{course.name ?? "Course info"}</h2>
            </div>
            <span className="pill pill--ghost">
              {course.syllabusSections?.length
                ? `${course.syllabusSections.length} sections`
                : "schema.org"}
            </span>
          </div>
          {course.description && (
            <p className="course-form__hint">{course.description}</p>
          )}
          {course.courseTitle && (
            <p className="course-form__hint">
              Fetched course title: <strong>{course.courseTitle}</strong>
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
