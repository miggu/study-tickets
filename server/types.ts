export type LessonDTO = {
  id: string;
  title: string;
  duration: string;
  section: string; // Added section to LessonDTO for convenience
};

export type SectionDTO = {
  title: string;
  timeRequired: string | undefined;
  lessons: LessonDTO[];
};

export type CourseDataDTO = {
  courseTitle: string | undefined;
  sections: SectionDTO[];
};

export type CurriculumItem = {
  title?: string;
  name?: string;
  content_summary?: string;
  content_length?: number;
};

export type CurriculumSection = {
  title?: string;
  name?: string;
  content_length?: number;
  items?: CurriculumItem[];
};

export type CurriculumContext = {
  title?: string;
  sections?: CurriculumSection[];
};

export type CurriculumResponse = {
  curriculum_context?: {
    data?: CurriculumContext;
  };
  data?: CurriculumContext;
};

export type PlanDay = {
  day: number;
  totalSeconds: number;
  lessons: (LessonDTO & { section: string })[];
};

export interface TrelloLabel {
  id: string;
  name: string;
  color: string;
}

export interface TrelloList {
  id: string;
  name: string;
}

