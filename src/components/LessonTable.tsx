import { useEffect, useMemo, useState } from "react";
import { durationToSeconds, type Lesson } from "../utils";
import { SectionBlock, type SectionGroup } from "./SectionBlock";

type Props = {
  lessons: Lesson[];
  onRemoveSection: (title: string) => void;
  onRemoveLesson: (id: string) => void;
};

export function LessonTable({
  lessons,
  onRemoveLesson,
  onRemoveSection,
}: Props) {
  const sectionGroups = useMemo<SectionGroup[]>(() => {
    const map = new Map<string, SectionGroup>();
    lessons.forEach((lesson) => {
      const key = lesson.section || "General";
      const existing = map.get(key) || {
        title: key,
        lessons: [],
        totalSeconds: 0,
      };
      existing.lessons.push(lesson);
      const seconds = durationToSeconds(lesson.duration);
      if (seconds) {
        existing.totalSeconds += seconds;
      }
      map.set(key, existing);
    });
    return Array.from(map.values());
  }, [lessons]);

  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(),
  );

  useEffect(() => {
    if (sectionGroups.length === 0) {
      setExpandedSections(new Set());
      return;
    }
    setExpandedSections(new Set([sectionGroups[0].title]));
  }, [sectionGroups]);

  const toggleSection = (title: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(title)) {
        next.delete(title);
      } else {
        next.add(title);
      }
      return next;
    });
  };

  return (
    <section className="panel panel--table">
      <div className="panel__header">
        <div>
          <p className="hero__eyebrow">Lesson table</p>
          <h2>Episodes & durations</h2>
        </div>
        <span className="pill pill--ghost">
          {lessons.length ? `${lessons.length} items` : "No data yet"}
        </span>
      </div>

      <div className="sections">
        {sectionGroups.map((section, idx) => {
          const isOpen = expandedSections.has(section.title);
          return (
            <SectionBlock
              key={section.title + idx}
              section={section}
              isOpen={isOpen}
              onToggle={toggleSection}
              onRemoveSection={onRemoveSection}
              onRemoveLesson={onRemoveLesson}
            />
          );
        })}
      </div>
    </section>
  );
}
