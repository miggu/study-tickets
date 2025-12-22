import type { FormEvent } from 'react'
import { useMemo, useState } from 'react'
import './App.css'

type Lesson = {
  title: string
  duration: string
  section?: string
}

const sampleLessons: Lesson[] = [
  {
    section: 'Getting Started',
    title: 'Welcome + course overview',
    duration: '03:12',
  },
  {
    section: 'Getting Started',
    title: 'How to navigate this course',
    duration: '04:05',
  },
  {
    section: 'Core Concepts',
    title: 'Building your first Trello board',
    duration: '11:44',
  },
  {
    section: 'Core Concepts',
    title: 'Custom fields for course tracking',
    duration: '09:36',
  },
  {
    section: 'Automation',
    title: 'Add rules with Butler',
    duration: '07:28',
  },
  {
    section: 'Automation',
    title: 'Routing new lessons to Backlog',
    duration: '06:17',
  },
  {
    section: 'Wrap-up',
    title: 'Exporting lessons as CSV',
    duration: '05:09',
  },
]

const simulateExtraction = (url: string) =>
  new Promise<Lesson[]>((resolve) => {
    const delay = 650 + Math.random() * 400
    const hostname = (() => {
      try {
        return new URL(url).hostname
      } catch {
        return url.replace(/^https?:\/\//, '').split(/[/?#]/)[0] || 'course'
      }
    })()

    setTimeout(() => {
      resolve(
        sampleLessons.map((lesson) => ({
          ...lesson,
          // Slightly personalize the section to hint at the source.
          section: lesson.section ?? hostname,
        })),
      )
    }, delay)
  })

function App() {
  const [courseUrl, setCourseUrl] = useState('')
  const [lessons, setLessons] = useState<Lesson[]>(sampleLessons)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hasLessons = useMemo(() => lessons.length > 0, [lessons])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!courseUrl.trim()) {
      setError('Enter a course URL to extract lessons.')
      return
    }

    setError(null)
    setLoading(true)

    try {
      const extracted = await simulateExtraction(courseUrl.trim())
      setLessons(extracted)
    } catch (err) {
      console.error(err)
      setError('Could not read the URL. Try again or check your connection.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-shell">
      <header className="hero">
        <div className="hero__text">
          <p className="eyebrow">Course capture</p>
          <h1>
            Turn a course URL into a Trello-ready lesson list powered by GPT.
          </h1>
          <p className="lede">
            Paste any course page, send it to ChatGPT for reading, and get a
            clean table of episodes with durations you can drop straight into a
            board.
          </p>
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
          <p className="hint">
            This demo mocks the GPT extraction. Replace the handler with your
            API call once ready.
          </p>
        </form>
        {error ? (
          <p className="status status--error">{error}</p>
        ) : (
          <p className="status">Ready. Paste a URL and extract.</p>
        )}
      </section>

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
        <div className="table" role="table" aria-label="Extracted lessons">
          <div className="table__row table__head" role="row">
            <div className="cell" role="columnheader">
              Episode
            </div>
            <div className="cell cell--duration" role="columnheader">
              Duration
            </div>
          </div>
          <div className="table__body">
            {lessons.map((lesson, index) => (
              <div className="table__row" role="row" key={lesson.title + index}>
                <div className="cell cell--primary" role="cell">
                  <span className="pill">{index + 1}</span>
                  <div className="cell__text">
                    {lesson.section && (
                      <p className="section">{lesson.section}</p>
                    )}
                    <p className="title">{lesson.title}</p>
                  </div>
                </div>
                <div className="cell cell--duration" role="cell">
                  <span className="duration">{lesson.duration}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

export default App
