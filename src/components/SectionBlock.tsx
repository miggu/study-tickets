import { formatSeconds, type Lesson } from "../utils";
import { LessonItem } from "./LessonItem";

export type SectionGroup = {
  title: string;
  lessons: Lesson[];
  totalSeconds: number;
};

type Props = {
  section: SectionGroup;
  isOpen: boolean;
  onToggle: (title: string) => void;
  onRemoveSection: (title: string) => void;
  onRemoveLesson: (id: string) => void;
};

export function SectionBlock({
  section,
  isOpen,
  onToggle,
  onRemoveSection,
  onRemoveLesson,
}: Props) {
  return (
    <div className="sections__block">
      <div className="sections__header">
        <button
          type="button"
          className="sections__toggle"
          onClick={() => onToggle(section.title)}
          aria-expanded={isOpen}
        >
          <span
            className={`sections__arrow ${
              isOpen ? "sections__arrow--open" : ""
            }`}
          >
            ▸
          </span>
          <div className="sections__header-text">
            <p className="sections__title">{section.title}</p>
            <p className="sections__count">{section.lessons.length} items</p>
          </div>
          <span className="sections__duration">
            {formatSeconds(section.totalSeconds) || "—"}
          </span>
        </button>
        <button
          type="button"
          className="sections__action"
          onClick={() => onRemoveSection(section.title)}
        >
          Done
        </button>
      </div>
      {isOpen && (
        <div className="sections__lessons">
          {section.lessons.map((lesson, index) => (
            <LessonItem
              key={lesson.id}
              lesson={lesson}
              index={index}
              onRemoveLesson={onRemoveLesson}
            />
          ))}
        </div>
      )}
    </div>
  );
}
