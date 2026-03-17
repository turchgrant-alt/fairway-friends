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
    <div className="space-y-10">
      <PageHeader
        eyebrow="Lists"
        title="Weekly curated lists generated from the stored course catalog."
        description="GolfeR now rebuilds these editorial lists from the local catalog on a weekly cadence, using deterministic recipes instead of fake engagement signals."
        actions={
          <div className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--golfer-line))] bg-white px-4 py-3 text-sm font-medium text-[hsl(var(--golfer-deep))]">
            <CalendarSync size={16} /> Refreshes weekly
          </div>
        }
      />

      <section className="grid gap-4 rounded-[30px] border border-[hsl(var(--golfer-line))] bg-white/85 p-6 shadow-[0_24px_70px_-48px_rgba(12,25,19,0.35)] lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.9fr)]">
        <div className="space-y-4">
          <p className="inline-flex items-center gap-2 rounded-full bg-[hsl(var(--golfer-mist))] px-3 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-[hsl(var(--golfer-deep-soft))]">
            <Sparkles size={14} /> Generated editorial system
          </p>
          <h2 className="max-w-3xl text-3xl text-[hsl(var(--golfer-deep))]">
            A practical weekly list engine built from the stored GolfeR catalog.
          </h2>
          <p className="max-w-3xl text-sm leading-7 text-[hsl(var(--golfer-deep-soft))]/[0.78]">
            Each list is generated from explicit course metadata like state, access type, hole count, and PGA / LPGA host history. There is no fake community activity or opaque scoring model behind these lists.
          </p>
        </div>
        <div className="grid gap-3 rounded-[24px] border border-[hsl(var(--golfer-line))] bg-[hsl(var(--golfer-cream))] p-5 text-sm text-[hsl(var(--golfer-deep-soft))]">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-semibold uppercase tracking-[0.24em]">Catalog status</span>
            <ListChecks size={16} className="text-[hsl(var(--golfer-deep))]" />
          </div>
          <div className="space-y-2">
            <p className="font-medium text-[hsl(var(--golfer-deep))]">
              {data ? `${data.listCount} generated lists` : 'Loading generated lists'}
            </p>
            <p>List refresh cadence: weekly</p>
            <p>Last list generation: {formatGeneratedDate(data?.generatedAt)}</p>
            <p>Source catalog imported: {formatGeneratedDate(data?.sourceCatalogImportedAt)}</p>
          </div>
        </div>
      </section>

      {isLoading ? (
        <section className="grid gap-5 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-64 animate-pulse rounded-[30px] border border-[hsl(var(--golfer-line))] bg-white/70"
            />
          ))}
        </section>
      ) : null}

      {isError ? (
        <section className="rounded-[30px] border border-[hsl(var(--golfer-line))] bg-white p-8 text-sm text-[hsl(var(--golfer-deep-soft))]/[0.8] shadow-[0_24px_70px_-48px_rgba(12,25,19,0.35)]">
          The generated lists file could not be loaded. Run <code>npm run generate:lists</code> to rebuild the stored weekly list output.
        </section>
      ) : null}

      {featuredLists.length > 0 ? (
        <section className="grid gap-5 lg:grid-cols-3">
          {featuredLists.map((list) => (
            <article
              key={list.id}
              className="rounded-[30px] border border-[hsl(var(--golfer-line))] bg-white p-6 shadow-[0_24px_70px_-48px_rgba(12,25,19,0.35)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[hsl(var(--golfer-deep-soft))]/[0.56]">
                    {getListTypeLabel(list.listType)}
                  </p>
                  <h2 className="mt-4 text-2xl text-[hsl(var(--golfer-deep))]">{list.title}</h2>
                </div>
                <span className="rounded-full bg-[hsl(var(--golfer-mist))] px-3 py-1 text-xs font-medium text-[hsl(var(--golfer-deep))]">
                  {list.itemCount} courses
                </span>
              </div>
              <p className="mt-3 text-sm leading-7 text-[hsl(var(--golfer-deep-soft))]/[0.74]">{list.subtitle}</p>
              <p className="mt-4 text-sm leading-7 text-[hsl(var(--golfer-deep-soft))]/[0.78]">{list.description}</p>
              <div className="mt-6 flex flex-wrap gap-2">
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
                className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-[hsl(var(--golfer-deep))]"
              >
                View list <ArrowRight size={14} />
              </a>
            </article>
          ))}
        </section>
      ) : null}

      <section className="space-y-6">
        {generatedLists.map((list) => (
          <article
            key={list.id}
            id={list.slug}
            className="rounded-[32px] border border-[hsl(var(--golfer-line))] bg-white p-6 shadow-[0_24px_70px_-48px_rgba(12,25,19,0.35)] lg:p-8"
          >
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[hsl(var(--golfer-mist))] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(var(--golfer-deep))]">
                    {getListTypeLabel(list.listType)}
                  </span>
                  <span className="rounded-full border border-[hsl(var(--golfer-line))] px-3 py-1 text-xs text-[hsl(var(--golfer-deep-soft))]">
                    Updated {formatGeneratedDate(list.generatedAt)}
                  </span>
                </div>
                <div>
                  <h2 className="text-3xl text-[hsl(var(--golfer-deep))]">{list.title}</h2>
                  <p className="mt-2 text-base text-[hsl(var(--golfer-deep-soft))]/[0.78]">{list.subtitle}</p>
                </div>
                <p className="text-sm leading-7 text-[hsl(var(--golfer-deep-soft))]/[0.82]">{list.description}</p>
                {list.rationale ? (
                  <p className="text-sm leading-7 text-[hsl(var(--golfer-deep-soft))]/[0.78]">{list.rationale}</p>
                ) : null}
              </div>
              <div className="grid min-w-[240px] gap-3 rounded-[24px] border border-[hsl(var(--golfer-line))] bg-[hsl(var(--golfer-cream))] p-5 text-sm text-[hsl(var(--golfer-deep-soft))]">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold uppercase tracking-[0.24em]">List summary</span>
                  <Flag size={16} className="text-[hsl(var(--golfer-deep))]" />
                </div>
                <p className="font-medium text-[hsl(var(--golfer-deep))]">{list.itemCount} ordered courses</p>
                <p>Refresh cadence: {list.refreshCadence}</p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {list.criteriaSummary.map((criterion) => (
                <span
                  key={criterion}
                  className="rounded-full border border-[hsl(var(--golfer-line))] bg-[hsl(var(--golfer-cream))] px-3 py-1 text-xs text-[hsl(var(--golfer-deep-soft))]"
                >
                  {criterion}
                </span>
              ))}
            </div>

            <div className="mt-8 space-y-3">
              {list.courses.map((course, index) => (
                <button
                  key={course.id}
                  onClick={() => navigate(`/course/${course.id}`)}
                  className="flex w-full items-start gap-4 rounded-[22px] border border-[hsl(var(--golfer-line))] bg-[hsl(var(--golfer-cream))] p-4 text-left transition hover:border-[hsl(var(--golfer-deep))]/20 hover:bg-[hsl(var(--golfer-mist))]"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--golfer-deep))] text-sm font-semibold text-white">
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
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-[hsl(var(--golfer-deep-soft))]/[0.78]">
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
