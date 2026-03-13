import type { AppGolfCourseRecord, CourseCatalogManifest, CourseCatalogSummary } from "@/lib/course-data-model";
import { generatedCourseManifest, generatedCourseSummary } from "@/data/generated/courseCatalog.generated";
import { findUsStateCode } from "@/lib/us-states";

export type Course = AppGolfCourseRecord;

export const COURSE_CATALOG_QUERY_KEY = ["course-catalog"] as const;
export const COURSE_CATALOG_PUBLIC_PATH = "/data/courseCatalog.generated.json";

export const courseManifest: CourseCatalogManifest = generatedCourseManifest;
export const courseSummary: CourseCatalogSummary = generatedCourseSummary;
export const representedCourseStates = generatedCourseManifest.stateCodes;

// Keep a small synchronous course slice available for lightweight summary surfaces.
export const courses: Course[] = Array.from(
  new Map(
    [...courseSummary.featuredCourses, ...courseSummary.starterLists.flatMap((list) => list.courses)].map((course) => [
      course.id,
      course,
    ]),
  ).values(),
);

let courseCatalogPromise: Promise<Course[]> | null = null;

export async function loadCourseCatalog(): Promise<Course[]> {
  if (!courseCatalogPromise) {
    courseCatalogPromise = fetch(COURSE_CATALOG_PUBLIC_PATH).then(async (response) => {
      if (!response.ok) {
        throw new Error(`Failed to load course catalog (${response.status})`);
      }

      return (await response.json()) as Course[];
    });
  }

  return courseCatalogPromise;
}

export function findCourseById(courseList: Course[], id: string): Course | undefined {
  return courseList.find((course) => course.id === id);
}

export function getCourseById(id: string): Course | undefined {
  return findCourseById(courses, id);
}

export function getCoursesByState(courseList: Course[], stateCode: string): Course[] {
  return courseList.filter((course) => course.stateCode === stateCode.toUpperCase());
}

export function hasVerifiedCoordinates(course: Course): boolean {
  return course.hasVerifiedCoordinates && course.latitude != null && course.longitude != null;
}

export function getCourseSearchTargets(course: Course): string[] {
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
    course.fullAddress,
  ].filter(Boolean) as string[];
}

export function searchCourses(courseList: Course[], query: string): Course[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return courseList;

  const matchingStateCode = findUsStateCode(normalizedQuery);

  if (matchingStateCode) {
    return courseList.filter((course) => course.stateCode === matchingStateCode);
  }

  return courseList.filter((course) =>
    getCourseSearchTargets(course).some((value) => value.toLowerCase().includes(normalizedQuery)),
  );
}

export function sortCoursesByName(courseList: Course[]): Course[] {
  return [...courseList].sort((a, b) => a.name.localeCompare(b.name));
}

export function sortCoursesByRatingOrName(courseList: Course[]): Course[] {
  return [...courseList].sort((a, b) => {
    if (a.overallRating != null && b.overallRating != null) {
      return b.overallRating - a.overallRating;
    }

    if (a.overallRating != null) return -1;
    if (b.overallRating != null) return 1;

    return a.name.localeCompare(b.name);
  });
}
