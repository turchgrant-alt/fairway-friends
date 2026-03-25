import { FormEvent, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Compass, List, Map as MapIcon, MapPin, Search } from 'lucide-react';

import CourseCard from '@/components/CourseCard';
import CourseDiscoveryMap from '@/components/maps/CourseDiscoveryMap';
import {
  hasVerifiedCoordinates,
  loadCoursesForStates,
  searchCourseLocationEntries,
  searchCourses,
  sortCoursesByName,
  type Course,
} from '@/lib/course-data';
import { useCourseLocationIndex } from '@/hooks/use-course-catalog';
import { findRegionCode, getRegionName } from '@/lib/us-states';
import {
  findMapSearchPreset,
  normalizeMapSearchValue,
  type MapBoundsTuple,
  UK_IRELAND_BOUNDS,
  UNITED_STATES_BOUNDS,
} from '@/lib/map-search-locations';

type ViewMode = 'map' | 'list';
type RegionMode = 'us' | 'uk-ireland';

const MAP_PIN_LIMIT = 300;
const MAP_VIEW_RESULT_PREVIEW_LIMIT = 6;
const LIST_RESULT_LIMIT = 120;
const UK_IRELAND_STATE_CODES = ['ENG', 'SCT', 'IRL', 'NIR'] as const;

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

interface ActiveSearch {
  label: string;
  results: Course[];
  stateCodes: string[];
}

function getLocationMatchMaxZoom(type: 'state' | 'county' | 'city' | undefined) {
  if (type === 'city') return 10;
  if (type === 'county') return 8;
  return 7;
}

function isCourseInsideBounds(course: Course, bounds: MapBoundsTuple) {
  if (!hasVerifiedCoordinates(course)) return false;

  const [[south, west], [north, east]] = bounds;
  return (
    (course.latitude as number) >= south &&
    (course.latitude as number) <= north &&
    (course.longitude as number) >= west &&
    (course.longitude as number) <= east
  );
}

function buildBoundsForCourses(courseList: Course[]) {
  const mappableCourses = courseList.filter(hasVerifiedCoordinates);

  if (mappableCourses.length === 0) {
    return UNITED_STATES_BOUNDS;
  }

  const latitudes = mappableCourses.map((course) => course.latitude as number);
  const longitudes = mappableCourses.map((course) => course.longitude as number);

  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLon = Math.min(...longitudes);
  const maxLon = Math.max(...longitudes);

  const latPadding = Math.max((maxLat - minLat) * 0.18, 0.08);
  const lonPadding = Math.max((maxLon - minLon) * 0.18, 0.08);

  return [
    [minLat - latPadding, minLon - lonPadding],
    [maxLat + latPadding, maxLon + lonPadding],
  ] as MapBoundsTuple;
}

function mergeBounds(boundsList: MapBoundsTuple[]) {
  if (boundsList.length === 0) return null;

  const south = Math.min(...boundsList.map((bounds) => bounds[0][0]));
  const west = Math.min(...boundsList.map((bounds) => bounds[0][1]));
  const north = Math.max(...boundsList.map((bounds) => bounds[1][0]));
  const east = Math.max(...boundsList.map((bounds) => bounds[1][1]));

  return [
    [south, west],
    [north, east],
  ] as MapBoundsTuple;
}

