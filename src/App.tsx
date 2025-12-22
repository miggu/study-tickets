import type { FormEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import './App.css'

type Lesson = {
  title: string
  duration: string
  section?: string
}

type CourseSchema = {
  name?: string
  description?: string
  sectionCount?: number
  syllabusSections?: Array<{
    name?: string
    timeRequired?: string
  }>
}

type PlanDay = {
  day: number
  totalSeconds: number
  lessons: Lesson[]
}

const fetchCurriculumContext = async (url: string) => {
  const proxiedUrl = `/api/curriculum?url=${encodeURIComponent(url)}`
  const response = await fetch(proxiedUrl)
  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(
      `Fetching curriculum failed (${response.status}). ${text || ''}`.trim(),
    )
  }
  return response.json()
}

const formatSeconds = (seconds?: number | null) => {
  if (seconds === undefined || seconds === null || Number.isNaN(seconds)) return undefined
  const total = Math.max(0, Math.round(seconds))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

const normalizeDuration = (maybeText?: string, seconds?: number | null) => {
  if (maybeText && maybeText.trim()) return maybeText.trim()
  const formatted = formatSeconds(seconds ?? undefined)
  return formatted || '—'
}

const durationToSeconds = (duration?: string | null): number | null => {
  if (!duration) return null
  const lower = duration.toLowerCase()
  if (lower.includes('question')) return 0

  // mm:ss or hh:mm:ss
  const colonParts = duration.split(':').map((p) => Number(p))
  if (colonParts.length >= 2 && colonParts.length <= 3 && !colonParts.some((n) => Number.isNaN(n))) {
    if (colonParts.length === 3) {
      return colonParts[0] * 3600 + colonParts[1] * 60 + colonParts[2]
    }
    return colonParts[0] * 60 + colonParts[1]
  }

  const hmsMatch = lower.match(/(?:(\d+)\s*h)?\s*(?:(\d+)\s*m)?\s*(?:(\d+)\s*s)?/)
  if (hmsMatch) {
    const h = Number(hmsMatch[1] || 0)
    const m = Number(hmsMatch[2] || 0)
    const s = Number(hmsMatch[3] || 0)
    if (!Number.isNaN(h) && !Number.isNaN(m) && !Number.isNaN(s) && (h || m || s)) {
      return h * 3600 + m * 60 + s
    }
  }

  const asNumber = Number(duration)
  if (!Number.isNaN(asNumber) && asNumber > 0) {
    // Treat bare numbers as minutes.
    return asNumber * 60
  }

  return null
}

const lessonsFromCurriculum = (data: unknown): { lessons: Lesson[]; courseSchema: CourseSchema | null } => {
  const lessons: Lesson[] = []
  const context =
    (data as { curriculum_context?: { data?: unknown } })?.curriculum_context?.data ||
    (data as { data?: unknown })?.data
  const sections = (context as { sections?: unknown[] } | undefined)?.sections
  if (!Array.isArray(sections)) return { lessons, courseSchema: null }

  const courseSchema: CourseSchema = {
    name: (context as { title?: string } | undefined)?.title,
    syllabusSections: [],
    sectionCount: sections.length,
  }

  sections.forEach((section, sectionIndex) => {
    if (!section || typeof section !== 'object') return
    const sec = section as Record<string, unknown>
    const title = (sec.title as string) || (sec.name as string) || `Section ${sectionIndex + 1}`
    courseSchema.syllabusSections?.push({
      name: title,
      timeRequired: formatSeconds((sec.content_length as number) || undefined),
    })
    const items = sec.items as unknown[]
    if (!Array.isArray(items)) return
    items.forEach((item) => {
      if (!item || typeof item !== 'object') return
      const obj = item as Record<string, unknown>
      const itemTitle = (obj.title as string) || (obj.name as string)
      if (!itemTitle) return
      const duration =
        (obj.content_summary as string) ||
        normalizeDuration(undefined, (obj.content_length as number) || undefined) ||
        '—'
      lessons.push({
        title: itemTitle.trim(),
        duration,
        section: title?.trim(),
      })
    })
  })

  return { lessons, courseSchema }
}

function App() {
  const [courseUrl, setCourseUrl] = useState('')
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string>('Ready. Paste a URL and extract.')
  const [courseInfo, setCourseInfo] = useState<CourseSchema | null>(null)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const [dailyHours, setDailyHours] = useState<number>(2)
  const [plan, setPlan] = useState<PlanDay[]>([])
  const hasLessons = useMemo(() => lessons.length > 0, [lessons])

  const sectionGroups = useMemo(() => {
    const map = new Map<string, { title: string; lessons: Lesson[]; totalSeconds: number }>()
    lessons.forEach((lesson) => {
      const key = lesson.section || 'General'
      const existing = map.get(key) || { title: key, lessons: [], totalSeconds: 0 }
      existing.lessons.push(lesson)
      const seconds = durationToSeconds(lesson.duration)
      if (seconds) {
        existing.totalSeconds += seconds
      }
      map.set(key, existing)
    })
    return Array.from(map.values())
  }, [lessons])

  useEffect(() => {
    if (sectionGroups.length === 0) {
      setExpandedSections(new Set())
      return
    }
    // Default expand the first section.
    setExpandedSections(new Set([sectionGroups[0].title]))
  }, [sectionGroups])

  const toggleSection = (title: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev)
      if (next.has(title)) {
        next.delete(title)
      } else {
        next.add(title)
      }
      return next
    })
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!courseUrl.trim()) {
      setError('Enter a course URL to extract lessons.')
      return
    }

    setError(null)
    setStatus('Fetching curriculum via API…')
    setLoading(true)
    setCourseInfo(null)

    try {
      const curriculum = await fetchCurriculumContext(courseUrl.trim())
      const { lessons: curriculumLessons, courseSchema: curriculumInfo } = lessonsFromCurriculum(curriculum)
      if (!curriculumLessons.length) {
        throw new Error('Curriculum API did not return any sections/items')
      }

      setLessons(curriculumLessons)
      setCourseInfo(curriculumInfo)
      setStatus(`Done. Parsed ${curriculumLessons.length} lessons from API.`)
    } catch (err) {
      console.error(err)
      const message =
        err instanceof Error
          ? err.message
          : 'Could not read the URL. Try again or check your connection.'
      setError(message)
      setStatus('No lessons found.')
      setLessons([])
      setPlan([])
    } finally {
      setLoading(false)
    }
  }

  const generatePlan = () => {
    if (!lessons.length) {
      setStatus('Import a course first.')
      return
    }
    if (!dailyHours || dailyHours <= 0) {
      setStatus('Enter daily hours greater than 0.')
      return
    }

    const dailySeconds = Math.round(dailyHours * 3600)
    const days: PlanDay[] = []
    let current: PlanDay = { day: 1, totalSeconds: 0, lessons: [] }

    lessons.forEach((lesson) => {
      const seconds = durationToSeconds(lesson.duration) ?? 0
      const willExceed = current.totalSeconds + seconds > dailySeconds && current.lessons.length > 0
      if (willExceed) {
        days.push(current)
        current = { day: current.day + 1, totalSeconds: 0, lessons: [] }
      }
      current.lessons.push(lesson)
      current.totalSeconds += seconds
    })

    if (current.lessons.length) {
      days.push(current)
    }

    setPlan(days)
    setStatus(`Built plan over ${days.length} day(s) at ${dailyHours}h/day.`)
  }

  return (
    <div className="app-shell">
      <header className="hero">
        <div className="hero__text">
          <p className="eyebrow">Course capture</p>
          <h1>Turn a course URL into a Trello-ready lesson list.</h1>
          <p className="lede">Paste a Udemy course and we will parse the curriculum directly from the API.</p>
        </div>
        <div className="hero__badge">alpha</div>
      </header>

      <section className="panel">
        <form className="url-form" onSubmit={handleSubmit}>
          <label htmlFor="courseUrl">Course URL</label>
          <div className="url-form__row">
            <input
              id="courseUrl"
              name="courseUrl"
              value={courseUrl}
              onChange={(event) => setCourseUrl(event.target.value)}
              placeholder="https://www.udemy.com/course/your-course"
              aria-label="Course URL"
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Reading…' : 'Extract lessons'}
            </button>
          </div>
          <p className="hint">We fetch the curriculum_context from Udemy and list every lecture with its duration.</p>
        </form>
        <p className={`status ${error ? 'status--error' : ''}`}>
          {error ?? status}
        </p>
      </section>

      {courseInfo && (
        <section className="panel">
          <div className="board__header">
            <div>
              <p className="eyebrow">Course</p>
              <h2>{courseInfo.name ?? 'Course info'}</h2>
            </div>
            <span className="pill pill--ghost">
              {courseInfo.syllabusSections?.length
                ? `${courseInfo.syllabusSections.length} sections`
                : 'schema.org'}
            </span>
          </div>
          {courseInfo.description && <p className="hint">{courseInfo.description}</p>}
        </section>
      )}

      <section className="board">
        <div className="board__header">
          <div>
            <p className="eyebrow">Lesson table</p>
            <h2>Episodes & durations</h2>
          </div>
          <span className="pill pill--ghost">
            {hasLessons ? `${lessons.length} items` : 'No data yet'}
          </span>
        </div>

        <div className="sections">
          {sectionGroups.map((section, idx) => {
            const isOpen = expandedSections.has(section.title)
            return (
              <div className="section-block" key={section.title + idx}>
                <button
                  type="button"
                  className="section-header"
                  onClick={() => toggleSection(section.title)}
                  aria-expanded={isOpen}
                >
                  <span className={`arrow ${isOpen ? 'arrow--open' : ''}`}>▸</span>
                  <div className="section-header__text">
                    <p className="section">{section.title}</p>
                    <p className="title">{section.lessons.length} items</p>
                  </div>
                  <span className="duration">
                    {formatSeconds(section.totalSeconds) || '—'}
                  </span>
                </button>
                {isOpen && (
                  <div className="lessons-list">
                    {section.lessons.map((lesson, index) => (
                      <div className="lesson-row" key={lesson.title + index}>
                        <div className="lesson-index">{index + 1}</div>
                        <div className="lesson-text">
                          <p className="title">{lesson.title}</p>
                        </div>
                        <span className="duration">{lesson.duration}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {hasLessons && (
        <section className="panel">
          <div className="board__header">
            <div>
              <p className="eyebrow">Study plan</p>
              <h2>Split by daily time</h2>
            </div>
          </div>
          <div className="plan-form">
            <label htmlFor="dailyHours">Daily hours</label>
            <div className="plan-input-row">
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
            <div className="plan-list">
              {plan.map((day) => (
                <div className="plan-day" key={day.day}>
                  <div className="plan-day__header">
                    <span className="pill">Day {day.day}</span>
                    <span className="duration">{formatSeconds(day.totalSeconds) || '—'}</span>
                  </div>
                  <div className="plan-day__lessons">
                    {day.lessons.map((lesson, idx) => (
                      <div className="lesson-row" key={lesson.title + idx}>
                        <div className="lesson-index">{idx + 1}</div>
                        <div className="lesson-text">
                          {lesson.section && <p className="section">{lesson.section}</p>}
                          <p className="title">{lesson.title}</p>
                        </div>
                        <span className="duration">{lesson.duration}</span>
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
  )
}

export default App
