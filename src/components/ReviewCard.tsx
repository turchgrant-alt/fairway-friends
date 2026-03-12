import { Heart, MessageCircle, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getUserById, getCourseById, type Review } from '@/lib/mock-data';

interface ReviewCardProps {
  review: Review;
  showCourse?: boolean;
}

export default function ReviewCard({ review, showCourse = true }: ReviewCardProps) {
  const navigate = useNavigate();
  const user = getUserById(review.userId);
  const course = getCourseById(review.courseId);
  if (!user || !course) return null;

  return (
    <div className="rounded-[28px] border border-[hsl(var(--golfer-line))] bg-white p-5 shadow-[0_24px_60px_-48px_rgba(12,25,19,0.4)]">
      {/* User header */}
      <div className="flex items-center gap-3">
        <img src={user.avatar} alt={user.name} className="h-11 w-11 rounded-full object-cover" />
        <div className="flex-1">
          <p className="text-base font-semibold text-card-foreground">{user.name}</p>
          <p className="text-xs text-muted-foreground">@{user.username}</p>
        </div>
        <span className="flex items-center gap-1 rounded-full bg-gold/15 px-3 py-1 text-xs font-bold text-gold">
          <Star size={10} fill="currentColor" /> {review.overallRating}
        </span>
      </div>

      {/* Course ref */}
      {showCourse && (
        <button
          onClick={() => navigate(`/course/${course.id}`)}
          className="mt-4 flex items-center gap-3 rounded-[20px] bg-secondary/70 p-3"
        >
          <img src={course.imageUrl} alt={course.name} className="h-12 w-12 rounded-xl object-cover" />
          <div>
            <p className="text-sm font-semibold text-card-foreground">{course.name}</p>
            <p className="text-xs text-muted-foreground">{course.location}</p>
          </div>
        </button>
      )}

      {/* Review content */}
      <h4 className="mt-4 text-base font-semibold text-card-foreground">{review.headline}</h4>
      <p className="mt-2 text-sm leading-7 text-muted-foreground">{review.body}</p>

      {/* Tags */}
      <div className="mt-3 flex flex-wrap gap-2">
        {review.wouldPlayAgain && (
          <span className="rounded-full bg-forest-muted px-3 py-1 text-[11px] font-medium text-forest">Would play again</span>
        )}
        {review.worthThePrice && (
          <span className="rounded-full bg-gold-muted px-3 py-1 text-[11px] font-medium text-gold-foreground">Worth the price</span>
        )}
        {review.bestForTags.map(tag => (
          <span key={tag} className="rounded-full bg-secondary px-3 py-1 text-[11px] font-medium text-muted-foreground">{tag}</span>
        ))}
      </div>

      {/* Actions */}
      <div className="mt-5 flex items-center gap-4 border-t border-border pt-4">
        <button className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-destructive">
          <Heart size={14} /> {review.likesCount}
        </button>
        <button className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary">
          <MessageCircle size={14} /> {review.commentsCount}
        </button>
        <span className="ml-auto text-xs text-muted-foreground">{review.createdAt}</span>
      </div>
    </div>
  );
}