export default function MapPage() {
  const navigate = useNavigate();
  const { data: locationIndex, isLoading: isLocationIndexLoading } = useCourseLocationIndex();
  const [loadedCourses, setLoadedCourses] = useState<Course[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const courseById = useMemo(() => new Map(loadedCourses.map((course) => [course.id, course])), [loadedCourses]);
  const mappableCourses = useMemo(
    () => sortCoursesByName(loadedCourses.filter(hasVerifiedCoordinates)),
    [loadedCourses],
  );

  const [viewMode, setViewMode] = useState<ViewMode>('map');
  const [regionMode, setRegionMode] = useState<RegionMode>('us');
  const [query, setQuery] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [activeSearch, setActiveSearch] = useState<ActiveSearch | null>(null);
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
  const isCatalogLoading = isLocationIndexLoading || isSearching;

  const visibleAreaCourses = useMemo(
    () => sortCoursesByName(mappableCourses.filter((course) => isCourseInsideBounds(course, viewport.bounds))),
    [mappableCourses, viewport.bounds],
  );

  const shouldShowPins = activeSearch !== null || loadedCourses.length > 0 || viewport.zoom >= 6.5;
  const mapCourses = shouldShowPins ? visibleAreaCourses.slice(0, MAP_PIN_LIMIT) : [];
  const selectedCourse = useMemo(() => {
    const course = selectedCourseId ? courseById.get(selectedCourseId) ?? null : null;
    return course && isCourseInsideBounds(course, viewport.bounds) ? course : null;
  }, [courseById, selectedCourseId, viewport.bounds]);

  const listCourses = useMemo(() => {
    if (loadedCourses.length > 0 || viewport.zoom >= 7) {
      return visibleAreaCourses;
    }

    return [];
  }, [loadedCourses.length, viewport.zoom, visibleAreaCourses]);

  const displayedListCourses = listCourses.slice(0, LIST_RESULT_LIMIT);
  const mapViewPreviewCourses = displayedListCourses.slice(0, MAP_VIEW_RESULT_PREVIEW_LIMIT);
  const mapCourseOverflow = Math.max(visibleAreaCourses.length - mapCourses.length, 0);
  const listOverflow = Math.max(listCourses.length - displayedListCourses.length, 0);
  const mapPreviewOverflow = Math.max(listCourses.length - mapViewPreviewCourses.length, 0);

  function resetToUnitedStates() {
    setQuery('');
    setSelectedCourseId(null);
    setActiveSearch(null);
    setLoadedCourses([]);
    setRegionMode('us');
    setFocusTarget({
      id: 'united-states',
      label: 'United States',
      bounds: UNITED_STATES_BOUNDS,
      maxZoom: 4,
    });
    setSearchMessage(null);
    setViewMode('map');
  }

  async function focusUkAndIreland() {
    setQuery('');
    setIsSearching(true);
    setSearchMessage(null);

    try {
      const stateCatalog = await loadCoursesForStates([...UK_IRELAND_STATE_CODES]);
      const mappableMatches = sortCoursesByName(stateCatalog.filter(hasVerifiedCoordinates));

      setRegionMode('uk-ireland');
      setLoadedCourses(stateCatalog);
      setActiveSearch({
        label: 'UK & Ireland',
        results: stateCatalog,
        stateCodes: [...UK_IRELAND_STATE_CODES],
      });
      setSelectedCourseId(mappableMatches[0]?.id ?? null);
      setFocusTarget({
        id: 'uk-and-ireland',
        label: 'UK & Ireland',
        bounds: UK_IRELAND_BOUNDS,
        maxZoom: 5,
      });
      setViewMode('map');

      if (stateCatalog.length === 0) {
        setSearchMessage('UK & Ireland is available as a map region, but no catalog rows were generated for it yet.');
        return;
      }

      if (mappableMatches.length === 0) {
        setSearchMessage(
          'UK & Ireland courses are loaded, but this snapshot does not include verified coordinates for those rows yet.',
        );
        return;
      }
    } catch {
      setSearchMessage('The UK & Ireland course files could not be loaded. Try again in a moment.');
    } finally {
      setIsSearching(false);
    }
  }

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedQuery = query.trim();
    const normalizedQuery = normalizeMapSearchValue(trimmedQuery);

    if (!normalizedQuery) {
      resetToUnitedStates();
      return;
    }

    const preset = findMapSearchPreset(normalizedQuery);
    if (!locationIndex) {
      setSearchMessage('Loading the location index. Try the search again in a moment.');
      return;
    }

    const locationMatches = searchCourseLocationEntries(locationIndex.entries, normalizedQuery);
    const matchedStateCode = findRegionCode(trimmedQuery);
    const presetStateCodes = preset?.id === 'uk-and-ireland' ? [...UK_IRELAND_STATE_CODES] : [];
    const stateCodes = Array.from(
      new Set(
        [
          matchedStateCode,
          ...presetStateCodes,
          ...locationMatches.map((entry) => entry.stateCode),
        ].filter(Boolean),
      ),
    ) as string[];

    const primaryLocationMatch = locationMatches[0] ?? null;
    const label =
      preset?.id === 'uk-and-ireland'
        ? preset.label
        : primaryLocationMatch?.label ?? preset?.label ?? getRegionName(matchedStateCode) ?? trimmedQuery;
    const locationBounds = mergeBounds(
      locationMatches
        .map((entry) => entry.bounds)
        .filter(Boolean) as MapBoundsTuple[],
    );

    if (stateCodes.length === 0) {
      setLoadedCourses([]);
      setActiveSearch({
        label,
        results: [],
        stateCodes: [],
      });
      setSelectedCourseId(null);
      setFocusTarget({
        id: preset?.id ?? `search-${normalizedQuery}`,
        label,
        bounds: preset?.bounds ?? locationBounds ?? UNITED_STATES_BOUNDS,
        maxZoom: preset?.maxZoom ?? getLocationMatchMaxZoom(primaryLocationMatch?.type),
      });
      setViewMode('map');
      setSearchMessage(
        preset
          ? `The map moved to ${label}, but the catalog does not have a matching region file to load there yet.`
          : `No catalog region matched "${trimmedQuery}".`,
      );
      return;
    }

    setIsSearching(true);

    try {
      const stateCatalog = await loadCoursesForStates(stateCodes);
      const datasetMatches = sortCoursesByName(
        preset?.id === 'uk-and-ireland' ? stateCatalog : searchCourses(stateCatalog, normalizedQuery),
      );
      const mappableMatches = datasetMatches.filter(hasVerifiedCoordinates);

      let nextBounds = preset?.bounds ?? locationBounds ?? UNITED_STATES_BOUNDS;
      let nextMaxZoom = preset?.maxZoom ?? getLocationMatchMaxZoom(primaryLocationMatch?.type);

      if (mappableMatches.length > 0) {
        nextBounds = buildBoundsForCourses(mappableMatches);
        nextMaxZoom = datasetMatches.length === 1 ? 11 : preset?.maxZoom ?? Math.max(getLocationMatchMaxZoom(primaryLocationMatch?.type), 8);
      }

      setLoadedCourses(stateCatalog);
      setActiveSearch({
        label,
        results: datasetMatches,
        stateCodes,
      });
      setRegionMode(
        stateCodes.every((stateCode) => UK_IRELAND_STATE_CODES.includes(stateCode as (typeof UK_IRELAND_STATE_CODES)[number]))
          ? 'uk-ireland'
          : 'us',
      );
      setSelectedCourseId(mappableMatches[0]?.id ?? null);
      setFocusTarget({
        id: preset?.id ?? primaryLocationMatch?.id ?? `search-${normalizedQuery}`,
        label,
        bounds: nextBounds,
        maxZoom: nextMaxZoom,
      });
      setViewMode('map');

      if (datasetMatches.length === 0) {
        setSearchMessage(
          preset || primaryLocationMatch
            ? `The map moved to ${label}, but the catalog does not have matching course records there yet.`
            : `No courses in the catalog matched "${trimmedQuery}".`,
        );
        return;
      }

      if (mappableMatches.length === 0) {
        setSearchMessage(
          `${datasetMatches.length} catalog result${datasetMatches.length === 1 ? '' : 's'} found for ${label}, but this snapshot does not include verified coordinates for those rows yet. Visible-area results only show courses that can be placed on the map.`,
        );
        return;
      }

      setSearchMessage(null);
    } catch {
      setSearchMessage('The matching region files could not be loaded. Try the search again.');
    } finally {
      setIsSearching(false);
    }
  }

  return (
    <div className="space-y-3">
      <section className="rounded-2xl border border-[hsl(var(--golfer-line))] bg-white/85 p-4 shadow-[0_24px_70px_-48px_rgba(12,25,19,0.35)] backdrop-blur-sm">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[hsl(var(--golfer-deep-soft))]/[0.62]">
              Map Discovery
            </p>
            <h1 className="mt-1 text-xl leading-tight text-[hsl(var(--golfer-deep))]">
              Search first, then explore the map naturally.
            </h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-[hsl(var(--golfer-deep-soft))]/[0.78]">
              GolfeR opens on a full U.S. view. Search a city, state, or region, or jump straight to UK & Ireland.
              Pins and list results stay tied to the current visible map area, and only courses with verified coordinates
              can appear there.
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
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium transition ${
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

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.24em] text-[hsl(var(--golfer-deep-soft))]/[0.56]">
            Start from
          </span>
          {[
            { value: 'us' as const, label: 'US' },
            { value: 'uk-ireland' as const, label: 'UK & Ireland' },
          ].map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                if (value === 'us') {
                  resetToUnitedStates();
                  return;
                }

                void focusUkAndIreland();
              }}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                regionMode === value
                  ? 'border-[hsl(var(--golfer-deep))] bg-[hsl(var(--golfer-deep))] text-white'
                  : 'border-[hsl(var(--golfer-line))] bg-white text-[hsl(var(--golfer-deep))]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearch} className="mt-3 flex flex-col gap-2 lg:flex-row">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by city, state, or region"
              className="h-9 w-full rounded-full border border-[hsl(var(--golfer-line))] bg-[hsl(var(--golfer-cream))] pl-9 pr-4 text-sm text-card-foreground outline-none transition focus:border-[hsl(var(--golfer-deep))]"
            />
          </div>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[hsl(var(--golfer-deep))] px-4 py-2 text-sm font-medium text-white transition hover:opacity-95"
          >
            Search area <ArrowRight size={14} />
          </button>
          <button
            type="button"
            onClick={resetToUnitedStates}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-[hsl(var(--golfer-line))] bg-white px-4 py-2 text-sm font-medium text-[hsl(var(--golfer-deep))]"
          >
            Reset map
          </button>
        </form>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[hsl(var(--golfer-deep-soft))]/[0.74]">
            Search uses a lightweight location index first, then loads only the matching region files. Pan or zoom the map to
            narrow the active results.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[hsl(var(--golfer-mist))] px-3 py-1 text-xs font-medium text-[hsl(var(--golfer-deep))]">
              {activeSearch ? `Started from: ${activeSearch.label}` : `Start area: ${focusTarget.label}`}
            </span>
            {activeSearch || loadedCourses.length > 0 ? (
              <span className="rounded-full bg-[hsl(var(--golfer-mist))] px-3 py-1 text-xs font-medium text-[hsl(var(--golfer-deep))]">
                {visibleAreaCourses.length} course{visibleAreaCourses.length === 1 ? '' : 's'} in view
              </span>
            ) : (
              <span className="rounded-full bg-[hsl(var(--golfer-mist))] px-3 py-1 text-xs font-medium text-[hsl(var(--golfer-deep))]">
                {isCatalogLoading
                  ? 'Loading search data...'
                  : `${visibleAreaCourses.length} verified pin${visibleAreaCourses.length === 1 ? '' : 's'} in view`}
              </span>
            )}
          </div>
        </div>

        {searchMessage ? (
          <p className="mt-3 rounded-xl bg-[hsl(var(--golfer-cream))] px-3 py-2 text-sm leading-6 text-[hsl(var(--golfer-deep-soft))]/[0.78]">
            {searchMessage}
          </p>
        ) : null}
      </section>

      <section className="relative overflow-hidden rounded-2xl border border-[hsl(var(--golfer-line))] bg-white shadow-[0_32px_90px_-55px_rgba(12,25,19,0.45)]">
        <div className="h-[60vh] min-h-[24rem]">
          <CourseDiscoveryMap
            courses={mapCourses}
            selectedCourseId={selectedCourseId}
            onSelectCourse={setSelectedCourseId}
            onViewportChange={setViewport}
            focusTarget={focusTarget}
          />
        </div>

        {selectedCourse && hasVerifiedCoordinates(selectedCourse) ? (
          <div className="pointer-events-none absolute inset-x-4 bottom-4 z-[500] sm:left-6 sm:right-auto sm:max-w-xl">
            <div className="pointer-events-auto overflow-hidden rounded-xl bg-white shadow-[0_24px_70px_-45px_rgba(12,25,19,0.45)]">
              <button
                onClick={() => setSelectedCourseId(null)}
                className="absolute right-3 top-3 z-10 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-[hsl(var(--golfer-deep))]"
              >
                Close
              </button>
              <button onClick={() => navigate(`/course/${selectedCourse.id}`)} className="flex w-full flex-col text-left sm:flex-row">
                <img src={selectedCourse.imageUrl} alt={selectedCourse.name} className="h-28 w-full shrink-0 object-cover sm:h-auto sm:w-28" />
                <div className="flex-1 p-3">
                  <h2 className="text-base font-semibold text-card-foreground">{selectedCourse.name}</h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">{selectedCourse.location}</p>
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
            <div className="rounded-xl border border-white/70 bg-white/92 px-3 py-2 shadow-[0_18px_50px_-36px_rgba(12,25,19,0.45)] backdrop-blur-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[hsl(var(--golfer-deep-soft))]/[0.56]">
                Map first
              </p>
              <p className="mt-1 text-xs leading-5 text-[hsl(var(--golfer-deep-soft))]/[0.78]">
                {shouldShowPins
                  ? 'Results update after each completed pan or zoom. Only courses inside the visible bounds stay active.'
                  : 'Search a city, state, or region to load map pins from the catalog.'}
              </p>
              {mapCourseOverflow > 0 ? (
                <p className="mt-2 text-xs text-[hsl(var(--golfer-deep-soft))]/[0.68]">
                  Showing the first {mapCourses.length} pins in view for clarity.
                </p>
              ) : null}
            </div>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[hsl(var(--golfer-deep-soft))]/[0.56]">
              {viewMode === 'map' ? 'Results In View' : 'List View'}
            </p>
            <h2 className="mt-1 text-lg text-[hsl(var(--golfer-deep))]">
              Courses inside the current map area
            </h2>
            <p className="mt-1 text-sm leading-6 text-[hsl(var(--golfer-deep-soft))]/[0.74]">
              Search sets the starting area. After that, this list follows the visible map bounds and updates when the
              current pan or zoom finishes.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="rounded-full bg-[hsl(var(--golfer-mist))] px-3 py-1.5 text-xs font-medium text-[hsl(var(--golfer-deep))]">
              {listCourses.length} result{listCourses.length === 1 ? '' : 's'}
            </div>
            {viewMode === 'map' && listCourses.length > MAP_VIEW_RESULT_PREVIEW_LIMIT ? (
              <button
                onClick={() => setViewMode('list')}
                className="rounded-full border border-[hsl(var(--golfer-line))] bg-white px-3 py-1.5 text-xs font-medium text-[hsl(var(--golfer-deep))]"
              >
                Expand list
              </button>
            ) : null}
          </div>
        </div>

        {isCatalogLoading ? (
          <div className="rounded-xl border border-[hsl(var(--golfer-line))] bg-white p-6 text-center text-sm text-[hsl(var(--golfer-deep-soft))]/[0.74]">
            Loading the matching stored course data...
          </div>
        ) : !activeSearch && loadedCourses.length === 0 && viewport.zoom < 7 ? (
          <div className="rounded-xl border border-dashed border-[hsl(var(--golfer-line))] bg-white p-6 text-center">
            <div className="mx-auto max-w-2xl">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[hsl(var(--golfer-mist))] text-[hsl(var(--golfer-deep))]">
                <Compass size={16} />
              </span>
              <h3 className="mt-3 text-lg text-[hsl(var(--golfer-deep))]">Search or zoom in to browse results</h3>
              <p className="mt-2 text-sm leading-6 text-[hsl(var(--golfer-deep-soft))]/[0.74]">
                The initial U.S. view stays intentionally broad. Search for a city, state, or region first, or zoom into a
                tighter region on the map, and the visible-area results will respond automatically.
              </p>
            </div>
          </div>
        ) : viewMode === 'map' && mapViewPreviewCourses.length > 0 ? (
          <div className="space-y-3">
            <div className="grid gap-3 xl:grid-cols-2">
              {mapViewPreviewCourses.map((course) => (
                <CourseCard key={course.id} course={course} variant="compact" />
              ))}
            </div>
            {mapPreviewOverflow > 0 ? (
              <p className="text-sm text-[hsl(var(--golfer-deep-soft))]/[0.72]">
                Showing the first {mapViewPreviewCourses.length} courses in view. Switch to List View for the full visible-area list.
              </p>
            ) : null}
          </div>
        ) : viewMode === 'list' && displayedListCourses.length > 0 ? (
          <div className="space-y-3">
            <div className="grid gap-3 xl:grid-cols-2">
              {displayedListCourses.map((course) => (
                <CourseCard key={course.id} course={course} variant="compact" />
              ))}
            </div>
            {listOverflow > 0 ? (
              <p className="text-sm text-[hsl(var(--golfer-deep-soft))]/[0.72]">
                Showing the first {displayedListCourses.length} results to keep List View readable.
              </p>
            ) : null}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-[hsl(var(--golfer-line))] bg-white p-6 text-center">
            <div className="mx-auto max-w-2xl">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[hsl(var(--golfer-mist))] text-[hsl(var(--golfer-deep))]">
                <MapPin size={16} />
              </span>
              <h3 className="mt-3 text-lg text-[hsl(var(--golfer-deep))]">No courses to show here yet</h3>
              <p className="mt-2 text-sm leading-6 text-[hsl(var(--golfer-deep-soft))]/[0.74]">
                {loadedCourses.length > 0
                  ? 'The current visible map bounds do not contain courses with verified coordinates yet. Pan wider, zoom out, or try another search.'
                  : 'This part of the map does not currently contain courses with verified coordinates in the stored dataset. Try another region.'}
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
