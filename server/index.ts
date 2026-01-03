import express, { type Request, type Response } from "express";

const PORT = Number(process.env.PORT || process.env.BACKEND_PORT || 3001);
const app = express();

type LessonDTO = {
  id: string;
  title: string;
  duration: string;
};

type SectionDTO = {
  title: string;
  timeRequired: string | undefined;
  lessons: LessonDTO[];
};

type CourseDataDTO = {
  courseTitle: string | undefined;
  sections: SectionDTO[];
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

const transformCurriculum = (
  data: CurriculumResponse,
  courseTitle?: string,
): CourseDataDTO => {
  const context = data.curriculum_context?.data || data.data;
  const sections = context?.sections || [];

  const transformedSections: SectionDTO[] = sections.map(
    (section, sectionIndex) => {
      const title =
        section.title || section.name || `Section ${sectionIndex + 1}`;
      const items = section.items || [];

      const lessons: LessonDTO[] = items
        .map((item, itemIndex) => {
          const itemTitle = item.title || item.name;
          if (!itemTitle) return null;
          const duration =
            item.content_summary ||
            normalizeDuration(undefined, item.content_length) ||
            "—";
          return {
            id: `${sectionIndex}-${itemIndex}-${itemTitle.trim()}`,
            title: itemTitle.trim(),
            duration,
          };
        })
        .filter((lesson): lesson is LessonDTO => lesson !== null);

      return {
        title,
        timeRequired: formatSeconds(section.content_length),
        lessons,
      };
    },
  );

  return {
    courseTitle,
    sections: transformedSections,
  };
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
        text.slice(0, 200),
      );
      res
        .status(courseMetaResp.status)
        .type("text/plain")
        .send(
          `Failed to resolve course id (${courseMetaResp.status}). ${text.slice(
            0,
            400,
          )}`,
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
        text.slice(0, 200),
      );
      res
        .status(curriculumResp.status)
        .type("text/plain")
        .send(
          `Failed to fetch curriculum (${curriculumResp.status}). ${text.slice(
            0,
            400,
          )}`,
        );
      return;
    }

    const curriculum = (await curriculumResp.json()) as CurriculumResponse;
    const courseData = transformCurriculum(curriculum, courseMeta.title);

    res.json(courseData);
  } catch (error) {
    console.error("Curriculum fetch failed", target, error);
    res.status(500).send("Failed to fetch curriculum data");
  }
});

app.listen(PORT, () => {
  console.log(`Backend server listening on http://localhost:${PORT}`);
});
