import type { Lesson } from "../utils";

type Props = {
  lesson: Lesson;
  index: number;
  onRemoveLesson: (id: string) => void;
};

export function LessonItem({ lesson, index, onRemoveLesson }: Props) {
  const { title, duration, id } = lesson;
  return (
    <div className="sections__lesson sections__lesson--with-action">
      <div className="sections__lesson-index">{index + 1}</div>
      <div className="sections__lesson-text">
        <p className="sections__lesson-title">{title}</p>
      </div>
      <span className="sections__duration">{duration}</span>
      <button
        type="button"
        className="sections__action"
        onClick={() => onRemoveLesson(id)}
      >
        Done
      </button>
    </div>
  );
}
