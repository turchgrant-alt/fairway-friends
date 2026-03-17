import {
  generatedCourseManifest,
  generatedCourseSummary,
} from "@/data/generated/courseCatalog.generated";
import type {
  AppGolfCourseRecord,
  CourseCatalogManifest,
  CourseCatalogSummary,
  CourseIndexRecord,
  CourseLocationIndex,
  CourseLocationIndexEntry,
  CourseTourHistoryType,
} from "@/lib/course-data-model";
import { findUsStateCode } from "@/lib/us-states";

export type Course = AppGolfCourseRecord;
export type CoursePreview = CourseIndexRecord;
export type CourseListRecord = Course | CoursePreview;

export const COURSE_INDEX_QUERY_KEY = ["course-catalog-index"] as const;
export const COURSE_LOCATION_INDEX_QUERY_KEY = ["course-location-index"] as const;
export const COURSE_STATE_QUERY_KEY = ["course-state-catalog"] as const;

export const COURSE_INDEX_PUBLIC_PATH = "/data/courseCatalog.index.generated.json";
export const COURSE_LOCATION_INDEX_PUBLIC_PATH = "/data/courseLocationIndex.generated.json";
export const COURSE_STATE_PUBLIC_PATH_PREFIX = "/data/states";

export const courseManifest: CourseCatalogManifest = generatedCourseManifest;
export const courseSummary: CourseCatalogSummary = generatedCourseSummary;
export const representedCourseStates = generatedCourseManifest.stateCodes;

// Keep a tiny synchronous slice available for summary surfaces and dormant code paths.
export const courses: CoursePreview[] = Array.from(
  new Map(
    [...courseSummary.featuredCourses, ...courseSummary.starterLists.flatMap((list) => list.courses)].map((course) => [
      course.id,
      course,
    ]),
  ).values(),
);

let courseIndexPromise: Promise<CoursePreview[]> | null = null;
let courseLocationIndexPromise: Promise<CourseLocationIndex> | null = null;
const courseStatePromises = new Map<string, Promise<Course[]>>();

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(path);

  if (!response.ok) {
    throw new Error(`Failed to load ${path} (${response.status})`);
  }

  return (await response.json()) as T;
}

export async function loadCourseIndex(): Promise<CoursePreview[]> {
  if (!courseIndexPromise) {
    courseIndexPromise = fetchJson<CoursePreview[]>(COURSE_INDEX_PUBLIC_PATH);
  }

  return courseIndexPromise;
}

export async function loadCourseLocationIndex(): Promise<CourseLocationIndex> {
  if (!courseLocationIndexPromise) {
    courseLocationIndexPromise = fetchJson<CourseLocationIndex>(COURSE_LOCATION_INDEX_PUBLIC_PATH);
  }

  return courseLocationIndexPromise;
}

export function normalizeCourseStateCode(stateCode: string | null | undefined) {
  const normalized = stateCode?.trim().toUpperCase() ?? "";
  return normalized.length > 0 ? normalized : null;
}

export async function loadCoursesForState(stateCode: string): Promise<Course[]> {
  const normalizedStateCode = normalizeCourseStateCode(stateCode);

  if (!normalizedStateCode) {
    return [];
  }

  const cachedPromise = courseStatePromises.get(normalizedStateCode);
  if (cachedPromise) {
    return cachedPromise;
  }

  const nextPromise = fetchJson<Course[]>(
    `${COURSE_STATE_PUBLIC_PATH_PREFIX}/${normalizedStateCode}.generated.json`,
  );
  courseStatePromises.set(normalizedStateCode, nextPromise);

  return nextPromise;
}

export async function loadCoursesForStates(stateCodes: string[]): Promise<Course[]> {
  const uniqueStateCodes = Array.from(new Set(stateCodes.map(normalizeCourseStateCode).filter(Boolean))) as string[];
  if (uniqueStateCodes.length === 0) return [];

  const stateCatalogs = await Promise.all(uniqueStateCodes.map((stateCode) => loadCoursesForState(stateCode)));
  return stateCatalogs.flat();
}

export function inferStateCodeFromCourseId(courseId: string | null | undefined) {
  const normalizedCourseId = courseId?.trim().toLowerCase() ?? "";
  if (!normalizedCourseId) return null;

  const [stateSegment] = normalizedCourseId.split("-");
  if (!stateSegment || stateSegment.length < 2) return null;

  return normalizeCourseStateCode(stateSegment);
}

