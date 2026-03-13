import { ArrowUpRight, MapPin, Star } from "lucide-react";
import { Link } from "react-router-dom";

import type { Course } from "@/lib/course-data";

interface FeaturedCourseCardProps {
  course: Course;
}

export default function FeaturedCourseCard({ course }: FeaturedCourseCardProps) {
  return (
    <Link
      to={`/course/${course.id}`}
      className="group overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.06] shadow-[0_32px_80px_-48px_rgba(0,0,0,0.85)] backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:border-white/20"
    >
      <div className="relative overflow-hidden">
        <img
          src={course.imageUrl}
          alt={course.name}
          className="h-72 w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(7,19,14,0.88)] via-[rgba(7,19,14,0.2)] to-transparent" />
        <div className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full bg-white/[0.14] px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md">
          <Star size={13} className="fill-current text-white" />
          {(course.accessType ?? course.type).replace("-", " ")} course
        </div>
      </div>

      <div className="space-y-4 p-6 text-white">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/[0.52]">
              {course.type} course
            </p>
            <h3 className="mt-2 text-2xl leading-tight">{course.name}</h3>
          </div>
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/[0.12] bg-white/[0.06] text-white/80 transition group-hover:bg-white group-hover:text-[hsl(var(--golfer-deep))]">
            <ArrowUpRight size={18} />
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm text-white/70">
          <MapPin size={15} />
          <span>{course.location}</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {course.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-medium capitalize text-white/[0.78]"
            >
              {tag.replace("-", " ")}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-3 rounded-[22px] border border-white/10 bg-black/10 p-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-white/[0.45]">Access</p>
            <p className="mt-2 text-sm font-medium capitalize text-white">{course.accessType ?? course.type}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-white/[0.45]">Par</p>
            <p className="mt-2 text-sm font-medium text-white">{course.par ?? "Unknown"}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-white/[0.45]">Holes</p>
            <p className="mt-2 text-sm font-medium text-white">{course.holes ?? "Unknown"}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}
