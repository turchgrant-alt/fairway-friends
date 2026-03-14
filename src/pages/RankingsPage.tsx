import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

import PageHeader from '@/components/dashboard/PageHeader';
import { sortCoursesByName, type CoursePreview } from '@/lib/course-data';
import { useCourseCatalogIndex } from '@/hooks/use-course-catalog';

type Tab = 'alphabetical' | 'metadata';

function metadataScore(course: CoursePreview) {
  return [
    course.city,
    course.addressLabel,
    course.website,
    course.phone,
    course.par,
    course.holes,
  ].filter(Boolean).length;
}

export default function RankingsPage() {
  const navigate = useNavigate();
  const { data: courseCatalog = [], isLoading } = useCourseCatalogIndex();
  const [tab, setTab] = useState<Tab>('alphabetical');
  const alphabeticalCourses = useMemo(() => sortCoursesByName(courseCatalog).slice(0, 24), [courseCatalog]);
  const metadataRichCourses = useMemo(
    () =>
      [...courseCatalog]
        .sort((a, b) => metadataScore(b) - metadataScore(a) || a.name.localeCompare(b.name))
        .slice(0, 24),
    [courseCatalog],
  );

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Catalog"
        title="Alternative ways to browse the v1 course catalog."
        description="This legacy route now acts as a utility catalog view instead of a fake personal rankings page."
        actions={
          <button
            onClick={() => navigate('/discover')}
            className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--golfer-line))] bg-white px-4 py-3 text-sm font-medium text-[hsl(var(--golfer-deep))]"
          >
            Open discovery <ArrowRight size={16} />
          </button>
        }
      />

      <section className="rounded-[32px] border border-[hsl(var(--golfer-line))] bg-white p-6 shadow-[0_24px_70px_-48px_rgba(12,25,19,0.35)] sm:p-8">
        <div className="flex flex-wrap gap-2">
          {(['alphabetical', 'metadata'] as Tab[]).map((value) => (
            <button
              key={value}
              onClick={() => setTab(value)}
              className={`rounded-full px-4 py-2 text-sm font-medium capitalize transition-colors ${
                tab === value ? 'bg-[hsl(var(--golfer-deep))] text-white' : 'bg-secondary text-muted-foreground'
              }`}
            >
              {value}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {isLoading ? (
            <div className="rounded-[24px] bg-[hsl(var(--golfer-cream))] p-6 text-sm text-muted-foreground">
              Loading the stored course catalog...
            </div>
          ) : tab === 'alphabetical' ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {alphabeticalCourses.map((course, index) => (
                <button
                  key={course.id}
                  onClick={() => navigate(`/course/${course.id}`)}
                  className="flex w-full items-center gap-4 rounded-[24px] bg-[hsl(var(--golfer-cream))] p-4 text-left transition hover:-translate-y-0.5"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-sm font-bold text-[hsl(var(--golfer-deep))]">
                    {index + 1}
                  </span>
                  <img src={course.imageUrl} alt={course.name} className="h-16 w-16 rounded-[18px] object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-semibold text-card-foreground">{course.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{course.location}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {metadataRichCourses.map((course) => (
                <button
                  key={course.id}
                  onClick={() => navigate(`/course/${course.id}`)}
                  className="rounded-[26px] bg-[hsl(var(--golfer-cream))] p-5 text-left transition hover:-translate-y-0.5"
                >
                  <h3 className="text-base font-semibold text-card-foreground">{course.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{course.location}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {course.website ? <span className="rounded-full bg-white px-3 py-1 text-xs text-[hsl(var(--golfer-deep))]">Website</span> : null}
                    {course.phone ? <span className="rounded-full bg-white px-3 py-1 text-xs text-[hsl(var(--golfer-deep))]">Phone</span> : null}
                    {course.addressLabel ? <span className="rounded-full bg-white px-3 py-1 text-xs text-[hsl(var(--golfer-deep))]">Address</span> : null}
                    {course.par != null ? <span className="rounded-full bg-white px-3 py-1 text-xs text-[hsl(var(--golfer-deep))]">Par {course.par}</span> : null}
                    {course.holes != null ? <span className="rounded-full bg-white px-3 py-1 text-xs text-[hsl(var(--golfer-deep))]">{course.holes} holes</span> : null}
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
