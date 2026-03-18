import { useDeferredValue, useMemo, useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';

import CourseCard from '@/components/CourseCard';
import SectionHeader from '@/components/SectionHeader';
import PageHeader from '@/components/dashboard/PageHeader';
import { sortCoursesByName } from '@/lib/course-data';
import { useCourseCatalogIndex } from '@/hooks/use-course-catalog';
import { catalogStats } from '@/lib/app-content';

const DISCOVER_RESULT_LIMIT = 120;

export default function DiscoverPage() {
  const { data: courseCatalog = [], isLoading } = useCourseCatalogIndex();
  const [query, setQuery] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = deferredQuery.trim().toLowerCase();
  const activeQuery = normalizedQuery.length >= 2 ? normalizedQuery : '';
  const sortedCatalog = useMemo(() => sortCoursesByName(courseCatalog), [courseCatalog]);

  const courseTypes = useMemo(
    () => ['All', ...Array.from(new Set(sortedCatalog.map((course) => course.type))).sort((a, b) => a.localeCompare(b))],
    [sortedCatalog],
  );
  const tags = useMemo(
    () => Array.from(new Set(sortedCatalog.flatMap((course) => course.tags))).slice(0, 10),
    [sortedCatalog],
  );

  const filtered = useMemo(
    () =>
      sortedCatalog.filter((course) => {
        if (
          activeQuery &&
          !course.name.toLowerCase().includes(activeQuery) &&
          !course.location.toLowerCase().includes(activeQuery) &&
          !(course.addressLabel ?? '').toLowerCase().includes(activeQuery)
        ) {
          return false;
        }

        if (selectedType !== 'All' && course.type.toLowerCase() !== selectedType.toLowerCase()) return false;
        if (selectedTags.length > 0 && !selectedTags.some((tag) => course.tags.includes(tag))) return false;

        return true;
      }),
    [activeQuery, selectedTags, selectedType, sortedCatalog],
  );
  const displayedResults = filtered.slice(0, DISCOVER_RESULT_LIMIT);
  const resultOverflow = Math.max(filtered.length - displayedResults.length, 0);

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Discovery"
        title="Search, filter, and compare courses with more room to think."
        description="Explore courses by name, access type, and lightweight tags to narrow down where you want to play next."
        actions={
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-3 text-sm font-medium transition ${
              showFilters
                ? 'border-[hsl(var(--golfer-deep))] bg-[hsl(var(--golfer-deep))] text-white'
                : 'border-[hsl(var(--golfer-line))] bg-white text-[hsl(var(--golfer-deep))]'
            }`}
          >
            <SlidersHorizontal size={16} />
            Filters
          </button>
        }
      />

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-[28px] border border-[hsl(var(--golfer-line))] bg-white p-5 shadow-[0_20px_50px_-42px_rgba(12,25,19,0.35)]">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[hsl(var(--golfer-deep-soft))]/[0.56]">Coverage</p>
          <p className="mt-3 text-3xl text-[hsl(var(--golfer-deep))]">{catalogStats.totalCourses}</p>
          <p className="mt-2 text-sm text-[hsl(var(--golfer-deep-soft))]/[0.74]">courses ready to browse nationwide</p>
        </div>
        <div className="rounded-[28px] border border-[hsl(var(--golfer-line))] bg-white p-5 shadow-[0_20px_50px_-42px_rgba(12,25,19,0.35)]">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[hsl(var(--golfer-deep-soft))]/[0.56]">States</p>
          <p className="mt-3 text-3xl text-[hsl(var(--golfer-deep))]">{catalogStats.statesRepresented}</p>
          <p className="mt-2 text-sm text-[hsl(var(--golfer-deep-soft))]/[0.74]">places you can search across the country</p>
        </div>
        <div className="rounded-[28px] border border-[hsl(var(--golfer-line))] bg-white p-5 shadow-[0_20px_50px_-42px_rgba(12,25,19,0.35)]">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[hsl(var(--golfer-deep-soft))]/[0.56]">Map-ready</p>
          <p className="mt-3 text-3xl text-[hsl(var(--golfer-deep))]">{catalogStats.mappableCourses}</p>
          <p className="mt-2 text-sm text-[hsl(var(--golfer-deep-soft))]/[0.74]">courses currently pinned on the map</p>
        </div>
      </section>

      <section className="rounded-[32px] border border-[hsl(var(--golfer-line))] bg-white p-6 shadow-[0_24px_70px_-48px_rgba(12,25,19,0.35)] sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search courses, cities, or addresses..."
              className="w-full rounded-full border border-input bg-[hsl(var(--golfer-cream))] py-3 pl-11 pr-4 text-sm text-card-foreground outline-none focus:border-primary"
            />
            {query ? (
              <button onClick={() => setQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                <X size={14} />
              </button>
            ) : null}
          </div>
        </div>

        <div className={`mt-6 grid gap-5 ${showFilters ? 'block' : 'hidden'} lg:grid lg:grid-cols-2`}>
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">Course Type</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {courseTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    selectedType === type ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">Source Tags</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {tags.map((tag) => {
                const active = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => setSelectedTags(active ? selectedTags.filter((value) => value !== tag) : [...selectedTags, tag])}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                      active ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <SectionHeader
          title={query ? `Results for "${query}"` : 'Browse courses'}
          description={`${filtered.length} courses matching your current filters in the stored catalog.`}
        />
        {isLoading ? (
          <div className="rounded-[28px] border border-[hsl(var(--golfer-line))] bg-white p-10 text-center text-sm leading-7 text-[hsl(var(--golfer-deep-soft))]/[0.74]">
            Loading courses...
          </div>
        ) : filtered.length > 0 ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {displayedResults.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
            {resultOverflow > 0 ? (
              <p className="text-sm text-[hsl(var(--golfer-deep-soft))]/[0.72]">
                Showing the first {displayedResults.length} matches to keep discovery responsive. Narrow the search to explore more.
              </p>
            ) : null}
          </div>
        ) : (
          <div className="rounded-[28px] border border-dashed border-[hsl(var(--golfer-line))] bg-white p-10 text-center text-sm leading-7 text-[hsl(var(--golfer-deep-soft))]/[0.74]">
            {activeQuery || selectedType !== 'All' || selectedTags.length > 0
              ? 'No courses match the current query and filters. Try a broader search or clear a few filters.'
              : 'No course rows are available yet.'}
          </div>
        )}
      </section>
    </div>
  );
}
