import { useNavigate } from 'react-router-dom';
import { ArrowRight, Database, ListOrdered, MapPinned, RefreshCcw, Settings } from 'lucide-react';

import PageHeader from '@/components/dashboard/PageHeader';
import { useCourseRankings } from '@/hooks/use-course-rankings';
import { useRankedCourseRecords } from '@/hooks/use-ranked-course-records';
import { demoStats, demoWorkspaceCards, formatDemoDate, starterLists } from '@/lib/demo-v1';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { rankedCourses, rankedCourseCount, hasTrueRankingThreshold } = useCourseRankings();
  const {
    records: rankedCourseRecords,
    isLoading: isRankedCoursesLoading,
    hasError: hasRankedCoursesError,
  } = useRankedCourseRecords(rankedCourses);

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Workspace"
        title="Builder-facing product workspace"
        description="Use this page as the practical control surface for the v1 demo: what data is loaded, what is in scope, and which core pages are worth testing next."
        actions={
          <button
            onClick={() => navigate('/settings')}
            className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-[hsl(var(--golfer-line))] bg-white text-[hsl(var(--golfer-deep))]"
          >
            <Settings size={18} />
          </button>
        }
      />

      <section className="grid gap-6 lg:grid-cols-4">
        {[
          { label: 'Courses loaded', value: demoStats.totalCourses, icon: Database },
          { label: 'States represented', value: demoStats.statesRepresented, icon: MapPinned },
          { label: 'Verified map pins', value: demoStats.mappableCourses, icon: MapPinned },
          { label: 'Latest import', value: formatDemoDate(demoStats.lastImportedAt), icon: RefreshCcw },
        ].map(({ label, value, icon: Icon }) => (
          <article
            key={label}
            className="rounded-[28px] border border-[hsl(var(--golfer-line))] bg-white p-6 shadow-[0_24px_70px_-48px_rgba(12,25,19,0.38)]"
          >
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[hsl(var(--golfer-mist))] text-[hsl(var(--golfer-deep))]">
              <Icon size={18} />
            </span>
            <p className="mt-5 text-2xl text-[hsl(var(--golfer-deep))]">{value}</p>
            <p className="mt-2 text-sm text-[hsl(var(--golfer-deep-soft))]/[0.72]">{label}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="rounded-[32px] border border-[hsl(var(--golfer-line))] bg-white p-7 shadow-[0_24px_70px_-48px_rgba(12,25,19,0.38)] sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[hsl(var(--golfer-deep-soft))]/[0.58]">Current mode</p>
          <h2 className="mt-4 text-3xl text-[hsl(var(--golfer-deep))]">No-auth demo workspace</h2>
          <p className="mt-4 text-sm leading-8 text-[hsl(var(--golfer-deep-soft))]/[0.74]">
            The visible app is intentionally trimmed down. Fake profiles, followers, activity feeds, and authored
            reviews are hidden so the current product can focus on real course data, map discovery, and the core
            browsing flow.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {demoWorkspaceCards.map((card) => (
              <button
                key={card.path}
                onClick={() => navigate(card.path)}
                className="rounded-[24px] bg-[hsl(var(--golfer-cream))] p-5 text-left transition hover:bg-[hsl(var(--golfer-mist))]"
              >
                <p className="text-lg font-semibold text-[hsl(var(--golfer-deep))]">{card.title}</p>
                <p className="mt-2 text-sm leading-7 text-[hsl(var(--golfer-deep-soft))]/[0.72]">{card.description}</p>
                <span className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[hsl(var(--golfer-deep))]">
                  Open <ArrowRight size={14} />
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-[32px] border border-[hsl(var(--golfer-line))] bg-white p-7 shadow-[0_24px_70px_-48px_rgba(12,25,19,0.35)] sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[hsl(var(--golfer-deep-soft))]/[0.58]">Starter lists</p>
          <div className="mt-6 space-y-4">
            {starterLists.map((list) => (
              <div key={list.id} className="rounded-[24px] bg-[hsl(var(--golfer-cream))] p-5">
                <h3 className="text-lg text-[hsl(var(--golfer-deep))]">{list.title}</h3>
                <p className="mt-2 text-sm leading-7 text-[hsl(var(--golfer-deep-soft))]/[0.72]">{list.description}</p>
                <p className="mt-3 text-sm font-medium text-[hsl(var(--golfer-deep))]">{list.courses.length} courses</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-[32px] border border-[hsl(var(--golfer-line))] bg-white p-7 shadow-[0_24px_70px_-48px_rgba(12,25,19,0.35)] sm:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[hsl(var(--golfer-deep-soft))]/[0.58]">
              My rankings
            </p>
            <h2 className="mt-4 text-3xl text-[hsl(var(--golfer-deep))]">Local ranking state</h2>
            <p className="mt-3 max-w-3xl text-sm leading-8 text-[hsl(var(--golfer-deep-soft))]/[0.74]">
              This view reads directly from GolfeR&apos;s local ranking store on this device. It is a simple inspection
              surface for testing saved course order before the full comparison flow exists.
            </p>
          </div>

          <div className="rounded-full bg-[hsl(var(--golfer-mist))] px-4 py-2 text-sm font-medium text-[hsl(var(--golfer-deep))]">
            {rankedCourseCount} ranked course{rankedCourseCount === 1 ? '' : 's'}
          </div>
        </div>

        <div className="mt-6 rounded-[24px] bg-[hsl(var(--golfer-cream))] px-5 py-4 text-sm leading-7 text-[hsl(var(--golfer-deep-soft))]/[0.76]">
          {hasTrueRankingThreshold
            ? 'The five-course threshold has been reached, so this list reflects the stricter local ranking order.'
            : 'Fewer than five courses are ranked, so treat this as an early-stage local list. The stored order is still real and will carry forward.'}
        </div>

        <div className="mt-8">
          {rankedCourseCount === 0 ? (
            <div className="rounded-[28px] border border-dashed border-[hsl(var(--golfer-line))] bg-white p-10 text-center">
              <div className="mx-auto max-w-2xl">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[hsl(var(--golfer-mist))] text-[hsl(var(--golfer-deep))]">
                  <ListOrdered size={18} />
                </span>
                <h3 className="mt-5 text-2xl text-[hsl(var(--golfer-deep))]">No local rankings saved yet</h3>
                <p className="mt-3 text-sm leading-8 text-[hsl(var(--golfer-deep-soft))]/[0.74]">
                  Open any course page and use the Played this course popup to start saving local rankings.
                </p>
              </div>
            </div>
          ) : isRankedCoursesLoading ? (
            <div className="rounded-[24px] bg-[hsl(var(--golfer-cream))] p-6 text-sm text-[hsl(var(--golfer-deep-soft))]/[0.74]">
              Loading ranked course details...
            </div>
          ) : hasRankedCoursesError ? (
            <div className="rounded-[24px] bg-[hsl(var(--golfer-cream))] p-6 text-sm leading-7 text-[hsl(var(--golfer-deep-soft))]/[0.74]">
              The local ranking store loaded, but one or more course detail files could not be resolved for display.
            </div>
          ) : (
            <div className="space-y-4">
              {rankedCourseRecords.map(({ ranking, course, fallbackName, fallbackLocation }) => (
                <button
                  key={ranking.courseId}
                  onClick={() => navigate(`/course/${ranking.courseId}`)}
                  className="grid w-full gap-4 rounded-[28px] border border-[hsl(var(--golfer-line))] bg-white p-5 text-left shadow-[0_18px_44px_-42px_rgba(12,25,19,0.35)] transition hover:-translate-y-0.5 sm:grid-cols-[5rem_minmax(0,1fr)_auto]"
                >
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[hsl(var(--golfer-deep))] text-base font-semibold text-white">
                      {ranking.globalOrder}
                    </span>
                    <div className="sm:hidden">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-[hsl(var(--golfer-deep-soft))]/[0.56]">
                        Global order
                      </p>
                    </div>
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-[hsl(var(--golfer-deep))]">
                        {course?.name ?? fallbackName}
                      </h3>
                      <span className="rounded-full bg-[hsl(var(--golfer-mist))] px-3 py-1 text-xs font-medium capitalize text-[hsl(var(--golfer-deep))]">
                        {ranking.bucket}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-[hsl(var(--golfer-deep-soft))]/[0.72]">
                      {course?.location ?? fallbackLocation}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs text-[hsl(var(--golfer-deep-soft))]/[0.74]">
                      <span className="rounded-full bg-[hsl(var(--golfer-cream))] px-3 py-1.5">
                        Bucket order #{ranking.bucketOrder}
                      </span>
                      <span className="rounded-full bg-[hsl(var(--golfer-cream))] px-3 py-1.5">
                        Play count {ranking.playCount}
                      </span>
                      <span className="rounded-full bg-[hsl(var(--golfer-cream))] px-3 py-1.5">
                        Last played {ranking.lastPlayedAt ? formatDemoDate(ranking.lastPlayedAt) : 'Not recorded'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start justify-start sm:justify-end">
                    <span className="inline-flex items-center gap-2 text-sm font-medium text-[hsl(var(--golfer-deep))]">
                      Open course <ArrowRight size={14} />
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
