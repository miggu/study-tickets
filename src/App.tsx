import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  durationToSeconds,
  formatSeconds,
  lessonsFromCurriculum,
  type CourseSchema,
  type Lesson,
} from "./utils";
import "./App.css";

type PlanDay = {
  day: number;
  totalSeconds: number;
  lessons: Lesson[];
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
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set()
  );
  const [dailyHours, setDailyHours] = useState<number>(2);
  const [plan, setPlan] = useState<PlanDay[]>([]);
  const hasLessons = useMemo(() => lessons.length > 0, [lessons]);

  const sectionGroups = useMemo(() => {
    const map = new Map<
      string,
      { title: string; lessons: Lesson[]; totalSeconds: number }
    >();
    lessons.forEach((lesson) => {
      const key = lesson.section || "General";
      const existing = map.get(key) || {
        title: key,
        lessons: [],
        totalSeconds: 0,
      };
      existing.lessons.push(lesson);
      const seconds = durationToSeconds(lesson.duration);
      if (seconds) {
        existing.totalSeconds += seconds;
      }
      map.set(key, existing);
    });
    return Array.from(map.values());
  }, [lessons]);

  useEffect(() => {
    if (sectionGroups.length === 0) {
      setExpandedSections(new Set());
      return;
    }
    // Default expand the first section.
    setExpandedSections(new Set([sectionGroups[0].title]));
  }, [sectionGroups]);

  const toggleSection = (title: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(title)) {
        next.delete(title);
      } else {
        next.add(title);
      }
      return next;
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!courseUrl.trim()) {
      setError("Enter a course URL to extract lessons.");
      return;
    }

    setError(null);
    setStatus("Fetching curriculum via API…");
    setLoading(true);
    setCourseInfo(null);

    try {
      const curriculum = await fetchCurriculumContext(courseUrl.trim());
      const { lessons: curriculumLessons, courseSchema: curriculumInfo } =
        lessonsFromCurriculum(curriculum);
      if (!curriculumLessons.length) {
        throw new Error("Curriculum API did not return any sections/items");
      }

      setLessons(curriculumLessons);
      setCourseInfo(curriculumInfo);
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
      setPlan([]);
    } finally {
      setLoading(false);
    }
  };

  const generatePlan = () => {
    if (!lessons.length) {
      setStatus("Import a course first.");
      return;
    }
    if (!dailyHours || dailyHours <= 0) {
      setStatus("Enter daily hours greater than 0.");
      return;
    }

    const dailySeconds = Math.round(dailyHours * 3600);
    const days: PlanDay[] = [];
    let current: PlanDay = { day: 1, totalSeconds: 0, lessons: [] };

    lessons.forEach((lesson) => {
      const seconds = durationToSeconds(lesson.duration) ?? 0;
      const willExceed =
        current.totalSeconds + seconds > dailySeconds &&
        current.lessons.length > 0;
      if (willExceed) {
        days.push(current);
        current = { day: current.day + 1, totalSeconds: 0, lessons: [] };
      }
      current.lessons.push(lesson);
      current.totalSeconds += seconds;
    });

    if (current.lessons.length) {
      days.push(current);
    }

    setPlan(days);
    setStatus(`Built plan over ${days.length} day(s) at ${dailyHours}h/day.`);
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
          <div className="board__header">
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
        <section className="board">
          <div className="board__header">
            <div>
              <p className="hero__eyebrow">Lesson table</p>
              <h2>Episodes & durations</h2>
            </div>
            <span className="pill pill--ghost">
              {hasLessons ? `${lessons.length} items` : "No data yet"}
            </span>
          </div>

          <div className="sections">
            {sectionGroups.map((section, idx) => {
              const isOpen = expandedSections.has(section.title);
              return (
                <div className="sections__block" key={section.title + idx}>
                  <button
                    type="button"
                    className="sections__header"
                    onClick={() => toggleSection(section.title)}
                    aria-expanded={isOpen}
                  >
                    <span
                      className={`sections__arrow ${
                        isOpen ? "sections__arrow--open" : ""
                      }`}
                    >
                      ▸
                    </span>
                    <div className="sections__header-text">
                      <p className="sections__title">{section.title}</p>
                      <p className="sections__count">
                        {section.lessons.length} items
                      </p>
                    </div>
                    <span className="sections__duration">
                      {formatSeconds(section.totalSeconds) || "—"}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="sections__lessons">
                      {section.lessons.map(({ title, duration }, index) => (
                        <div className="sections__lesson" key={title + index}>
                          <div className="sections__lesson-index">
                            {index + 1}
                          </div>
                          <div className="sections__lesson-text">
                            <p className="sections__lesson-title">{title}</p>
                          </div>
                          <span className="sections__duration">{duration}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {hasLessons && (
          <section className="panel">
            <div className="board__header">
              <div>
                <p className="hero__eyebrow">Study plan</p>
                <h2>Split by daily time</h2>
              </div>
            </div>
            <div className="plan__form">
              <label htmlFor="dailyHours">Daily hours</label>
              <div className="plan__input-row">
                <input
                  id="dailyHours"
                  type="number"
                  min="0.25"
                  step="0.25"
                  value={dailyHours}
                  onChange={(e) => setDailyHours(Number(e.target.value))}
                />
                <button type="button" onClick={generatePlan} disabled={loading}>
                  Build plan
                </button>
              </div>
            </div>
            {plan.length > 0 && (
              <div className="plan__list">
                {plan.map((day) => (
                  <div className="plan__day" key={day.day}>
                    <div className="plan__day-header">
                      <span className="pill">Day {day.day}</span>
                      <span className="sections__duration">
                        {formatSeconds(day.totalSeconds) || "—"}
                      </span>
                    </div>
                    <div className="plan__day-lessons">
                      {day.lessons.map((lesson, idx) => (
                        <div
                          className="sections__lesson"
                          key={lesson.title + idx}
                        >
                          <div className="sections__lesson-index">
                            {idx + 1}
                          </div>
                          <div className="sections__lesson-text">
                            {lesson.section && (
                              <p className="sections__title">
                                {lesson.section}
                              </p>
                            )}
                            <p className="sections__lesson-title">
                              {lesson.title}
                            </p>
                          </div>
                          <span className="sections__duration">
                            {lesson.duration}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

export default App;
