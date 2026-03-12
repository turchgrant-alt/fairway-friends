import { Star, Bookmark, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Course } from '@/lib/mock-data';

interface CourseCardProps {
  course: Course;
  variant?: 'default' | 'compact' | 'wide';
}

export default function CourseCard({ course, variant = 'default' }: CourseCardProps) {
  const navigate = useNavigate();

  if (variant === 'compact') {
    return (
      <button
        onClick={() => navigate(`/course/${course.id}`)}
        className="flex items-center gap-3 rounded-lg bg-card p-3 text-left shadow-sm transition-shadow hover:shadow-md"
      >
        <img
          src={course.imageUrl}
          alt={course.name}
          className="h-16 w-16 rounded-md object-cover"
        />
        <div className="min-w-0 flex-1">
          <h4 className="truncate text-sm font-semibold text-card-foreground">{course.name}</h4>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin size={10} /> {course.location}
          </p>
          <div className="mt-1 flex items-center gap-2">
            <span className="flex items-center gap-0.5 text-xs font-semibold text-gold">
              <Star size={11} fill="currentColor" /> {course.overallRating}
            </span>
            <span className="text-xs text-muted-foreground">{course.type}</span>
            <span className="text-xs text-muted-foreground">{course.priceRange}</span>
          </div>
        </div>
      </button>
    );
  }

  if (variant === 'wide') {
    return (
      <button
        onClick={() => navigate(`/course/${course.id}`)}
        className="group relative w-full overflow-hidden rounded-xl text-left"
      >
        <img
          src={course.imageUrl}
          alt={course.name}
          className="h-48 w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-lg font-semibold text-primary-foreground">{course.name}</h3>
          <p className="flex items-center gap-1 text-sm text-primary-foreground/80">
            <MapPin size={12} /> {course.location}
          </p>
          <div className="mt-2 flex items-center gap-3">
            <span className="flex items-center gap-1 rounded-full bg-gold/90 px-2 py-0.5 text-xs font-bold text-gold-foreground">
              <Star size={10} fill="currentColor" /> {course.overallRating}
            </span>
            <span className="rounded-full bg-primary-foreground/20 px-2 py-0.5 text-xs text-primary-foreground">{course.type}</span>
            <span className="text-xs text-primary-foreground/80">{course.priceRange}</span>
          </div>
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={() => navigate(`/course/${course.id}`)}
      className="group w-full overflow-hidden rounded-xl bg-card text-left shadow-sm transition-shadow hover:shadow-lg"
    >
      <div className="relative">
        <img
          src={course.imageUrl}
          alt={course.name}
          className="h-44 w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute right-3 top-3">
          <button
            onClick={(e) => { e.stopPropagation(); }}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-card/80 backdrop-blur-sm transition-colors hover:bg-card"
          >
            <Bookmark size={16} className="text-card-foreground" />
          </button>
        </div>
        <div className="absolute bottom-3 left-3">
          <span className="flex items-center gap-1 rounded-full bg-gold/90 px-2.5 py-1 text-xs font-bold text-gold-foreground shadow-sm">
            <Star size={11} fill="currentColor" /> {course.overallRating}
          </span>
        </div>
      </div>
      <div className="p-3.5">
        <h3 className="text-[15px] font-semibold leading-tight text-card-foreground">{course.name}</h3>
        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin size={11} /> {course.location}
        </p>
        <div className="mt-2 flex items-center gap-2">
          <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground">{course.type}</span>
          <span className="text-xs text-muted-foreground">{course.priceRange}</span>
          <span className="text-xs text-muted-foreground">·</span>
          <span className="text-xs text-muted-foreground">{course.reviewCount} reviews</span>
        </div>
      </div>
    </button>
  );
}
