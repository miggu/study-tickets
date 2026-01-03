export type Lesson = {
  id: string;
  title: string;
  duration: string;
};

export type Section = {
  title: string;
  timeRequired: string | undefined;
  lessons: Lesson[];
};

export type Course = {
  courseTitle: string | undefined;
  sections: Section[];
};

export type PlanDay = {
  day: number;
  totalSeconds: number;
  lessons: (Lesson & { section: string })[];
};

export type CourseInfo = {
  courseTitle?: string;
  description?: string;
  sectionCount?: number;
  syllabusSections?: Array<{
    name?: string;
    timeRequired?: string;
  }>;
};

export const formatSeconds = (seconds?: number | null) => {
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

export const durationToSeconds = (duration?: string | null): number | null => {
  if (!duration) return null;
  const lower = duration.toLowerCase();
  if (lower.includes("question")) return 0;

  // mm:ss or hh:mm:ss
  const colonParts = duration.split(":").map((p) => Number(p));
  if (
    colonParts.length >= 2 &&
    colonParts.length <= 3 &&
    !colonParts.some((n) => Number.isNaN(n))
  ) {
    if (colonParts.length === 3) {
      return colonParts[0] * 3600 + colonParts[1] * 60 + colonParts[2];
    }
    return colonParts[0] * 60 + colonParts[1];
  }

  const hmsMatch = lower.match(
    /(?:(\d+)\s*h)?\s*(?:(\d+)\s*m)?\s*(?:(\d+)\s*s)?/,
  );
  if (hmsMatch) {
    const h = Number(hmsMatch[1] || 0);
    const m = Number(hmsMatch[2] || 0);
    const s = Number(hmsMatch[3] || 0);
    if (
      !Number.isNaN(h) &&
      !Number.isNaN(m) &&
      !Number.isNaN(s) &&
      (h || m || s)
    ) {
      return h * 3600 + m * 60 + s;
    }
  }

  const asNumber = Number(duration);
  if (!Number.isNaN(asNumber) && asNumber > 0) {
    return asNumber * 60;
  }

  return null;
};

export const normalizeUdemyCourseUrl = (
  input: string,
): { normalizedUrl: string | null; error?: string } => {
  const trimmed = input.trim();
  if (!trimmed) {
    return { normalizedUrl: null, error: "Enter a Udemy course URL." };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { normalizedUrl: null, error: "Enter a valid Udemy course URL." };
  }

  const host = parsed.hostname.toLowerCase();
  if (host !== "www.udemy.com" && host !== "udemy.com") {
    return { normalizedUrl: null, error: "URL must be from udemy.com." };
  }

  const segments = parsed.pathname.split("/").filter(Boolean);
  if (segments.length < 2 || segments[0] !== "course" || !segments[1]) {
    return {
      normalizedUrl: null,
      error: "URL must look like /course/your-slug.",
    };
  }

  const slug = segments[1];
  return { normalizedUrl: `https://www.udemy.com/course/${slug}/` };
};

export const udemyUrlToStorageKey = (url: string) =>
  `udemy-organise.course.${encodeURIComponent(url)}`;
