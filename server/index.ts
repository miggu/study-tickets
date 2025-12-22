import express, { type Request, type Response } from 'express'
import fs from 'fs'
import path from 'path'

const PORT = Number(process.env.PORT || process.env.BACKEND_PORT || 3001)
const COUPON_CODE = process.env.COUPON_CODE || 'CM251222G2'

const app = express()
const outputCurriculumPath = path.join(process.cwd(), 'server', 'curriculum.json')

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

    const courseMeta = (await courseMetaResp.json()) as { id?: number }
    const courseId = courseMeta.id
    if (!courseId) {
      res.status(400).send('Course ID not found in course metadata')
      return
    }

    const curriculumUrl = `https://www.udemy.com/api-2.0/course-landing-components/${courseId}/me/?couponCode=${encodeURIComponent(
      COUPON_CODE,
    )}&components=curriculum_context`
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
    fs.writeFile(outputCurriculumPath, JSON.stringify(curriculum, null, 2), (err) => {
      if (err) console.warn('[curriculum] failed to write curriculum.json', err)
    })
    res.json(curriculum)
  } catch (error) {
    console.error('Curriculum fetch failed', target, error)
    res.status(500).send('Failed to fetch curriculum data')
  }
})

app.listen(PORT, () => {
  console.log(`Backend server listening on http://localhost:${PORT}`)
})
