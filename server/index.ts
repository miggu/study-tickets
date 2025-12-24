import express, { type Request, type Response } from 'express'
const PORT = Number(process.env.PORT || process.env.BACKEND_PORT || 3001)
const app = express()

type Lesson = {
  id: string
  title: string
  duration: string
  section?: string
}

type CourseInfo = {
  name?: string
  courseTitle?: string
  description?: string
  sectionCount?: number
  syllabusSections?: Array<{
    name?: string
    timeRequired?: string
  }>
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

const lessonsFromCurriculum = (
  data: unknown,
  courseTitle?: string,
): { lessons: Lesson[]; courseInfo: CourseInfo | null } => {
  const lessons: Lesson[] = []
  const context =
    (data as { curriculum_context?: { data?: unknown } })?.curriculum_context?.data ||
    (data as { data?: unknown })?.data
  const sections = (context as { sections?: unknown[] } | undefined)?.sections
  if (!Array.isArray(sections)) return { lessons, courseInfo: null }

  const courseInfo: CourseInfo = {
    name: (context as { title?: string } | undefined)?.title || courseTitle,
    courseTitle: courseTitle || (context as { title?: string } | undefined)?.title,
    syllabusSections: [],
    sectionCount: sections.length,
  }

  sections.forEach((section, sectionIndex) => {
    if (!section || typeof section !== 'object') return
    const sec = section as Record<string, unknown>
    const title = (sec.title as string) || (sec.name as string) || `Section ${sectionIndex + 1}`
    courseInfo.syllabusSections?.push({
      name: title,
      timeRequired: formatSeconds((sec.content_length as number) || undefined),
    })
    const items = sec.items as unknown[]
    if (!Array.isArray(items)) return
    items.forEach((item, itemIndex) => {
      if (!item || typeof item !== 'object') return
      const obj = item as Record<string, unknown>
      const itemTitle = (obj.title as string) || (obj.name as string)
      if (!itemTitle) return
      const duration =
        (obj.content_summary as string) ||
        normalizeDuration(undefined, (obj.content_length as number) || undefined) ||
        '—'
      lessons.push({
        id: `${sectionIndex}-${itemIndex}-${itemTitle.trim()}`,
        title: itemTitle.trim(),
        duration,
        section: title?.trim(),
      })
    })
  })

  return { lessons, courseInfo }
}

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ ok: true })
})

app.get('/api/curriculum', async (req: Request, res: Response) => {
  const target = req.query.url
  if (!target || typeof target !== 'string') {
    res.status(400).send('Missing url param')
    return
  }

  try {
    const url = new URL(target)
    const parts = url.pathname.split('/').filter(Boolean)
    const slugIndex = parts.findIndex((p) => p === 'course')
    const slug = slugIndex !== -1 ? parts[slugIndex + 1] : parts[0]

    if (!slug) {
      res.status(400).send('Could not determine course slug from URL')
      return
    }

    const metaUrl = `https://www.udemy.com/api-2.0/courses/${slug}/?fields%5Bcourse%5D=id,title`
    console.log('[curriculum] GET course meta', metaUrl)
    const courseMetaResp = await fetch(metaUrl)
    if (!courseMetaResp.ok) {
      const text = await courseMetaResp.text().catch(() => '')
      console.warn('[curriculum] course id api failed', courseMetaResp.status, text.slice(0, 200))
      res
        .status(courseMetaResp.status)
        .type('text/plain')
        .send(`Failed to resolve course id (${courseMetaResp.status}). ${text.slice(0, 400)}`)
      return
    }

    const courseMeta = (await courseMetaResp.json()) as { id?: number; title?: string }
    const courseId = courseMeta.id
    if (!courseId) {
      res.status(400).send('Course ID not found in course metadata')
      return
    }

    const curriculumUrl = `https://www.udemy.com/api-2.0/course-landing-components/${courseId}/me/?components=curriculum_context`
    console.log('[curriculum] GET curriculum', curriculumUrl)
    const curriculumResp = await fetch(curriculumUrl)
    if (!curriculumResp.ok) {
      const text = await curriculumResp.text().catch(() => '')
      console.warn('[curriculum] curriculum fetch failed', curriculumResp.status, text.slice(0, 200))
      res
        .status(curriculumResp.status)
        .type('text/plain')
        .send(`Failed to fetch curriculum (${curriculumResp.status}). ${text.slice(0, 400)}`)
      return
    }

    const curriculum = await curriculumResp.json()
    const { lessons, courseInfo } = lessonsFromCurriculum(curriculum, courseMeta.title)
    res.json({ lessons, courseInfo })
  } catch (error) {
    console.error('Curriculum fetch failed', target, error)
    res.status(500).send('Failed to fetch curriculum data')
  }
})

app.listen(PORT, () => {
  console.log(`Backend server listening on http://localhost:${PORT}`)
})
