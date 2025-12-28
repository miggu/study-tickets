import express, { type Request, type Response } from "express";
import { writeFile } from "fs/promises";
const PORT = Number(process.env.PORT || process.env.BACKEND_PORT || 3001);
const app = express();

const dumpJson = async (label: string, data: unknown) => {
  const safeLabel = label.replace(/[^a-z0-9-_]/gi, "_").toLowerCase();
  await writeFile(
    `./dev-untracked/${safeLabel}.json`,
    JSON.stringify(data, null, 2)
  );
};

type Lesson = {
  id: string;
  title: string;
  duration: string;
  section?: string;
};

type CourseInfo = {
  courseTitle?: string;
  description?: string;
  sectionCount?: number;
  syllabusSections?: Array<{
    name?: string;
    timeRequired?: string;
  }>;
};

type CurriculumItem = {
  title?: string;
  name?: string;
  content_summary?: string;
  content_length?: number;
};

type CurriculumSection = {
  title?: string;
  name?: string;
  content_length?: number;
  items?: CurriculumItem[];
};

type CurriculumContext = {
  title?: string;
  sections?: CurriculumSection[];
};

type CurriculumResponse = {
  curriculum_context?: {
    data?: CurriculumContext;
  };
  data?: CurriculumContext;
};

const formatSeconds = (seconds?: number | null) => {
  if (seconds === undefined || seconds === null || Number.isNaN(seconds))
    return undefined;
  const total = Math.max(0, Math.round(seconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0)
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
};

const normalizeDuration = (maybeText?: string, seconds?: number | null) => {
  if (maybeText && maybeText.trim()) return maybeText.trim();
  const formatted = formatSeconds(seconds ?? undefined);
  return formatted || "—";
};

const lessonsFromCurriculum = (
  data: CurriculumResponse,
  courseTitle?: string
): { lessons: Lesson[]; courseInfo: CourseInfo | null } => {
  const lessons: Lesson[] = [];
  const context = data.curriculum_context?.data || data.data;
  const sections = context?.sections;
  if (!Array.isArray(sections)) return { lessons, courseInfo: null };

  const courseInfo: CourseInfo = {
    courseTitle,
    syllabusSections: [],
    sectionCount: sections.length,
  };

  sections.forEach((section, sectionIndex) => {
    const title =
      section.title || section.name || `Section ${sectionIndex + 1}`;
    courseInfo.syllabusSections?.push({
      name: title,
      timeRequired: formatSeconds(section.content_length),
    });
    const items = section.items;
    if (!Array.isArray(items)) return;
    items.forEach((item, itemIndex) => {
      const itemTitle = item.title || item.name;
      if (!itemTitle) return;
      const duration =
        item.content_summary ||
        normalizeDuration(undefined, item.content_length) ||
        "—";
      lessons.push({
        id: `${sectionIndex}-${itemIndex}-${itemTitle.trim()}`,
        title: itemTitle.trim(),
        duration,
        section: title?.trim(),
      });
    });
  });

  return { lessons, courseInfo };
};

app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ ok: true });
});

app.get("/api/curriculum", async (req: Request, res: Response) => {
  const target = req.query.url;
  if (!target || typeof target !== "string") {
    res.status(400).send("Missing url param");
    return;
  }

  try {
    const url = new URL(target);
    const parts = url.pathname.split("/").filter(Boolean);
    const slugIndex = parts.findIndex((p) => p === "course");
    const slug = slugIndex !== -1 ? parts[slugIndex + 1] : parts[0];

    if (!slug) {
      res.status(400).send("Could not determine course slug from URL");
      return;
    }

    const metaUrl = `https://www.udemy.com/api-2.0/courses/${slug}/?fields%5Bcourse%5D=id,title`;
    console.log("[curriculum] GET course meta", metaUrl);
    const courseMetaResp = await fetch(metaUrl);
    if (!courseMetaResp.ok) {
      const text = await courseMetaResp.text().catch(() => "");
      console.warn(
        "[curriculum] course id api failed",
        courseMetaResp.status,
        text.slice(0, 200)
      );
      res
        .status(courseMetaResp.status)
        .type("text/plain")
        .send(
          `Failed to resolve course id (${courseMetaResp.status}). ${text.slice(
            0,
            400
          )}`
        );
      return;
    }

    const courseMeta = (await courseMetaResp.json()) as {
      id?: number;
      title?: string;
    };
    const courseId = courseMeta.id;
    if (!courseId) {
      res.status(400).send("Course ID not found in course metadata");
      return;
    }

    const curriculumUrl = `https://www.udemy.com/api-2.0/course-landing-components/${courseId}/me/?components=curriculum_context`;
    console.log("[curriculum] GET curriculum", curriculumUrl);
    const curriculumResp = await fetch(curriculumUrl);
    if (!curriculumResp.ok) {
      const text = await curriculumResp.text().catch(() => "");
      console.warn(
        "[curriculum] curriculum fetch failed",
        curriculumResp.status,
        text.slice(0, 200)
      );
      res
        .status(curriculumResp.status)
        .type("text/plain")
        .send(
          `Failed to fetch curriculum (${curriculumResp.status}). ${text.slice(
            0,
            400
          )}`
        );
      return;
    }

    const curriculum = (await curriculumResp.json()) as CurriculumResponse;
    await dumpJson("curriculum", curriculum);
    const { lessons, courseInfo } = lessonsFromCurriculum(
      curriculum,
      courseMeta.title
    );
    res.json({ lessons, courseInfo });
  } catch (error) {
    console.error("Curriculum fetch failed", target, error);
    res.status(500).send("Failed to fetch curriculum data");
  }
});

app.listen(PORT, () => {
  console.log(`Backend server listening on http://localhost:${PORT}`);
});
