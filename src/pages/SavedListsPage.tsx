import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CalendarSync, Flag, ListChecks, MapPin, Sparkles } from 'lucide-react';

import PageHeader from '@/components/dashboard/PageHeader';
import { getTourHistoryLabel } from '@/lib/course-data';
import { useGeneratedCourseLists } from '@/hooks/use-generated-course-lists';

function formatGeneratedDate(value: string | null | undefined) {
  if (!value) return 'Unknown';

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Unknown';

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(parsed);
}

function getListTypeLabel(listType: string) {
  switch (listType) {
    case 'tour_history':
      return 'Tour history';
    case 'holes_count':
      return 'Venue scale';
    case 'access_type':
      return 'Access type';
    case 'state':
      return 'State spotlight';
    case 'city':
      return 'City spotlight';
    case 'editorial':
      return 'Editorial';
    default:
      return 'Curated';
  }
}

function buildCourseMeta(course: {
  location: string;
  holes: number | null;
  accessType: string | null;
  hasPgaOrLpgaTourHistory?: boolean | null;
  pgaLpgaTourHistoryType?: 'pga' | 'lpga' | 'pga_lpga' | null;
}) {
  return [
    course.location,
    typeof course.holes === 'number' ? `${course.holes} holes` : null,
    course.accessType && course.accessType !== 'unknown' ? course.accessType : null,
    getTourHistoryLabel(course),
  ].filter(Boolean);
}

