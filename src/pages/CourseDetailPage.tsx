import { useParams, useNavigate } from 'react-router-dom';
import { getCourseById, getReviewsForCourse, users } from '@/lib/mock-data';
import RatingBar from '@/components/RatingBar';
import ReviewCard from '@/components/ReviewCard';
import CourseCard from '@/components/CourseCard';
import { courses } from '@/lib/mock-data';
import { ArrowLeft, Bookmark, Share2, Star, MapPin, DollarSign, Users, Pencil } from 'lucide-react';
import { useState } from 'react';

const ratingLabels: Record<string, string> = {
  layout: 'Layout', conditioning: 'Conditioning', greens: 'Greens', scenery: 'Scenery',
  difficulty: 'Difficulty', paceOfPlay: 'Pace of Play', value: 'Value', replayability: 'Replayability',
  practiceFacilities: 'Practice Facilities', clubhouse: 'Clubhouse', foodDrinks: 'Food & Drinks', overallVibe: 'Overall Vibe',
};

type Tab = 'overview' | 'ratings' | 'reviews' | 'similar';

export default function CourseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('overview');
  const [saved, setSaved] = useState(false);

  const course = getCourseById(id || '');
  const courseReviews = getReviewsForCourse(id || '');

  if (!course) return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <p className="text-muted-foreground">Course not found</p>
    </div>
  );

  const similarCourses = courses.filter(c => c.id !== course.id && c.tags.some(t => course.tags.includes(t))).slice(0, 4);
  const friendsPlayed = users.slice(0, 3);

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'ratings', label: 'Ratings' },
    { key: 'reviews', label: `Reviews (${courseReviews.length})` },
    { key: 'similar', label: 'Similar' },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Hero image */}
      <div className="relative">
        <img src={course.imageUrl} alt={course.name} className="h-64 w-full object-cover sm:h-80" />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/50 to-transparent" />
        <div className="absolute left-0 right-0 top-0 flex items-center justify-between px-4 pt-4">
          <button onClick={() => navigate(-1)} className="flex h-9 w-9 items-center justify-center rounded-full bg-card/70 backdrop-blur-sm">
            <ArrowLeft size={18} className="text-card-foreground" />
          </button>
          <div className="flex gap-2">
            <button onClick={() => setSaved(!saved)} className={`flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-sm ${saved ? 'bg-gold' : 'bg-card/70'}`}>
              <Bookmark size={16} className={saved ? 'text-gold-foreground' : 'text-card-foreground'} fill={saved ? 'currentColor' : 'none'} />
            </button>
            <button className="flex h-9 w-9 items-center justify-center rounded-full bg-card/70 backdrop-blur-sm">
              <Share2 size={16} className="text-card-foreground" />
            </button>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="px-4 pt-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-2xl text-foreground">{course.name}</h1>
            <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin size={13} /> {course.location}
            </p>
          </div>
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1 rounded-xl bg-gold/15 px-3 py-2">
              <Star size={16} className="text-gold" fill="currentColor" />
              <span className="text-lg font-bold text-gold">{course.overallRating}</span>
            </div>
            <span className="mt-0.5 text-[10px] text-muted-foreground">{course.reviewCount} reviews</span>
          </div>
        </div>

        {/* Quick info chips */}
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">{course.type}</span>
          <span className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground">
            <DollarSign size={10} /> {course.priceRange}
          </span>
          {course.tags.map(tag => (
            <span key={tag} className="rounded-full bg-forest-muted px-3 py-1 text-xs font-medium text-forest">{tag}</span>
          ))}
        </div>

        {/* Friends who played */}
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-card p-3 shadow-sm">
          <div className="flex -space-x-2">
            {friendsPlayed.map(u => (
              <img key={u.id} src={u.avatar} alt={u.name} className="h-7 w-7 rounded-full border-2 border-card object-cover" />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">
            <Users size={12} className="mr-1 inline" />
            {friendsPlayed.length} friends have played this course
          </span>
        </div>

        {/* Write review CTA */}
        <button
          onClick={() => navigate(`/review/${course.id}`)}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-primary bg-primary/5 py-3 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
        >
          <Pencil size={14} /> Write a Review
        </button>
      </div>

      {/* Tabs */}
      <div className="mt-5 flex border-b border-border px-4">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`border-b-2 px-3 pb-2.5 text-xs font-medium transition-colors ${
              tab === t.key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="mt-4 px-4">
        {tab === 'overview' && (
          <div className="space-y-4">
            <p className="text-sm leading-relaxed text-muted-foreground">{course.description}</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-card p-3">
                <p className="text-[11px] text-muted-foreground">Designer</p>
                <p className="text-sm font-medium text-card-foreground">{course.designer}</p>
              </div>
              <div className="rounded-lg bg-card p-3">
                <p className="text-[11px] text-muted-foreground">Year Built</p>
                <p className="text-sm font-medium text-card-foreground">{course.yearBuilt}</p>
              </div>
              <div className="rounded-lg bg-card p-3">
                <p className="text-[11px] text-muted-foreground">Par</p>
                <p className="text-sm font-medium text-card-foreground">{course.par}</p>
              </div>
              <div className="rounded-lg bg-card p-3">
                <p className="text-[11px] text-muted-foreground">Yardage</p>
                <p className="text-sm font-medium text-card-foreground">{course.yardage.toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}

        {tab === 'ratings' && (
          <div className="space-y-3">
            {Object.entries(course.ratings).map(([key, val]) => (
              <RatingBar key={key} label={ratingLabels[key] || key} value={val} />
            ))}
          </div>
        )}

        {tab === 'reviews' && (
          <div className="space-y-3">
            {courseReviews.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No reviews yet. Be the first!</p>
            ) : (
              courseReviews.map(r => <ReviewCard key={r.id} review={r} showCourse={false} />)
            )}
          </div>
        )}

        {tab === 'similar' && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {similarCourses.map(c => (
              <CourseCard key={c.id} course={c} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
