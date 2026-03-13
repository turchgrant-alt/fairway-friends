import { useQuery } from '@tanstack/react-query';

import { COURSE_CATALOG_QUERY_KEY, loadCourseCatalog } from '@/lib/course-data';

export function useCourseCatalog() {
  return useQuery({
    queryKey: COURSE_CATALOG_QUERY_KEY,
    queryFn: loadCourseCatalog,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}
