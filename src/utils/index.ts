export type Lesson = {
  id: string
  title: string
  duration: string
  section?: string
}

export type CourseSchema = {
  name?: string
  courseTitle?: string
  description?: string
  sectionCount?: number
  syllabusSections?: Array<{
    name?: string
    timeRequired?: string
  }>
}

export const formatSeconds = (seconds?: number | null) => {
  if (seconds === undefined || seconds === null || Number.isNaN(seconds)) return undefined
  const total = Math.max(0, Math.round(seconds))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

export const normalizeDuration = (maybeText?: string, seconds?: number | null) => {
  if (maybeText && maybeText.trim()) return maybeText.trim()
  const formatted = formatSeconds(seconds ?? undefined)
  return formatted || '—'
}

export const durationToSeconds = (duration?: string | null): number | null => {
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
    return asNumber * 60
  }

  return null
}

export const lessonsFromCurriculum = (
  data: unknown,
): { lessons: Lesson[]; courseSchema: CourseSchema | null } => {
  const lessons: Lesson[] = []
  const context =
    (data as { curriculum_context?: { data?: unknown } })?.curriculum_context?.data ||
    (data as { data?: unknown })?.data
  const sections = (context as { sections?: unknown[] } | undefined)?.sections
  const courseTitle = (data as { courseTitle?: string } | undefined)?.courseTitle
  if (!Array.isArray(sections)) return { lessons, courseSchema: null }

  const courseSchema: CourseSchema = {
    name: (context as { title?: string } | undefined)?.title || courseTitle,
    courseTitle: courseTitle || (context as { title?: string } | undefined)?.title,
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

  return { lessons, courseSchema }
}
