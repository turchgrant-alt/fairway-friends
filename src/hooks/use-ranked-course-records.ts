import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";

import {
  COURSE_STATE_QUERY_KEY,
  getCourseById,
  inferStateCodeFromCourseId,
  loadCoursesForState,
  type Course,
} from "@/lib/course-data";
import type { PlayedCourseRankingRecord } from "@/lib/course-rankings";

export interface RankedCourseRecord {
  ranking: PlayedCourseRankingRecord;
  course: Course | null;
  fallbackName: string;
  fallbackLocation: string;
}

export function useRankedCourseRecords(rankedCourses: PlayedCourseRankingRecord[]) {
  const stateCodes = useMemo(
    () =>
      Array.from(
        new Set(
          rankedCourses
            .map((course) => inferStateCodeFromCourseId(course.courseId))
            .filter((stateCode): stateCode is string => Boolean(stateCode)),
        ),
      ),
    [rankedCourses],
  );

  const stateQueries = useQueries({
    queries: stateCodes.map((stateCode) => ({
      queryKey: [...COURSE_STATE_QUERY_KEY, stateCode],
      queryFn: () => loadCoursesForState(stateCode),
      staleTime: Infinity,
      gcTime: Infinity,
    })),
  });

  const courseById = useMemo(() => {
    const nextMap = new Map<string, Course>();

    stateQueries.forEach((query) => {
      (query.data ?? []).forEach((course) => {
        nextMap.set(course.id, course);
      });
    });

    return nextMap;
  }, [stateQueries]);

  const records = useMemo<RankedCourseRecord[]>(
    () =>
      rankedCourses.map((ranking) => {
        const course = courseById.get(ranking.courseId) ?? null;
        const fallbackCourse = getCourseById(ranking.courseId);

        return {
          ranking,
          course,
          fallbackName: fallbackCourse?.name ?? ranking.courseId,
          fallbackLocation: fallbackCourse?.location ?? "Stored local ranking",
        };
      }),
    [courseById, rankedCourses],
  );

  const isLoading = stateQueries.some((query) => query.isLoading);
  const hasError = stateQueries.some((query) => query.isError);

  return {
    records,
    isLoading,
    hasError,
  };
}
