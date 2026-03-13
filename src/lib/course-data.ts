import type { AppGolfCourseRecord, CourseStateManifest } from "@/lib/course-data-model";
import { generatedCourseManifest, generatedCourses } from "@/data/generated/courseCatalog.generated";

export type Course = AppGolfCourseRecord;

export const courseManifest: CourseStateManifest = generatedCourseManifest;
export const completedCourseStates = generatedCourseManifest.completedStates;
export const courses: Course[] = generatedCourses;

export function getCourseById(id: string): Course | undefined {
  return courses.find((course) => course.id === id);
}

export function getCoursesByState(stateCode: string): Course[] {
  return courses.filter((course) => course.stateCode === stateCode.toUpperCase());
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
