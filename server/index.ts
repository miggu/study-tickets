import express, { type Request, type Response } from "express";
import fs from "node:fs";
import path from "node:path";
import { createTrelloBoardHandler } from "./trello.js";
import {
  type LessonDTO,
  type SectionDTO,
  type CourseDataDTO,
  type CurriculumItem,
  type CurriculumSection,
  type CurriculumResponse,
} from "./types.js";

const PORT = Number(process.env.PORT || process.env.BACKEND_PORT || 3001);
const app = express();
app.use(express.json());

const clientDistPath = path.join(process.cwd(), "dist", "client");
const clientIndexPath = path.join(clientDistPath, "index.html");
const hasClientBuild = fs.existsSync(clientIndexPath);
if (hasClientBuild) {
  app.use(express.static(clientDistPath));
}

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
    (section: CurriculumSection, sectionIndex: number) => {
      const title =
        section.title || section.name || `Section ${sectionIndex + 1}`;
      const items = section.items || [];

      const lessons: LessonDTO[] = items
        .map((item: CurriculumItem, itemIndex: number) => {
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
            section: title, // Add section title here
          };
        })
        .filter(
          (lesson: LessonDTO | null): lesson is LessonDTO => lesson !== null,
        );

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

app.post("/api/trello/create-board", createTrelloBoardHandler);

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
    if (process.env.DEBUG_CURRICULUM === "true")
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
    if (process.env.DEBUG_CURRICULUM === "true")
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
  } catch (error: unknown) {
    console.error("[curriculum] Curriculum fetch failed:", target, error);
    res.status(500).send("Failed to fetch curriculum data");
  }
});

if (hasClientBuild) {
  app.get(/^\/(?!api\/).*/, (_req: Request, res: Response) => {
    res.sendFile(clientIndexPath);
  });
}

app.listen(PORT, () => {
  console.log(`[SERVER] Backend server listening on http://localhost:${PORT}`);
});
