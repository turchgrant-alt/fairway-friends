import { ArrowUpRight, Globe, MapPin, Star, Trophy } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

import type { CourseListRecord } from '@/lib/course-data';
import CoursePhotoSurface from '@/components/CoursePhotoSurface';
import { useCourseRankings } from '@/hooks/use-course-rankings';
import { getCoursePar, registerCourseCatalogPar } from '@/lib/course-par';

interface CourseCardProps {
  course: CourseListRecord;
  variant?: 'default' | 'compact' | 'wide';
}

export default function CourseCard({ course, variant = 'default' }: CourseCardProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { rankingState } = useCourseRankings();
  const shouldShowPhoto = !location.pathname.startsWith('/map');
  const ratingLabel = course.overallRating != null ? `${course.overallRating}` : 'New';
  registerCourseCatalogPar(course.id, course.par);
  const resolvedPar = getCoursePar(course.id, rankingState);
  const summaryFacts = [
    course.type,
    course.holes != null ? `${course.holes} holes` : null,
    resolvedPar ? `Par ${resolvedPar.par}` : null,
  ].filter(Boolean);
  const top100Badge = course.worldTop100Rank != null ? (
    <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-800">
      <Trophy size={11} /> Top 100 #{course.worldTop100Rank}
    </span>
  ) : null;

  if (variant === 'compact') {
    return (
      <button
        onClick={() => navigate(`/course/${course.id}`)}
        className="flex items-center gap-3 rounded-2xl border border-[hsl(var(--golfer-line))] bg-white p-3 text-left shadow-[0_24px_60px_-48px_rgba(12,25,19,0.4)] transition hover:-translate-y-0.5 hover:shadow-[0_28px_70px_-48px_rgba(12,25,19,0.45)]"
      >
        <CoursePhotoSurface
          courseId={course.id}
          courseName={course.name}
          disablePhoto={!shouldShowPhoto}
          className="h-14 w-14 shrink-0 overflow-hidden rounded-xl"
          imageClassName="h-full w-full rounded-xl object-cover"
          placeholderClassName="h-full w-full rounded-xl bg-[hsl(var(--golfer-cream))]"
        />
        <div className="min-w-0 flex-1">
          <h4 className="truncate text-sm font-semibold text-card-foreground">{course.name}</h4>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin size={10} /> {course.location}
          </p>
          <div className="mt-1.5 flex items-center gap-1.5">
            {top100Badge}
            {course.overallRating != null ? (
              <span className="flex items-center gap-0.5 text-sm font-semibold text-gold">
                <Star size={11} fill="currentColor" /> {ratingLabel}
              </span>
            ) : (
              <span className="rounded-full bg-[hsl(var(--golfer-mist))] px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] text-[hsl(var(--golfer-deep))]">
                Source
              </span>
            )}
            {summaryFacts.slice(0, 2).map((fact) => (
              <span key={fact} className="rounded-full bg-secondary px-2.5 py-1 text-[11px] capitalize text-secondary-foreground">
                {fact}
              </span>
            ))}
          </div>
        </div>
      </button>
    );
  }

  if (variant === 'wide') {
    return (
      <button
        onClick={() => navigate(`/course/${course.id}`)}
        className="group relative w-full overflow-hidden rounded-2xl border border-white/10 text-left shadow-[0_32px_80px_-55px_rgba(0,0,0,0.75)]"
      >
        <CoursePhotoSurface
          courseId={course.id}
          courseName={course.name}
          disablePhoto={!shouldShowPhoto}
          lazy
          className="h-32 w-full overflow-hidden"
          imageClassName="h-32 w-full object-cover transition-transform duration-500 group-hover:scale-105"
          placeholderClassName="h-32 w-full bg-[linear-gradient(135deg,hsl(var(--golfer-cream)),hsl(var(--golfer-mist)))]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          {top100Badge ? <div className="mb-1.5">{top100Badge}</div> : null}
          <h3 className="text-base font-semibold text-primary-foreground">{course.name}</h3>
          <p className="mt-1 flex items-center gap-1 text-xs text-primary-foreground/80">
            <MapPin size={11} /> {course.location}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span className="flex items-center gap-1 rounded-full bg-gold/90 px-2 py-0.5 text-xs font-bold text-gold-foreground">
              <Star size={10} fill="currentColor" /> {ratingLabel}
            </span>
            <span className="rounded-full bg-primary-foreground/20 px-2 py-0.5 text-xs text-primary-foreground">{course.type}</span>
            {course.priceRange ? <span className="text-xs text-primary-foreground/80">{course.priceRange}</span> : null}
          </div>
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={() => navigate(`/course/${course.id}`)}
      className="group w-full overflow-hidden rounded-2xl border border-[hsl(var(--golfer-line))] bg-white text-left shadow-[0_24px_60px_-48px_rgba(12,25,19,0.4)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_32px_80px_-48px_rgba(12,25,19,0.42)]"
    >
      <div className="relative">
        <CoursePhotoSurface
          courseId={course.id}
          courseName={course.name}
          disablePhoto={!shouldShowPhoto}
          className="h-32 w-full overflow-hidden"
          imageClassName="h-32 w-full object-cover transition-transform duration-500 group-hover:scale-105"
          placeholderClassName="h-32 w-full bg-[linear-gradient(135deg,hsl(var(--golfer-cream)),hsl(var(--golfer-mist)))]"
        />
        <div className="absolute right-2 top-2 flex items-center gap-1.5">
          {course.website ? (
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-card/80 backdrop-blur-sm">
              <Globe size={13} className="text-card-foreground" />
            </span>
          ) : null}
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-card/80 backdrop-blur-sm">
            <ArrowUpRight size={14} className="text-card-foreground" />
          </span>
        </div>
        <div className="absolute bottom-3 left-3">
          {course.overallRating != null ? (
            <span className="flex items-center gap-1 rounded-full bg-gold/90 px-3 py-1.5 text-xs font-bold text-gold-foreground shadow-sm">
              <Star size={11} fill="currentColor" /> {ratingLabel}
            </span>
          ) : (
            <span className="rounded-full bg-white/88 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[hsl(var(--golfer-deep))] shadow-sm">
              Catalog record
            </span>
          )}
        </div>
      </div>
      <div className="p-3">
        {top100Badge ? <div className="mb-1.5">{top100Badge}</div> : null}
        <h3 className="text-base font-semibold leading-tight text-card-foreground">{course.name}</h3>
        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin size={11} /> {course.location}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {summaryFacts.map((fact) => (
            <span key={fact} className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium capitalize text-secondary-foreground">
              {fact}
            </span>
          ))}
          <span className="text-sm text-muted-foreground">
            {course.website ? 'Website available' : 'Core source record'}
          </span>
        </div>
      </div>
    </button>
  );
}