export default function SavedListsPage() {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useGeneratedCourseLists();

  const generatedLists = data?.lists ?? [];
  const featuredLists = useMemo(() => generatedLists.slice(0, 6), [generatedLists]);

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Lists"
        title="Curated golf lists, refreshed every week."
        description="From bucket-list tracks and tour hosts to state standouts and trip-ready public courses, these lists are built to help you decide faster."
        actions={
          <div className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--golfer-line))] bg-white px-3 py-2 text-sm font-medium text-[hsl(var(--golfer-deep))]">
            <CalendarSync size={14} /> Updated weekly
          </div>
        }
      />

      <section className="grid gap-3 rounded-2xl border border-[hsl(var(--golfer-line))] bg-white/85 p-4 shadow-[0_24px_70px_-48px_rgba(12,25,19,0.35)] lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.9fr)]">
        <div className="space-y-2">
          <p className="inline-flex items-center gap-2 rounded-full bg-[hsl(var(--golfer-mist))] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-[hsl(var(--golfer-deep-soft))]">
            <Sparkles size={12} /> Fresh picks
          </p>
          <h2 className="max-w-3xl text-xl text-[hsl(var(--golfer-deep))]">
            New ways to browse the best golf trips, day-round ideas, and bucket-list courses.
          </h2>
          <p className="max-w-3xl text-sm leading-6 text-[hsl(var(--golfer-deep-soft))]/[0.78]">
            Every list starts from real course details like location, access type, holes, and tour history so the
            results feel specific instead of generic.
          </p>
        </div>
        <div className="grid gap-2 rounded-xl border border-[hsl(var(--golfer-line))] bg-[hsl(var(--golfer-cream))] p-3 text-sm text-[hsl(var(--golfer-deep-soft))]">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-semibold uppercase tracking-[0.24em]">This week</span>
            <ListChecks size={16} className="text-[hsl(var(--golfer-deep))]" />
          </div>
          <div className="space-y-2">
            <p className="font-medium text-[hsl(var(--golfer-deep))]">
              {data ? `${data.listCount} curated lists` : 'Loading curated lists'}
            </p>
            <p>Fresh lists arrive every week</p>
            <p>Last updated: {formatGeneratedDate(data?.generatedAt)}</p>
            <p>Course refresh: {formatGeneratedDate(data?.sourceCatalogImportedAt)}</p>
          </div>
        </div>
      </section>

      {isLoading ? (
        <section className="grid gap-3 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-32 animate-pulse rounded-xl border border-[hsl(var(--golfer-line))] bg-white/70"
            />
          ))}
        </section>
      ) : null}

      {isError ? (
        <section className="rounded-xl border border-[hsl(var(--golfer-line))] bg-white p-4 text-sm text-[hsl(var(--golfer-deep-soft))]/[0.8] shadow-[0_24px_70px_-48px_rgba(12,25,19,0.35)]">
          Curated lists are not available right now. Try again in a moment.
        </section>
      ) : null}

      {featuredLists.length > 0 ? (
        <section className="grid gap-3 lg:grid-cols-3">
          {featuredLists.map((list) => (
            <article
              key={list.id}
              className="rounded-xl border border-[hsl(var(--golfer-line))] bg-white p-3 shadow-[0_24px_70px_-48px_rgba(12,25,19,0.35)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[hsl(var(--golfer-deep-soft))]/[0.56]">
                    {getListTypeLabel(list.listType)}
                  </p>
                  <h2 className="mt-2 text-lg text-[hsl(var(--golfer-deep))]">{list.title}</h2>
                </div>
                <span className="rounded-full bg-[hsl(var(--golfer-mist))] px-2.5 py-1 text-xs font-medium text-[hsl(var(--golfer-deep))]">
                  {list.itemCount} courses
                </span>
              </div>
              <p className="mt-1.5 text-xs leading-5 text-[hsl(var(--golfer-deep-soft))]/[0.74]">{list.subtitle}</p>
              <p className="mt-1.5 text-xs leading-5 text-[hsl(var(--golfer-deep-soft))]/[0.78]">{list.description}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {list.criteriaSummary.slice(0, 2).map((criterion) => (
                  <span
                    key={criterion}
                    className="rounded-full border border-[hsl(var(--golfer-line))] bg-[hsl(var(--golfer-cream))] px-3 py-1 text-xs text-[hsl(var(--golfer-deep-soft))]"
                  >
                    {criterion}
                  </span>
                ))}
              </div>
              <a
                href={`#${list.slug}`}
                className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-[hsl(var(--golfer-deep))]"
              >
                View list <ArrowRight size={14} />
              </a>
            </article>
          ))}
        </section>
      ) : null}

      <section className="space-y-3">
        {generatedLists.map((list) => (
          <article
            key={list.id}
            id={list.slug}
            className="rounded-2xl border border-[hsl(var(--golfer-line))] bg-white p-4 shadow-[0_24px_70px_-48px_rgba(12,25,19,0.35)]"
          >
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[hsl(var(--golfer-mist))] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(var(--golfer-deep))]">
                    {getListTypeLabel(list.listType)}
                  </span>
                  <span className="rounded-full border border-[hsl(var(--golfer-line))] px-3 py-1 text-xs text-[hsl(var(--golfer-deep-soft))]">
                    Updated {formatGeneratedDate(list.generatedAt)}
                  </span>
                </div>
                <div>
                  <h2 className="text-xl text-[hsl(var(--golfer-deep))]">{list.title}</h2>
                  <p className="mt-1 text-sm text-[hsl(var(--golfer-deep-soft))]/[0.78]">{list.subtitle}</p>
                </div>
                <p className="text-sm leading-6 text-[hsl(var(--golfer-deep-soft))]/[0.82]">{list.description}</p>
                {list.rationale ? (
                  <p className="text-sm leading-6 text-[hsl(var(--golfer-deep-soft))]/[0.78]">{list.rationale}</p>
                ) : null}
              </div>
              <div className="grid min-w-[200px] gap-2 rounded-xl border border-[hsl(var(--golfer-line))] bg-[hsl(var(--golfer-cream))] p-3 text-sm text-[hsl(var(--golfer-deep-soft))]">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold uppercase tracking-[0.24em]">List summary</span>
                  <Flag size={16} className="text-[hsl(var(--golfer-deep))]" />
                </div>
                <p className="font-medium text-[hsl(var(--golfer-deep))]">{list.itemCount} ordered courses</p>
                <p>Refresh cadence: {list.refreshCadence}</p>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {list.criteriaSummary.map((criterion) => (
                <span
                  key={criterion}
                  className="rounded-full border border-[hsl(var(--golfer-line))] bg-[hsl(var(--golfer-cream))] px-3 py-1 text-xs text-[hsl(var(--golfer-deep-soft))]"
                >
                  {criterion}
                </span>
              ))}
            </div>

            <div className="mt-4 space-y-2">
              {list.courses.map((course, index) => (
                <button
                  key={course.id}
                  onClick={() => navigate(`/course/${course.id}`)}
                  className="flex w-full items-start gap-3 rounded-xl border border-[hsl(var(--golfer-line))] bg-[hsl(var(--golfer-cream))] p-2.5 text-left transition hover:border-[hsl(var(--golfer-deep))]/20 hover:bg-[hsl(var(--golfer-mist))]"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--golfer-deep))] text-xs font-semibold text-white">
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-[hsl(var(--golfer-deep))]">{course.name}</p>
                      {course.hasPgaOrLpgaTourHistory ? (
                        <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-[hsl(var(--golfer-deep))]">
                          {getTourHistoryLabel(course)}
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[hsl(var(--golfer-deep-soft))]/[0.78]">
                      {buildCourseMeta(course).map((item) => (
                        <span key={item} className="inline-flex items-center gap-1">
                          <MapPin size={12} />
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
