import { FormEvent, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Compass, List, Map as MapIcon, MapPin, Search } from 'lucide-react';

import CourseCard from '@/components/CourseCard';
import CourseDiscoveryMap from '@/components/maps/CourseDiscoveryMap';
import { courses, sortCoursesByName } from '@/lib/course-data';
import {
  findMapSearchPreset,
  normalizeMapSearchValue,
  type MapBoundsTuple,
  UNITED_STATES_BOUNDS,
} from '@/lib/map-search-locations';

type ViewMode = 'map' | 'list';

interface FocusTarget {
  id: string;
  label: string;
  bounds: MapBoundsTuple;
  maxZoom?: number;
}

interface ViewportState {
  bounds: MapBoundsTuple;
  zoom: number;
}

function hasCoordinates(course: typeof courses[number]) {
  return course.latitude != null && course.longitude != null;
}

function isCourseInsideBounds(course: typeof courses[number], bounds: MapBoundsTuple) {
  if (!hasCoordinates(course)) return false;

  const [[south, west], [north, east]] = bounds;
  return (
    (course.latitude as number) >= south &&
    (course.latitude as number) <= north &&
    (course.longitude as number) >= west &&
    (course.longitude as number) <= east
  );
}

function buildBoundsForCourses(courseList: typeof courses) {
  const mappableCourses = courseList.filter(hasCoordinates);

  if (mappableCourses.length === 0) {
    return UNITED_STATES_BOUNDS;
  }

  const latitudes = mappableCourses.map((course) => course.latitude as number);
  const longitudes = mappableCourses.map((course) => course.longitude as number);

  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLon = Math.min(...longitudes);
  const maxLon = Math.max(...longitudes);

  const latPadding = Math.max((maxLat - minLat) * 0.16, 0.08);
  const lonPadding = Math.max((maxLon - minLon) * 0.16, 0.08);

  return [
    [minLat - latPadding, minLon - lonPadding],
    [maxLat + latPadding, maxLon + lonPadding],
  ] as MapBoundsTuple;
}