export async function loadCourseById(courseId: string): Promise<Course | null> {
  const stateCode = inferStateCodeFromCourseId(courseId);
  if (!stateCode) return null;

  const courseList = await loadCoursesForState(stateCode);
  return findCourseById(courseList, courseId) ?? null;
}

export function findCourseById<T extends { id: string }>(courseList: T[], id: string): T | undefined {
  return courseList.find((course) => course.id === id);
}

export function getCourseById(id: string): CoursePreview | undefined {
  return findCourseById(courses, id);
}

export function getCoursesByState<T extends { stateCode: string }>(courseList: T[], stateCode: string): T[] {
  const normalizedStateCode = normalizeCourseStateCode(stateCode);
  if (!normalizedStateCode) return [];

  return courseList.filter((course) => normalizeCourseStateCode(course.stateCode) === normalizedStateCode);
}

export function hasVerifiedCoordinates(course: {
  hasVerifiedCoordinates?: boolean;
  latitude: number | null;
  longitude: number | null;
}) {
  return Boolean(course.hasVerifiedCoordinates && course.latitude != null && course.longitude != null);
}

export function hasTourHistory(course: {
  hasPgaOrLpgaTourHistory?: boolean | null;
}) {
  return course.hasPgaOrLpgaTourHistory === true;
}

export function getTourHistoryLabel(course: {
  hasPgaOrLpgaTourHistory?: boolean | null;
  pgaLpgaTourHistoryType?: CourseTourHistoryType;
}) {
  if (!hasTourHistory(course)) return null;

  switch (course.pgaLpgaTourHistoryType) {
    case "pga":
      return "Hosted PGA event";
    case "lpga":
      return "Hosted LPGA event";
    case "pga_lpga":
      return "Hosted PGA / LPGA event";
    default:
      return "PGA / LPGA host";
  }
}

export function getCourseSearchTargets(course: CourseListRecord): string[] {
  return [
    course.name,
    course.facilityName,
    course.courseName,
    course.city,
    course.county,
    course.state,
    course.stateCode,
    course.location,
    course.addressLabel,
    "fullAddress" in course ? course.fullAddress : null,
  ].filter(Boolean) as string[];
}

export function searchCourses<T extends CourseListRecord>(courseList: T[], query: string): T[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return courseList;

  const matchingStateCode = findUsStateCode(normalizedQuery);

  if (matchingStateCode) {
    return courseList.filter((course) => normalizeCourseStateCode(course.stateCode) === matchingStateCode);
  }

  return courseList.filter((course) =>
    getCourseSearchTargets(course).some((value) => value.toLowerCase().includes(normalizedQuery)),
  );
}

function locationEntrySearchTargets(entry: CourseLocationIndexEntry) {
  return [entry.label, entry.city, entry.state, entry.stateCode, ...entry.aliases].filter(Boolean) as string[];
}

function locationEntryMatchScore(entry: CourseLocationIndexEntry, normalizedQuery: string) {
  let bestScore = 0;

  for (const value of locationEntrySearchTargets(entry)) {
    const normalizedValue = value.trim().toLowerCase();
    if (!normalizedValue) continue;
    if (normalizedValue === normalizedQuery) return 100;
    if (normalizedValue.startsWith(normalizedQuery)) {
      bestScore = Math.max(bestScore, 75);
      continue;
    }
    if (normalizedValue.includes(normalizedQuery)) {
      bestScore = Math.max(bestScore, 50);
    }
  }

  return bestScore;
}

export function searchCourseLocationEntries(entries: CourseLocationIndexEntry[], query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return [];

  return entries
    .map((entry) => ({
      entry,
      score: locationEntryMatchScore(entry, normalizedQuery),
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.entry.mappableCourseCount !== a.entry.mappableCourseCount) {
        return b.entry.mappableCourseCount - a.entry.mappableCourseCount;
      }
      if (b.entry.courseCount !== a.entry.courseCount) {
        return b.entry.courseCount - a.entry.courseCount;
      }
      return a.entry.label.localeCompare(b.entry.label);
    })
    .map(({ entry }) => entry);
}

export function sortCoursesByName<T extends { name: string }>(courseList: T[]): T[] {
  return [...courseList].sort((a, b) => a.name.localeCompare(b.name));
}

export function sortCoursesByRatingOrName<T extends { overallRating: number | null; name: string }>(courseList: T[]): T[] {
  return [...courseList].sort((a, b) => {
    if (a.overallRating != null && b.overallRating != null) {
      return b.overallRating - a.overallRating;
    }

    if (a.overallRating != null) return -1;
    if (b.overallRating != null) return 1;

    return a.name.localeCompare(b.name);
  });
}
