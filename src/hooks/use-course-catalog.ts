import { useQuery } from "@tanstack/react-query";

import {
  COURSE_INDEX_QUERY_KEY,
  COURSE_LOCATION_INDEX_QUERY_KEY,
  COURSE_STATE_QUERY_KEY,
  inferStateCodeFromCourseId,
  loadCourseById,
  loadCourseIndex,
  loadCourseLocationIndex,
  loadCoursesForState,
} from "@/lib/course-data";

export function useCourseCatalogIndex() {
  return useQuery({
    queryKey: COURSE_INDEX_QUERY_KEY,
    queryFn: loadCourseIndex,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

export function useCourseLocationIndex() {
  return useQuery({
    queryKey: COURSE_LOCATION_INDEX_QUERY_KEY,
    queryFn: loadCourseLocationIndex,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

export function useStateCourseCatalog(stateCode: string | null | undefined) {
  const normalizedStateCode = stateCode?.trim().toUpperCase() ?? "";

  return useQuery({
    queryKey: [...COURSE_STATE_QUERY_KEY, normalizedStateCode],
    queryFn: () => loadCoursesForState(normalizedStateCode),
    enabled: normalizedStateCode.length > 0,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

export function useCourseRecord(courseId: string | null | undefined) {
  const normalizedCourseId = courseId?.trim() ?? "";
  const stateCode = inferStateCodeFromCourseId(normalizedCourseId);

  return useQuery({
    queryKey: [...COURSE_STATE_QUERY_KEY, stateCode ?? "unknown", normalizedCourseId],
    queryFn: () => loadCourseById(normalizedCourseId),
    enabled: normalizedCourseId.length > 0 && stateCode != null,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}
