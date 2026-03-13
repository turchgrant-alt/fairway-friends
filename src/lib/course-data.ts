import type { AppGolfCourseRecord, CourseCatalogManifest } from "@/lib/course-data-model";
import { generatedCourseManifest, generatedCourses } from "@/data/generated/courseCatalog.generated";
import { findUsStateCode } from "@/lib/us-states";

export type Course = AppGolfCourseRecord;

export const courseManifest: CourseCatalogManifest = generatedCourseManifest;
export const representedCourseStates = generatedCourseManifest.stateCodes;
export const courses: Course[] = generatedCourses;

export function getCourseById(id: string): Course | undefined {
  return courses.find((course) => course.id === id);
}

export function getCoursesByState(stateCode: string): Course[] {
  return courses.filter((course) => course.stateCode === stateCode.toUpperCase());
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

export function searchCourses(query: string): Course[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return courses;

  const matchingStateCode = findUsStateCode(normalizedQuery);

  if (matchingStateCode) {
    return courses.filter((course) => course.stateCode === matchingStateCode);
  }

  return courses.filter((course) => {
    return getCourseSearchTargets(course).some((value) => value.toLowerCase().includes(normalizedQuery));
  });
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