export default function MapPage() {
  const navigate = useNavigate();
  const mappableCourses = useMemo(() => courses.filter(hasCoordinates), []);
  const [viewMode, setViewMode] = useState<ViewMode>('map');
  const [query, setQuery] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [focusTarget, setFocusTarget] = useState<FocusTarget>({
    id: 'united-states',
    label: 'United States',
    bounds: UNITED_STATES_BOUNDS,
    maxZoom: 4,
  });
  const [viewport, setViewport] = useState<ViewportState>({
    bounds: UNITED_STATES_BOUNDS,
    zoom: 4,
  });
  const [searchMessage, setSearchMessage] = useState<string | null>(null);

  const selectedCourse = mappableCourses.find((course) => course.id === selectedCourseId) ?? null;
  const visibleCourses = useMemo(
    () => sortCoursesByName(mappableCourses.filter((course) => isCourseInsideBounds(course, viewport.bounds))),
    [mappableCourses, viewport.bounds],
  );
  const canBrowseList = viewport.zoom >= 5.5 || focusTarget.id !== 'united-states';

  function resetToUnitedStates() {
    setSelectedCourseId(null);
    setFocusTarget({
      id: 'united-states',
      label: 'United States',
      bounds: UNITED_STATES_BOUNDS,
      maxZoom: 4,
    });
    setSearchMessage(null);
    setViewMode('map');
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedQuery = normalizeMapSearchValue(query);

    if (!normalizedQuery) {
      resetToUnitedStates();
      return;
    }

    const preset = findMapSearchPreset(normalizedQuery);
    if (preset) {
      setSelectedCourseId(null);
      setFocusTarget({
        id: preset.id,
        label: preset.label,
        bounds: preset.bounds,
        maxZoom: preset.maxZoom,
      });
      setSearchMessage(null);
      setViewMode('map');
      return;
    }

    const datasetMatches = mappableCourses.filter((course) => {
      const searchTargets = [
        course.name,
        course.city,
        course.state,
        course.location,
        course.addressLabel,
      ].filter(Boolean) as string[];

      return searchTargets.some((value) => value.toLowerCase().includes(normalizedQuery));
    });

    if (datasetMatches.length > 0) {
      const bounds = buildBoundsForCourses(datasetMatches);
      const label = datasetMatches.length === 1 ? datasetMatches[0].name : query.trim();

      setSelectedCourseId(datasetMatches[0]?.id ?? null);
      setFocusTarget({
        id: `dataset-${normalizedQuery}`,
        label,
        bounds,
        maxZoom: datasetMatches.length === 1 ? 11 : 9,
      });
      setSearchMessage(null);
      setViewMode('map');
      return;
    }

    setSearchMessage('No matching city or state is configured yet. Try Scottsdale, New York, or a New York course city.');
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-[hsl(var(--golfer-line))] bg-white/85 p-6 shadow-[0_24px_70px_-48px_rgba(12,25,19,0.35)] backdrop-blur-sm sm:p-8">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[hsl(var(--golfer-deep-soft))]/[0.62]">
              Map Discovery
            </p>
            <h1 className="mt-3 text-3xl leading-tight text-[hsl(var(--golfer-deep))] sm:text-4xl">
              Explore golf by map first.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[hsl(var(--golfer-deep-soft))]/[0.78] sm:text-base">
              Start with a wide U.S. view, search for a city or state, then pan and zoom naturally from there. The map
              is the product here, and the list only appears when you actually want to browse results.
            </p>
          </div>

          <div className="inline-flex rounded-full border border-[hsl(var(--golfer-line))] bg-[hsl(var(--golfer-cream))] p-1">
            {[
              { value: 'map' as const, label: 'Map View', icon: MapIcon },
              { value: 'list' as const, label: 'List View', icon: List },
            ].map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setViewMode(value)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition ${
                  viewMode === value
                    ? 'bg-[hsl(var(--golfer-deep))] text-white shadow-[0_18px_38px_-28px_rgba(12,25,19,0.5)]'
                    : 'text-[hsl(var(--golfer-deep-soft))]/[0.82] hover:text-[hsl(var(--golfer-deep))]'
                }`}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSearch} className="mt-6 flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by city or state, like Scottsdale or New York"
              className="w-full rounded-full border border-[hsl(var(--golfer-line))] bg-[hsl(var(--golfer-cream))] py-3.5 pl-11 pr-4 text-sm text-card-foreground outline-none transition focus:border-[hsl(var(--golfer-deep))]"
            />
          </div>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[hsl(var(--golfer-deep))] px-5 py-3.5 text-sm font-medium text-white transition hover:opacity-95"
          >
            Search area <ArrowRight size={16} />
          </button>
          <button
            type="button"
            onClick={resetToUnitedStates}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-[hsl(var(--golfer-line))] bg-white px-5 py-3.5 text-sm font-medium text-[hsl(var(--golfer-deep))]"
          >
            Reset U.S. view
          </button>
        </form>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[hsl(var(--golfer-deep-soft))]/[0.74]">
            Try Scottsdale, Arizona, New York, or a New York course city from the current dataset.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[hsl(var(--golfer-mist))] px-3 py-1 text-xs font-medium text-[hsl(var(--golfer-deep))]">
              Current area: {focusTarget.label}
            </span>
            <span className="rounded-full bg-[hsl(var(--golfer-mist))] px-3 py-1 text-xs font-medium text-[hsl(var(--golfer-deep))]">
              {visibleCourses.length} course{visibleCourses.length === 1 ? '' : 's'} in view
            </span>
          </div>
        </div>

        {searchMessage ? (
          <p className="mt-4 rounded-[22px] bg-[hsl(var(--golfer-cream))] px-4 py-3 text-sm leading-7 text-[hsl(var(--golfer-deep-soft))]/[0.78]">
            {searchMessage}
          </p>
        ) : null}
      </section>

      {viewMode === 'map' ? (
        <section className="relative overflow-hidden rounded-[34px] border border-[hsl(var(--golfer-line))] bg-white shadow-[0_32px_90px_-55px_rgba(12,25,19,0.45)]">
          <div className="h-[72vh] min-h-[34rem]">
            <CourseDiscoveryMap
              courses={mappableCourses}
              selectedCourseId={selectedCourseId}
              onSelectCourse={setSelectedCourseId}
              onViewportChange={setViewport}
              focusTarget={focusTarget}
            />
          </div>

          {selectedCourse ? (
            <div className="pointer-events-none absolute inset-x-4 bottom-4 z-[500] sm:left-6 sm:right-auto sm:max-w-xl">
              <div className="pointer-events-auto overflow-hidden rounded-[28px] bg-white shadow-[0_24px_70px_-45px_rgba(12,25,19,0.45)]">
                <button
                  onClick={() => setSelectedCourseId(null)}
                  className="absolute right-4 top-4 z-10 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-[hsl(var(--golfer-deep))]"
                >
                  Close
                </button>
                <button onClick={() => navigate(`/course/${selectedCourse.id}`)} className="flex w-full flex-col text-left sm:flex-row">
                  <img src={selectedCourse.imageUrl} alt={selectedCourse.name} className="h-40 w-full shrink-0 object-cover sm:h-auto sm:w-40" />
                  <div className="flex-1 p-5">
                    <h2 className="text-xl font-semibold text-card-foreground">{selectedCourse.name}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{selectedCourse.location}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] capitalize text-secondary-foreground">
                        {selectedCourse.type}
                      </span>
                      {selectedCourse.holes != null ? (
                        <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] text-secondary-foreground">
                          {selectedCourse.holes} holes
                        </span>
                      ) : null}
                      {selectedCourse.par != null ? (
                        <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] text-secondary-foreground">
                          Par {selectedCourse.par}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </button>
              </div>
            </div>
          ) : (
            <div className="pointer-events-none absolute bottom-4 left-4 z-[500] sm:left-6">
              <div className="rounded-[24px] border border-white/70 bg-white/92 px-4 py-3 shadow-[0_18px_50px_-36px_rgba(12,25,19,0.45)] backdrop-blur-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[hsl(var(--golfer-deep-soft))]/[0.56]">
                  Map first
                </p>
                <p className="mt-2 text-sm leading-7 text-[hsl(var(--golfer-deep-soft))]/[0.78]">
                  Search a city or state, then tap a pin for course details.
                </p>
              </div>
            </div>
          )}
        </section>
      ) : (
        <section className="space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[hsl(var(--golfer-deep-soft))]/[0.56]">
                List View
              </p>
              <h2 className="mt-2 text-3xl text-[hsl(var(--golfer-deep))]">Courses in the current map area</h2>
              <p className="mt-2 text-sm leading-7 text-[hsl(var(--golfer-deep-soft))]/[0.74]">
                {focusTarget.label} is active. Pan or zoom the map, then switch back here to browse what is currently in view.
              </p>
            </div>
            <div className="rounded-full bg-[hsl(var(--golfer-mist))] px-4 py-2 text-sm font-medium text-[hsl(var(--golfer-deep))]">
              {visibleCourses.length} result{visibleCourses.length === 1 ? '' : 's'}
            </div>
          </div>

          {!canBrowseList ? (
            <div className="rounded-[28px] border border-dashed border-[hsl(var(--golfer-line))] bg-white p-10 text-center">
              <div className="mx-auto max-w-2xl">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[hsl(var(--golfer-mist))] text-[hsl(var(--golfer-deep))]">
                  <Compass size={18} />
                </span>
                <h3 className="mt-5 text-2xl text-[hsl(var(--golfer-deep))]">Search or zoom in to browse results</h3>
                <p className="mt-3 text-sm leading-8 text-[hsl(var(--golfer-deep-soft))]/[0.74]">
                  The initial U.S. view is intentionally broad. Search for a city or state, or zoom into a region on the
                  map first, then switch back to List View for a cleaner results page.
                </p>
              </div>
            </div>
          ) : visibleCourses.length > 0 ? (
            <div className="grid gap-4 xl:grid-cols-2">
              {visibleCourses.map((course) => (
                <CourseCard key={course.id} course={course} variant="compact" />
              ))}
            </div>
          ) : (
            <div className="rounded-[28px] border border-dashed border-[hsl(var(--golfer-line))] bg-white p-10 text-center">
              <div className="mx-auto max-w-2xl">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[hsl(var(--golfer-mist))] text-[hsl(var(--golfer-deep))]">
                  <MapPin size={18} />
                </span>
                <h3 className="mt-5 text-2xl text-[hsl(var(--golfer-deep))]">No courses in this view yet</h3>
                <p className="mt-3 text-sm leading-8 text-[hsl(var(--golfer-deep-soft))]/[0.74]">
                  The current viewport is ready, but the New York-first dataset does not have courses inside this area yet.
                  Try New York or another supported search target.
                </p>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
