import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Copy, Database, Globe, MapPin, RotateCcw, Star, Trophy } from 'lucide-react';

import CourseCard from '@/components/CourseCard';
import CoursePhotoGallerySection from '@/components/course-photos/CoursePhotoGallerySection';
import CoursePhotoSurface from '@/components/CoursePhotoSurface';
import PageHeader from '@/components/dashboard/PageHeader';
import PlayedCourseDialog from '@/components/rankings/PlayedCourseDialog';
import UnrankCourseButton from '@/components/rankings/UnrankCourseButton';
import { useCourseRecord, useStateCourseCatalog } from '@/hooks/use-course-catalog';
import { useCourseUploadedPhotoGallery } from '@/hooks/use-course-uploaded-photos';
import { useCourseRankings } from '@/hooks/use-course-rankings';
import { getCoursePar, registerCourseCatalogPar } from '@/lib/course-par';
import { getTourHistoryLabel, hasTourHistory } from '@/lib/course-data';
import { formatDisplayDate } from '@/lib/app-content';
import { resolveCoursePhoto } from '@/utils/coursePhoto';

type Tab = 'overview' | 'source' | 'nearby';

export default function CourseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('overview');
  const [isPlayedDialogOpen, setIsPlayedDialogOpen] = useState(false);
  const [playedDialogMode, setPlayedDialogMode] = useState<'play' | 'rerank'>('play');
  const [courseIdCopied, setCourseIdCopied] = useState(false);
  const { data: course, isLoading } = useCourseRecord(id);
  const { data: stateCourseCatalog = [] } = useStateCourseCatalog(course?.stateCode);
  const {
    uploadsConfigured,
    uploadedPhotos,
    uploadedCoverPhoto,
    isLoading: isUploadedPhotosLoading,
    isUploading,
    isSettingCover,
    uploadPhotos,
    setCoverPhoto,
  } = useCourseUploadedPhotoGallery(course?.id);
  const {
    rankingState,
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

  registerCourseCatalogPar(course.id, course.par);
  const courseRanking = getCourseRankingRecord(course.id);
  const courseNumericRating = getCourseNumericRating(course.id);
  const resolvedPar = getCoursePar(course.id, rankingState);
  const photoResolution = resolveCoursePhoto(course.id, uploadedCoverPhoto);
  const isPlayed = Boolean(courseRanking);
  const tourHistoryLabel = getTourHistoryLabel(course);
  const courseHasTourHistory = hasTourHistory(course);
  const userRoundTags = courseRanking?.tags ?? [];
  const hasRoundDetails =
    Boolean(courseRanking?.userEnteredPar) ||
    courseRanking?.scoreShot != null ||
    courseRanking?.pricePaid != null ||
    userRoundTags.length > 0 ||
    Boolean(courseRanking?.notes);

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'source', label: 'Source' },
    { key: 'nearby', label: 'Nearby' },
  ];

  const handleCopyCourseId = async () => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return;

    try {
      await navigator.clipboard.writeText(course.id);
      setCourseIdCopied(true);
      window.setTimeout(() => setCourseIdCopied(false), 1800);
    } catch {
      setCourseIdCopied(false);
    }
  };

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
        <div className="space-y-4">
          <div className="overflow-hidden rounded-[34px] border border-[hsl(var(--golfer-line))] bg-white shadow-[0_32px_90px_-55px_rgba(12,25,19,0.45)]">
            <CoursePhotoSurface
              courseId={course.id}
              courseName={course.name}
              lazy={false}
              showAttribution
              linkToCover
              photoOverride={photoResolution.photo}
              className="p-3"
              imageClassName="h-[24rem] w-full rounded-[28px] object-cover sm:h-[28rem]"
              placeholderClassName="h-[24rem] w-full rounded-[28px] bg-[linear-gradient(135deg,hsl(var(--golfer-cream)),hsl(var(--golfer-mist)))] sm:h-[28rem]"
            />
          </div>

          <CoursePhotoGallerySection
            courseId={course.id}
            uploadedPhotos={uploadedPhotos}
            uploadsConfigured={uploadsConfigured}
            isLoading={isUploadedPhotosLoading}
            isUploading={isUploading}
            isSettingCover={isSettingCover}
            onUploadPhotos={uploadPhotos}
            onSetCover={setCoverPhoto}
          />
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
                Community ratings are still getting started here.
              </div>
            )}

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full bg-secondary px-3 py-1.5 text-xs font-medium capitalize text-secondary-foreground">{course.type}</span>
              {course.holes != null ? <span className="rounded-full bg-secondary px-3 py-1.5 text-xs text-secondary-foreground">{course.holes} holes</span> : null}
              {resolvedPar ? (
                <span className="rounded-full bg-secondary px-3 py-1.5 text-xs text-secondary-foreground">
                  Par {resolvedPar.par}
                </span>
              ) : null}
              {courseHasTourHistory && tourHistoryLabel ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gold/15 px-3 py-1.5 text-xs font-medium text-gold">
                  <Trophy size={12} /> {tourHistoryLabel}
                </span>
              ) : null}
              {course.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-forest-muted px-3 py-1.5 text-xs font-medium text-forest">{tag}</span>
              ))}
            </div>

            {courseHasTourHistory ? (
              <div className="mt-5 rounded-[22px] bg-[hsl(var(--golfer-cream))] px-4 py-3">
                <p className="inline-flex items-center gap-2 text-sm font-medium text-[hsl(var(--golfer-deep))]">
                  <Trophy size={14} />
                  {tourHistoryLabel ?? 'PGA / LPGA host'}
                </p>
                {course.pgaLpgaTourHistoryNote ? (
                  <p className="mt-2 text-sm leading-7 text-[hsl(var(--golfer-deep-soft))]/[0.76]">
                    {course.pgaLpgaTourHistoryNote}
                  </p>
                ) : null}
                {course.pgaLpgaTourHistorySourceUrl ? (
                  <a
                    href={course.pgaLpgaTourHistorySourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-[hsl(var(--golfer-deep))]"
                  >
                    Tour history source <Globe size={13} />
                  </a>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="rounded-[30px] border border-[hsl(var(--golfer-line))] bg-white p-6 shadow-[0_24px_70px_-48px_rgba(12,25,19,0.35)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[hsl(var(--golfer-deep-soft))]/[0.58]">Core metadata</p>
            <div className="mt-4 space-y-3 text-sm text-muted-foreground">
              <p className="flex items-center gap-2"><MapPin size={14} /> {course.addressLabel ?? course.location}</p>
              <p className="flex items-center gap-2"><Database size={14} /> {course.source} / {course.sourceId}</p>
              <p className="flex items-center gap-2"><Star size={14} /> Updated {formatDisplayDate(course.lastSyncedAt)}</p>
            </div>
          </div>

          <div className="rounded-[26px] border border-dashed border-[hsl(var(--golfer-line))] bg-[hsl(var(--golfer-mist))]/[0.45] p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[hsl(var(--golfer-deep-soft))]/[0.58]">
                  Photo details
                </p>
                <p className="mt-2 text-sm leading-6 text-[hsl(var(--golfer-deep-soft))]/[0.78]">
                  Helpful when a course image needs a manual update.
                </p>
              </div>
              <span className="rounded-full border border-[hsl(var(--golfer-line))] bg-white px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-[hsl(var(--golfer-deep))]">
                {photoResolution.state === 'manual'
                  ? 'Manual photo'
                  : photoResolution.state === 'uploaded'
                    ? 'Uploaded cover'
                  : photoResolution.state === 'auto'
                    ? 'Auto photo'
                    : 'Placeholder'}
              </span>
            </div>

            <div className="mt-4 space-y-3 text-sm">
              <div className="rounded-[18px] bg-white/80 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-[hsl(var(--golfer-deep-soft))]/[0.56]">Course ID</p>
                    <code className="mt-2 block break-all text-xs text-[hsl(var(--golfer-deep))]">{course.id}</code>
                  </div>
                  <button
                    onClick={handleCopyCourseId}
                    className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[hsl(var(--golfer-line))] bg-white px-3 py-2 text-xs font-medium text-[hsl(var(--golfer-deep))]"
                  >
                    <Copy size={12} />
                    {courseIdCopied ? 'Copied' : 'Copy ID'}
                  </button>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[18px] bg-white/80 p-3">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[hsl(var(--golfer-deep-soft))]/[0.56]">Photo state</p>
                  <p className="mt-2 text-sm text-[hsl(var(--golfer-deep))]">
                    {photoResolution.state === 'manual'
                      ? 'Manual override active'
                      : photoResolution.state === 'uploaded'
                        ? 'Uploaded course cover active'
                      : photoResolution.state === 'auto'
                        ? 'Auto-generated match active'
                        : 'Using placeholder'}
                  </p>
                </div>
                <div className="rounded-[18px] bg-white/80 p-3">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[hsl(var(--golfer-deep-soft))]/[0.56]">Photo source</p>
                  <p className="mt-2 break-words text-sm text-[hsl(var(--golfer-deep))]">
                    {photoResolution.photo?.photoSource ?? 'None'}
                  </p>
                </div>
                <div className="rounded-[18px] bg-white/80 p-3">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[hsl(var(--golfer-deep-soft))]/[0.56]">Photo credit</p>
                  <p className="mt-2 break-words text-sm text-[hsl(var(--golfer-deep))]">
                    {photoResolution.photo?.photoCredit ?? 'None'}
                  </p>
                </div>
                <div className="rounded-[18px] bg-white/80 p-3">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[hsl(var(--golfer-deep-soft))]/[0.56]">Photo license</p>
                  <p className="mt-2 break-words text-sm text-[hsl(var(--golfer-deep))]">
                    {photoResolution.photo?.photoLicense ?? 'None'}
                  </p>
                </div>
              </div>
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
                Saved ranking
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
                Last played {courseRanking?.lastPlayedAt ? formatDisplayDate(courseRanking.lastPlayedAt) : 'not recorded yet'}.
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
                <UnrankCourseButton
                  courseId={course.id}
                  courseName={course.name}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-[20px] border border-rose-200 bg-white px-4 py-3 text-sm font-medium text-rose-700 transition hover:bg-rose-50"
                />
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

      {isPlayed && hasRoundDetails ? (
        <section className="rounded-[32px] border border-[hsl(var(--golfer-line))] bg-white p-6 shadow-[0_24px_70px_-48px_rgba(12,25,19,0.35)] sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[hsl(var(--golfer-deep-soft))]/[0.58]">
                Your round
              </p>
              <h2 className="mt-4 text-3xl text-[hsl(var(--golfer-deep))]">Most recent round details on this device</h2>
            </div>
            {courseRanking?.roundDate ? (
              <span className="rounded-full bg-[hsl(var(--golfer-mist))] px-4 py-2 text-sm font-medium text-[hsl(var(--golfer-deep))]">
                {formatDisplayDate(courseRanking.roundDate)}
              </span>
            ) : null}
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {resolvedPar ? (
              <div className="rounded-[22px] bg-[hsl(var(--golfer-cream))] p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[hsl(var(--golfer-deep-soft))]/[0.56]">Par</p>
                <p className="mt-2 text-base text-[hsl(var(--golfer-deep))]">
                  {resolvedPar.par}
                  {resolvedPar.source === 'user' ? (
                    <span className="ml-2 text-xs text-[hsl(var(--golfer-deep-soft))]/[0.64]">(your entry)</span>
                  ) : null}
                </p>
              </div>
            ) : null}

            {courseRanking?.scoreShot != null ? (
              <div className="rounded-[22px] bg-[hsl(var(--golfer-cream))] p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[hsl(var(--golfer-deep-soft))]/[0.56]">Score shot</p>
                <p className="mt-2 text-base text-[hsl(var(--golfer-deep))]">{courseRanking.scoreShot}</p>
              </div>
            ) : null}

            {courseRanking?.pricePaid != null ? (
              <div className="rounded-[22px] bg-[hsl(var(--golfer-cream))] p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[hsl(var(--golfer-deep-soft))]/[0.56]">Price paid</p>
                <p className="mt-2 text-base text-[hsl(var(--golfer-deep))]">${courseRanking.pricePaid}</p>
              </div>
            ) : null}

            {courseRanking?.roundDate ? (
              <div className="rounded-[22px] bg-[hsl(var(--golfer-cream))] p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[hsl(var(--golfer-deep-soft))]/[0.56]">Round date</p>
                <p className="mt-2 text-base text-[hsl(var(--golfer-deep))]">{formatDisplayDate(courseRanking.roundDate)}</p>
              </div>
            ) : null}
          </div>

          {userRoundTags.length > 0 ? (
            <div className="mt-6 flex flex-wrap gap-2">
              {userRoundTags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-[hsl(var(--golfer-line))] bg-[hsl(var(--golfer-mist))] px-3 py-1.5 text-xs font-medium text-[hsl(var(--golfer-deep))]"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}

          {courseRanking?.notes ? (
            <p className="mt-5 text-sm leading-7 text-[hsl(var(--golfer-deep-soft))]/[0.76]">{courseRanking.notes}</p>
          ) : null}
        </section>
      ) : null}

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
                <p className="mt-2 text-sm font-medium text-card-foreground">{formatDisplayDate(course.lastSyncedAt)}</p>
              </div>
              <div className="rounded-[24px] bg-[hsl(var(--golfer-cream))] p-5 lg:col-span-2">
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Pipeline note</p>
                <p className="mt-2 text-sm leading-7 text-card-foreground">
                  These source details show where the course information came from and how it is mapped inside
                  GolfeR. The page keeps the clean, readable fields up front so browsing stays simple.
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
