import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Database, Globe, MapPin, RotateCcw, Star } from 'lucide-react';

import CourseCard from '@/components/CourseCard';
import PageHeader from '@/components/dashboard/PageHeader';
import PlayedCourseDialog from '@/components/rankings/PlayedCourseDialog';
import { useCourseRecord, useStateCourseCatalog } from '@/hooks/use-course-catalog';
import { useCourseRankings } from '@/hooks/use-course-rankings';
import { formatDemoDate } from '@/lib/demo-v1';

type Tab = 'overview' | 'source' | 'nearby';

export default function CourseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('overview');
  const [isPlayedDialogOpen, setIsPlayedDialogOpen] = useState(false);
  const [playedDialogMode, setPlayedDialogMode] = useState<'play' | 'rerank'>('play');
  const { data: course, isLoading } = useCourseRecord(id);
  const { data: stateCourseCatalog = [] } = useStateCourseCatalog(course?.stateCode);
  const {
    getCourseRankingRecord,
    getCourseNumericRating,
    hasTrueRankingThreshold,
    markPlayedCourse,
  } = useCourseRankings();
  const nearbyCourses = useMemo(() => {
    if (!course) return [];

    return stateCourseCatalog
      .filter((candidate) => {
        if (candidate.id === course.id) return false;
        if (course.city && candidate.city === course.city) return true;
        return candidate.tags.some((tag) => course.tags.includes(tag));
      })
      .slice(0, 6);
  }, [course, stateCourseCatalog]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading course record...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Course not found</p>
      </div>
    );
  }

  const courseRanking = getCourseRankingRecord(course.id);
  const courseNumericRating = getCourseNumericRating(course.id);
  const isPlayed = Boolean(courseRanking);

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'source', label: 'Source' },
    { key: 'nearby', label: 'Nearby' },
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
            {course.website ? (
              <a
                href={course.website}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-[hsl(var(--golfer-deep))] px-4 py-3 text-sm font-medium text-white"
              >
                <Globe size={15} /> Visit website
              </a>
            ) : null}
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
                Real source record with no user-rating layer in demo mode
              </div>
            )}

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full bg-secondary px-3 py-1.5 text-xs font-medium capitalize text-secondary-foreground">{course.type}</span>
              {course.holes != null ? <span className="rounded-full bg-secondary px-3 py-1.5 text-xs text-secondary-foreground">{course.holes} holes</span> : null}
              {course.par != null ? <span className="rounded-full bg-secondary px-3 py-1.5 text-xs text-secondary-foreground">Par {course.par}</span> : null}
              {course.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-forest-muted px-3 py-1.5 text-xs font-medium text-forest">{tag}</span>
              ))}
            </div>
          </div>

          <div className="rounded-[30px] border border-[hsl(var(--golfer-line))] bg-white p-6 shadow-[0_24px_70px_-48px_rgba(12,25,19,0.35)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[hsl(var(--golfer-deep-soft))]/[0.58]">Core metadata</p>
            <div className="mt-4 space-y-3 text-sm text-muted-foreground">
              <p className="flex items-center gap-2"><MapPin size={14} /> {course.addressLabel ?? course.location}</p>
              <p className="flex items-center gap-2"><Database size={14} /> {course.source} / {course.sourceId}</p>
              <p className="flex items-center gap-2"><Star size={14} /> Last synced {formatDemoDate(course.lastSyncedAt)}</p>
            </div>
          </div>

          {!isPlayed ? (
            <button
              onClick={() => {
                setPlayedDialogMode('play');
                setIsPlayedDialogOpen(true);
              }}
              className="flex w-full items-center justify-center gap-2 rounded-[24px] border border-[hsl(var(--golfer-line))] bg-[hsl(var(--golfer-cream))] py-4 text-sm font-medium text-[hsl(var(--golfer-deep))] transition hover:bg-[hsl(var(--golfer-mist))]"
            >
              <CheckCircle2 size={14} /> Played this course
            </button>
          ) : (
            <div className="rounded-[24px] border border-[hsl(var(--golfer-line))] bg-[hsl(var(--golfer-cream))] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[hsl(var(--golfer-deep-soft))]/[0.56]">
                Played locally
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[20px] bg-white/80 p-4">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[hsl(var(--golfer-deep-soft))]/[0.56]">Bucket</p>
                  <p className="mt-2 text-base capitalize text-[hsl(var(--golfer-deep))]">{courseRanking?.bucket ?? 'Unknown'}</p>
                </div>
                <div className="rounded-[20px] bg-white/80 p-4">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[hsl(var(--golfer-deep-soft))]/[0.56]">
                    {hasTrueRankingThreshold ? 'Numeric rating' : 'Ranking stage'}
                  </p>
                  <p className="mt-2 text-base text-[hsl(var(--golfer-deep))]">
                    {hasTrueRankingThreshold
                      ? courseNumericRating != null
                        ? courseNumericRating.toFixed(1)
                        : 'Unranked'
                      : 'Early list'}
                  </p>
                </div>
                <div className="rounded-[20px] bg-white/80 p-4">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[hsl(var(--golfer-deep-soft))]/[0.56]">Bucket position</p>
                  <p className="mt-2 text-base text-[hsl(var(--golfer-deep))]">
                    {courseRanking?.bucketOrder ? `#${courseRanking.bucketOrder} in ${courseRanking.bucket}` : 'Unknown'}
                  </p>
                </div>
                <div className="rounded-[20px] bg-white/80 p-4">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[hsl(var(--golfer-deep-soft))]/[0.56]">Play count</p>
                  <p className="mt-2 text-base text-[hsl(var(--golfer-deep))]">
                    {courseRanking?.playCount ?? 0} time{courseRanking?.playCount === 1 ? '' : 's'}
                  </p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-7 text-[hsl(var(--golfer-deep-soft))]/[0.74]">
                {hasTrueRankingThreshold
                  ? `Numeric rating follows the current Profile order and bucket score band. `
                  : 'Numeric rating unlocks after 5 ranked courses. '}
                Last played {courseRanking?.lastPlayedAt ? formatDemoDate(courseRanking.lastPlayedAt) : 'not recorded yet'}.
              </p>
              <div className="mt-5 flex flex-col gap-3">
                <button
                  onClick={() => {
                    setPlayedDialogMode('rerank');
                    setIsPlayedDialogOpen(true);
                  }}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-[20px] border border-[hsl(var(--golfer-line))] bg-white px-4 py-3 text-sm font-medium text-[hsl(var(--golfer-deep))]"
                >
                  <RotateCcw size={14} /> Rerank
                </button>
                <button
                  onClick={() => markPlayedCourse({ courseId: course.id })}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-[20px] bg-[hsl(var(--golfer-deep))] px-4 py-3 text-sm font-medium text-white"
                >
                  <CheckCircle2 size={14} /> Played again
                </button>
              </div>
            </div>
          )}

          <button
            onClick={() => navigate('/map')}
            className="flex w-full items-center justify-center gap-2 rounded-[24px] bg-[hsl(var(--golfer-deep))] py-4 text-sm font-medium text-white transition hover:opacity-95"
          >
            <MapPin size={14} /> Open map view
          </button>
        </aside>
      </section>

      <section className="rounded-[32px] border border-[hsl(var(--golfer-line))] bg-white p-6 shadow-[0_24px_70px_-48px_rgba(12,25,19,0.35)] sm:p-8">
        <div className="flex flex-wrap gap-2">
          {tabs.map((value) => (
            <button
              key={value.key}
              onClick={() => setTab(value.key)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                tab === value.key ? 'bg-[hsl(var(--golfer-deep))] text-white' : 'bg-secondary text-muted-foreground'
              }`}
            >
              {value.label}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {tab === 'overview' ? (
            <div className="space-y-4">
              <p className="max-w-4xl text-sm leading-8 text-muted-foreground">
                {course.description ?? 'This course is included because it appears in the current stored GolfeR catalog. Some fields are still sparse, which is expected when the source snapshot does not provide them.'}
              </p>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-[24px] bg-[hsl(var(--golfer-cream))] p-5">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Address</p>
                  <p className="mt-2 text-sm font-medium text-card-foreground">{course.addressLabel ?? 'Unknown'}</p>
                </div>
                <div className="rounded-[24px] bg-[hsl(var(--golfer-cream))] p-5">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Access</p>
                  <p className="mt-2 text-sm font-medium capitalize text-card-foreground">{course.accessType ?? course.type}</p>
                </div>
                <div className="rounded-[24px] bg-[hsl(var(--golfer-cream))] p-5">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Par</p>
                  <p className="mt-2 text-sm font-medium text-card-foreground">{course.par ?? 'Unknown'}</p>
                </div>
                <div className="rounded-[24px] bg-[hsl(var(--golfer-cream))] p-5">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Holes</p>
                  <p className="mt-2 text-sm font-medium text-card-foreground">{course.holes ?? 'Unknown'}</p>
                </div>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-[24px] bg-[hsl(var(--golfer-cream))] p-5">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Website</p>
                  <p className="mt-2 text-sm font-medium text-card-foreground">{course.website ?? 'Not available'}</p>
                </div>
                <div className="rounded-[24px] bg-[hsl(var(--golfer-cream))] p-5">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Phone</p>
                  <p className="mt-2 text-sm font-medium text-card-foreground">{course.phone ?? 'Not available'}</p>
                </div>
              </div>
            </div>
          ) : null}

          {tab === 'source' ? (
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-[24px] bg-[hsl(var(--golfer-cream))] p-5">
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Source</p>
                <p className="mt-2 text-sm font-medium text-card-foreground">{course.source}</p>
              </div>
              <div className="rounded-[24px] bg-[hsl(var(--golfer-cream))] p-5">
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Source ID</p>
                <p className="mt-2 break-all text-sm font-medium text-card-foreground">{course.sourceId}</p>
              </div>
              <div className="rounded-[24px] bg-[hsl(var(--golfer-cream))] p-5">
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Coordinates</p>
                <p className="mt-2 text-sm font-medium text-card-foreground">
                  {course.latitude != null && course.longitude != null ? `${course.latitude}, ${course.longitude}` : 'Not available'}
                </p>
              </div>
              <div className="rounded-[24px] bg-[hsl(var(--golfer-cream))] p-5">
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Last synced</p>
                <p className="mt-2 text-sm font-medium text-card-foreground">{formatDemoDate(course.lastSyncedAt)}</p>
              </div>
              <div className="rounded-[24px] bg-[hsl(var(--golfer-cream))] p-5 lg:col-span-2">
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Pipeline note</p>
                <p className="mt-2 text-sm leading-7 text-card-foreground">
                  Raw source data is kept locally for debugging and later enrichment. The v1 UI only shows the clean,
                  canonical fields needed to test discovery and course structure.
                </p>
              </div>
            </div>
          ) : null}

          {tab === 'nearby' ? (
            nearbyCourses.length > 0 ? (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                {nearbyCourses.map((candidate) => (
                  <CourseCard key={candidate.id} course={candidate} />
                ))}
              </div>
            ) : (
              <div className="rounded-[24px] bg-[hsl(var(--golfer-cream))] p-5 text-sm leading-7 text-muted-foreground">
                No nearby comparison set is available yet for this course record.
              </div>
            )
          ) : null}
        </div>
      </section>

      <PlayedCourseDialog
        courseId={course.id}
        courseName={course.name}
        open={isPlayedDialogOpen}
        onOpenChange={setIsPlayedDialogOpen}
        mode={playedDialogMode}
      />
    </div>
  );
}
