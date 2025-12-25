import type { FormEvent } from "react";
import { useState } from "react";
import {
  normalizeUdemyCourseUrl,
  udemyUrlToStorageKey,
  type Course,
  type CourseInfo,
  type Lesson,
} from "./utils";
import { LessonTable } from "./components/LessonTable";
import { StudyPlan } from "./components/StudyPlan";
import { HeroHeader } from "./components/HeroHeader";
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
  return response.json() as Promise<Course>;
};

function App() {
  const [courseUrl, setCourseUrl] = useState("");
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>(
    "Ready. Paste a URL and extract."
  );
  const [courseInfo, setCourseInfo] = useState<CourseInfo | null>(null);
  const [readStorage, writeStorage] = useLocalStorage();

  const loadCourse = (
    { lessons, courseInfo }: Course,
    source: "cache" | "api"
  ) => {
    setLessons(lessons);
    setCourseInfo(courseInfo ?? null);
    setStatus(
      source === "cache"
        ? `Loaded ${lessons.length} lessons from cache.`
        : `Done. Parsed ${lessons.length} lessons from API.`
    );
  };

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
    setCourseInfo(null);

    try {
      const storageKey = udemyUrlToStorageKey(normalizedUrl);
      const cachedCourse = readStorage<Course>(storageKey);
      if (cachedCourse) {
        const { lessons, courseInfo } = cachedCourse;
        if (Array.isArray(lessons) && lessons.length) {
          loadCourse({ lessons, courseInfo }, "cache");
          return;
        }
        return;
      }

      const { lessons, courseInfo } = await fetchCourse(normalizedUrl);
      if (!lessons.length) {
        throw new Error("Course API did not return any sections/items");
      }

      loadCourse({ lessons, courseInfo }, "api");
      writeStorage(storageKey, {
        lessons,
        courseInfo,
      });
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
      <HeroHeader
        title="Turn a course URL into a Trello-ready lesson list."
        description="Paste a Udemy course and we will parse the curriculum directly from the API."
        badge="alpha"
      />

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
