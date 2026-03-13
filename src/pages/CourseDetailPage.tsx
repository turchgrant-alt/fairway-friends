import { useParams, useNavigate } from 'react-router-dom';
import { courses, getCourseById } from '@/lib/course-data';
import { getReviewsForCourse, users } from '@/lib/social-data';
import RatingBar from '@/components/RatingBar';
import ReviewCard from '@/components/ReviewCard';
import CourseCard from '@/components/CourseCard';
import PageHeader from '@/components/dashboard/PageHeader';
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
    <div className="space-y-10">
      <PageHeader
        eyebrow="Course detail"
        title={course.name}
        description={course.location}
        actions={
          <>
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--golfer-line))] bg-white px-4 py-3 text-sm font-medium text-[hsl(var(--golfer-deep))]"
            >
              <ArrowLeft size={16} /> Back
            </button>
            <button
              onClick={() => setSaved(!saved)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-medium ${saved ? 'bg-gold text-gold-foreground' : 'border border-[hsl(var(--golfer-line))] bg-white text-[hsl(var(--golfer-deep))]'}`}
            >
              <Bookmark size={15} fill={saved ? 'currentColor' : 'none'} /> {saved ? 'Saved' : 'Save'}
            </button>
            <button className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--golfer-line))] bg-white px-4 py-3 text-sm font-medium text-[hsl(var(--golfer-deep))]">
              <Share2 size={15} /> Share
            </button>
          </>
        }
      />

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_22rem]">
        <div className="overflow-hidden rounded-[34px] border border-[hsl(var(--golfer-line))] bg-white shadow-[0_32px_90px_-55px_rgba(12,25,19,0.45)]">
          <img src={course.imageUrl} alt={course.name} className="h-[24rem] w-full object-cover sm:h-[28rem]" />
        </div>

        <aside className="space-y-4">
          <div className="rounded-[30px] border border-[hsl(var(--golfer-line))] bg-white p-6 shadow-[0_24px_70px_-48px_rgba(12,25,19,0.35)]">
            {course.overallRating != null ? (
              <div className="flex items-center gap-2 rounded-full bg-gold/15 px-4 py-2 text-gold">
                <Star size={16} fill="currentColor" />
                <span className="text-2xl font-bold">{course.overallRating}</span>
                <span className="text-xs uppercase tracking-[0.18em] text-gold">rating</span>
              </div>
            ) : (
              <div className="rounded-[22px] bg-[hsl(var(--golfer-cream))] px-4 py-3 text-sm text-[hsl(var(--golfer-deep-soft))]">
                No community ratings yet
              </div>
            )}
            <p className="mt-3 text-sm text-muted-foreground">
              {course.reviewCount > 0 ? `${course.reviewCount} reviews` : 'No reviews yet'}
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full bg-secondary px-3 py-1.5 text-xs font-medium capitalize text-secondary-foreground">{course.type}</span>
              {course.priceRange ? (
                <span className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5 text-xs text-secondary-foreground">
                  <DollarSign size={10} /> {course.priceRange}
                </span>
              ) : null}
              {course.tags.map(tag => (
                <span key={tag} className="rounded-full bg-forest-muted px-3 py-1.5 text-xs font-medium text-forest">{tag}</span>
              ))}
            </div>
          </div>

          <div className="rounded-[30px] border border-[hsl(var(--golfer-line))] bg-white p-6 shadow-[0_24px_70px_-48px_rgba(12,25,19,0.35)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[hsl(var(--golfer-deep-soft))]/[0.58]">Friends who played</p>
            <div className="mt-4 flex -space-x-3">
              {friendsPlayed.map(u => (
                <img key={u.id} src={u.avatar} alt={u.name} className="h-10 w-10 rounded-full border-2 border-white object-cover" />
              ))}
            </div>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              <Users size={14} className="mr-1 inline" />
              {friendsPlayed.length} friends have checked in here.
            </p>
          </div>

          <button
            onClick={() => navigate(`/review/${course.id}`)}
            className="flex w-full items-center justify-center gap-2 rounded-[24px] bg-[hsl(var(--golfer-deep))] py-4 text-sm font-medium text-white transition hover:opacity-95"
          >
            <Pencil size={14} /> Write a Review
          </button>
        </aside>
      </section>

      <section className="rounded-[32px] border border-[hsl(var(--golfer-line))] bg-white p-6 shadow-[0_24px_70px_-48px_rgba(12,25,19,0.35)] sm:p-8">
      <div className="flex flex-wrap gap-2">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.key ? 'bg-[hsl(var(--golfer-deep))] text-white' : 'bg-secondary text-muted-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === 'overview' && (
          <div className="space-y-4">
            <p className="max-w-4xl text-sm leading-8 text-muted-foreground">{course.description}</p>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-[24px] bg-[hsl(var(--golfer-cream))] p-5">
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Designer</p>
                <p className="mt-2 text-sm font-medium text-card-foreground">{course.designer ?? 'Unknown'}</p>
              </div>
              <div className="rounded-[24px] bg-[hsl(var(--golfer-cream))] p-5">
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Year Built</p>
                <p className="mt-2 text-sm font-medium text-card-foreground">{course.yearBuilt ?? 'Unknown'}</p>
              </div>
              <div className="rounded-[24px] bg-[hsl(var(--golfer-cream))] p-5">
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Par</p>
                <p className="mt-2 text-sm font-medium text-card-foreground">{course.par ?? 'Unknown'}</p>
              </div>
              <div className="rounded-[24px] bg-[hsl(var(--golfer-cream))] p-5">
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Yardage</p>
                <p className="mt-2 text-sm font-medium text-card-foreground">{course.yardage != null ? course.yardage.toLocaleString() : 'Unknown'}</p>
              </div>
            </div>
          </div>
        )}

        {tab === 'ratings' && (
          Object.keys(course.ratings).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(course.ratings).map(([key, val]) => (
                <RatingBar key={key} label={ratingLabels[key] || key} value={val} />
              ))}
            </div>
          ) : (
            <p className="rounded-[24px] bg-[hsl(var(--golfer-cream))] p-5 text-sm leading-7 text-muted-foreground">
              Source ingestion currently includes real course identity and location data from OpenStreetMap, but not user-generated ratings yet.
            </p>
          )
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
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {similarCourses.map(c => (
              <CourseCard key={c.id} course={c} />
            ))}
          </div>
        )}
      </div>
      </section>
    </div>
  );
}
