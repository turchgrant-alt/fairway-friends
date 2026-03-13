import { MapPin } from 'lucide-react';

import type { Course } from '@/lib/course-data';

interface NewYorkCourseMapProps {
  courses: Course[];
  selectedCourseId: string | null;
  onSelectCourse: (courseId: string) => void;
}

interface Bounds {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
}

function hasCoordinates(course: Course) {
  return course.latitude != null && course.longitude != null;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function buildBounds(courses: Course[]): Bounds {
  const mappableCourses = courses.filter(hasCoordinates);

  if (mappableCourses.length === 0) {
    return {
      minLat: 40.45,
      maxLat: 45.15,
      minLon: -79.95,
      maxLon: -71.55,
    };
  }

  const latitudes = mappableCourses.map((course) => course.latitude as number);
  const longitudes = mappableCourses.map((course) => course.longitude as number);

  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLon = Math.min(...longitudes);
  const maxLon = Math.max(...longitudes);

  const latPadding = Math.max((maxLat - minLat) * 0.12, 0.25);
  const lonPadding = Math.max((maxLon - minLon) * 0.12, 0.35);

  return {
    minLat: minLat - latPadding,
    maxLat: maxLat + latPadding,
    minLon: minLon - lonPadding,
    maxLon: maxLon + lonPadding,
  };
}

function projectCourse(course: Course, bounds: Bounds) {
  const latitude = course.latitude as number;
  const longitude = course.longitude as number;
  const x = ((longitude - bounds.minLon) / (bounds.maxLon - bounds.minLon)) * 100;
  const y = ((bounds.maxLat - latitude) / (bounds.maxLat - bounds.minLat)) * 100;

  return {
    left: clamp(x, 2, 98),
    top: clamp(y, 2, 98),
  };
}

export default function NewYorkCourseMap({
  courses,
  selectedCourseId,
  onSelectCourse,
}: NewYorkCourseMapProps) {
  const mappableCourses = courses.filter(hasCoordinates);
  const bounds = buildBounds(mappableCourses);
  const embedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bounds.minLon}%2C${bounds.minLat}%2C${bounds.maxLon}%2C${bounds.maxLat}&layer=mapnik`;

  if (mappableCourses.length === 0) {
    return (
      <div className="flex h-full items-center justify-center bg-[hsl(var(--golfer-mist))] p-6 text-center text-sm leading-7 text-[hsl(var(--golfer-deep-soft))]/[0.78]">
        No course coordinates are available for the current selection.
      </div>
    );
  }

  return (
    <div className="absolute inset-0 overflow-hidden bg-[hsl(var(--golfer-mist))]">
      <iframe
        title="GolfeR New York course map"
        src={embedUrl}
        className="absolute inset-0 h-full w-full border-0 pointer-events-none"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />

      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(9,28,20,0.05),rgba(9,28,20,0.14))]" />

      {mappableCourses.map((course) => {
        const position = projectCourse(course, bounds);
        const active = course.id === selectedCourseId;

        return (
          <button
            key={course.id}
            onClick={() => onSelectCourse(course.id)}
            className="absolute z-10 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center transition-transform"
            style={{ left: `${position.left}%`, top: `${position.top}%` }}
            aria-label={`Select ${course.name}`}
          >
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-full border shadow-lg transition ${
                active
                  ? 'scale-125 border-white bg-[hsl(var(--accent))] text-[hsl(var(--golfer-deep))]'
                  : 'border-white/70 bg-[hsl(var(--golfer-deep))] text-white hover:scale-110'
              }`}
            >
              <MapPin size={14} fill="currentColor" />
            </div>
          </button>
        );
      })}
    </div>
  );
}
