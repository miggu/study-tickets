import { useState, useMemo } from "react";
import {
  normalizeUdemyCourseUrl,
  udemyUrlToStorageKey,
  type Course,
  type CourseInfo,
  type Section,
} from "./utils";
import { LessonTable } from "./components/LessonTable";
import { StudyPlan } from "./components/StudyPlan";
import { HeroHeader } from "./components/HeroHeader";
import { CourseInput } from "./components/CourseInput";
import { CourseInfoPanel } from "./components/CourseInfo";
import { useLocalStorage } from "./hooks/useLocalStorage";
import "./App.css";

const fetchCourse = async (url: string): Promise<Course> => {
  const proxiedUrl = `/api/curriculum?url=${encodeURIComponent(url)}`;
  const response = await fetch(proxiedUrl);
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `Fetching curriculum failed (${response.status}). ${text || ""}`.trim(),
    );
  }
  return response.json();
};

function App() {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>(
    "Ready. Paste a URL and extract.",
  );
  const [courseTitle, setCourseTitle] = useState<string | undefined>();
  const [readStorage, writeStorage] = useLocalStorage();

  const lessons = useMemo(
    () =>
      sections.flatMap((section) =>
        section.lessons.map((lesson) => ({
          ...lesson,
          section: section.title,
        })),
      ),
    [sections],
  );

  const courseInfo: CourseInfo | null = useMemo(() => {
    if (!sections.length) return null;
    return {
      courseTitle,
      sectionCount: sections.length,
      syllabusSections: sections.map((section) => ({
        name: section.title,
        timeRequired: section.timeRequired,
      })),
    };
  }, [courseTitle, sections]);

  const loadCourse = (course: Course, source: "cache" | "api") => {
    setSections(course.sections || []);
    setCourseTitle(course.courseTitle);
    const lessonCount = (course.sections || []).reduce(
      (sum, section) => sum + (section.lessons || []).length,
      0,
    );
    setStatus(
      source === "cache"
        ? `Loaded ${lessonCount} lessons from cache.`
        : `Done. Parsed ${lessonCount} lessons from API.`,
    );
  };

  const handleSubmit = async (courseUrl: string) => {
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

    try {
      const storageKey = udemyUrlToStorageKey(normalizedUrl);
      const cachedCourse = readStorage<Course>(storageKey);
      if (
        cachedCourse &&
        Array.isArray(cachedCourse.sections) &&
        cachedCourse.sections.length > 0
      ) {
        loadCourse(cachedCourse, "cache");
        return;
      }

      const course = await fetchCourse(normalizedUrl);
      if (
        !course ||
        !Array.isArray(course.sections) ||
        !course.sections.length
      ) {
        throw new Error("Course API did not return any sections/items");
      }

      loadCourse(course, "api");
      writeStorage(storageKey, course);
    } catch (err) {
      console.error(err);
      const message =
        err instanceof Error
          ? err.message
          : "Could not read the URL. Try again or check your connection.";
      setError(message);
      setStatus("No lessons found.");
      setSections([]);
    } finally {
      setLoading(false);
    }
  };

  const removeSection = (title: string) => {
    setSections((prev) => prev.filter((section) => section.title !== title));
    setStatus(`Removed section "${title}".`);
  };

  const removeLesson = (id: string) => {
    setSections((prev) =>
      prev
        .map((section) => ({
          ...section,
          lessons: section.lessons.filter((lesson) => lesson.id !== id),
        }))
        .filter((section) => section.lessons.length > 0),
    );
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
        <CourseInput
          loading={loading}
          status={status}
          error={error}
          handleSubmit={handleSubmit}
        />
      </section>

      {courseInfo && <CourseInfoPanel {...courseInfo} />}

      <div className="layout">
        <LessonTable
          key={
            courseTitle ? `lesson-table-${courseTitle}` : "lesson-table-default"
          }
          lessons={lessons}
          onRemoveLesson={removeLesson}
          onRemoveSection={removeSection}
        />
        {lessons.length > 0 && (
          <StudyPlan
            key={
              courseTitle ? `study-plan-${courseTitle}` : "study-plan-default"
            }
            sections={sections}
            loading={loading}
          />
        )}
      </div>
    </div>
  );
}

export default App;
