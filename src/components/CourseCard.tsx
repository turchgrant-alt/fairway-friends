import { Star, Bookmark, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Course } from '@/lib/course-data';

interface CourseCardProps {
  course: Course;
  variant?: 'default' | 'compact' | 'wide';
}

export default function CourseCard({ course, variant = 'default' }: CourseCardProps) {
  const navigate = useNavigate();
  const ratingLabel = course.overallRating != null ? `${course.overallRating}` : 'New';
  const reviewLabel = course.reviewCount > 0 ? `${course.reviewCount} reviews` : 'No reviews yet';

  if (variant === 'compact') {
    return (
      <button
        onClick={() => navigate(`/course/${course.id}`)}
        className="flex items-center gap-4 rounded-[24px] border border-[hsl(var(--golfer-line))] bg-white p-4 text-left shadow-[0_24px_60px_-48px_rgba(12,25,19,0.4)] transition hover:-translate-y-0.5 hover:shadow-[0_28px_70px_-48px_rgba(12,25,19,0.45)]"
      >
        <img
          src={course.imageUrl}
          alt={course.name}
          className="h-20 w-20 rounded-[18px] object-cover"
        />
        <div className="min-w-0 flex-1">
          <h4 className="truncate text-base font-semibold text-card-foreground">{course.name}</h4>
          <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin size={10} /> {course.location}
          </p>
          <div className="mt-3 flex items-center gap-2">
            <span className="flex items-center gap-0.5 text-sm font-semibold text-gold">
              <Star size={11} fill="currentColor" /> {ratingLabel}
            </span>
            <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] capitalize text-secondary-foreground">{course.type}</span>
            {course.priceRange ? <span className="text-sm text-muted-foreground">{course.priceRange}</span> : null}
          </div>
        </div>
      </button>
    );
  }

  if (variant === 'wide') {
    return (
      <button
        onClick={() => navigate(`/course/${course.id}`)}
        className="group relative w-full overflow-hidden rounded-[30px] border border-white/10 text-left shadow-[0_32px_80px_-55px_rgba(0,0,0,0.75)]"
      >
        <img
          src={course.imageUrl}
          alt={course.name}
          className="h-64 w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <h3 className="text-2xl font-semibold text-primary-foreground">{course.name}</h3>
          <p className="mt-2 flex items-center gap-1 text-sm text-primary-foreground/80">
            <MapPin size={12} /> {course.location}
          </p>
          <div className="mt-4 flex items-center gap-3">
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
      className="group w-full overflow-hidden rounded-[28px] border border-[hsl(var(--golfer-line))] bg-white text-left shadow-[0_24px_60px_-48px_rgba(12,25,19,0.4)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_32px_80px_-48px_rgba(12,25,19,0.42)]"
    >
      <div className="relative">
        <img
          src={course.imageUrl}
          alt={course.name}
          className="h-52 w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute right-3 top-3">
          <span
            onClick={(e) => { e.stopPropagation(); }}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-card/80 backdrop-blur-sm transition-colors hover:bg-card"
          >
            <Bookmark size={16} className="text-card-foreground" />
          </span>
        </div>
        <div className="absolute bottom-3 left-3">
          <span className="flex items-center gap-1 rounded-full bg-gold/90 px-3 py-1.5 text-xs font-bold text-gold-foreground shadow-sm">
            <Star size={11} fill="currentColor" /> {ratingLabel}
          </span>
        </div>
      </div>
      <div className="p-5">
        <h3 className="text-lg font-semibold leading-tight text-card-foreground">{course.name}</h3>
        <p className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin size={11} /> {course.location}
        </p>
        <div className="mt-4 flex items-center gap-2">
          <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium capitalize text-secondary-foreground">{course.type}</span>
          {course.priceRange ? (
            <>
              <span className="text-sm text-muted-foreground">{course.priceRange}</span>
              <span className="text-sm text-muted-foreground">·</span>
            </>
          ) : null}
          <span className="text-sm text-muted-foreground">{reviewLabel}</span>
        </div>
      </div>
    </button>
  );
}
