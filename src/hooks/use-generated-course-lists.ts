import { useQuery } from "@tanstack/react-query";

import {
  GENERATED_COURSE_LISTS_QUERY_KEY,
  loadGeneratedCourseLists,
} from "@/lib/generated-course-lists";

export function useGeneratedCourseLists() {
  return useQuery({
    queryKey: GENERATED_COURSE_LISTS_QUERY_KEY,
    queryFn: loadGeneratedCourseLists,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}
