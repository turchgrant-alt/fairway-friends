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
    <div className="rounded-xl bg-card p-4 shadow-sm">
      {/* User header */}
      <div className="flex items-center gap-3">
        <img src={user.avatar} alt={user.name} className="h-9 w-9 rounded-full object-cover" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-card-foreground">{user.name}</p>
          <p className="text-xs text-muted-foreground">@{user.username}</p>
        </div>
        <span className="flex items-center gap-1 rounded-full bg-gold/15 px-2 py-0.5 text-xs font-bold text-gold">
          <Star size={10} fill="currentColor" /> {review.overallRating}
        </span>
      </div>

      {/* Course ref */}
      {showCourse && (
        <button
          onClick={() => navigate(`/course/${course.id}`)}
          className="mt-3 flex items-center gap-2.5 rounded-lg bg-secondary/60 p-2"
        >
          <img src={course.imageUrl} alt={course.name} className="h-10 w-10 rounded-md object-cover" />
          <div>
            <p className="text-xs font-semibold text-card-foreground">{course.name}</p>
            <p className="text-[11px] text-muted-foreground">{course.location}</p>
          </div>
        </button>
      )}

      {/* Review content */}
      <h4 className="mt-3 text-sm font-semibold text-card-foreground">{review.headline}</h4>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{review.body}</p>

      {/* Tags */}
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {review.wouldPlayAgain && (
          <span className="rounded-full bg-forest-muted px-2 py-0.5 text-[10px] font-medium text-forest">Would play again</span>
        )}
        {review.worthThePrice && (
          <span className="rounded-full bg-gold-muted px-2 py-0.5 text-[10px] font-medium text-gold-foreground">Worth the price</span>
        )}
        {review.bestForTags.map(tag => (
          <span key={tag} className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">{tag}</span>
        ))}
      </div>

      {/* Actions */}
      <div className="mt-3 flex items-center gap-4 border-t border-border pt-3">
        <button className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-destructive">
          <Heart size={14} /> {review.likesCount}
        </button>
        <button className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-primary">
          <MessageCircle size={14} /> {review.commentsCount}
        </button>
        <span className="ml-auto text-[11px] text-muted-foreground">{review.createdAt}</span>
      </div>
    </div>
  );
}
