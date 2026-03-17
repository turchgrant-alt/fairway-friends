import type { GeneratedCourseListCatalog } from "@/lib/course-data-model";

export const GENERATED_COURSE_LISTS_QUERY_KEY = ["generated-course-lists"] as const;
export const GENERATED_COURSE_LISTS_PUBLIC_PATH = "/data/curatedCourseLists.generated.json";

let generatedCourseListsPromise: Promise<GeneratedCourseListCatalog> | null = null;

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(path);

  if (!response.ok) {
    throw new Error(`Failed to load ${path} (${response.status})`);
  }

  return (await response.json()) as T;
}

export async function loadGeneratedCourseLists(): Promise<GeneratedCourseListCatalog> {
  if (!generatedCourseListsPromise) {
    generatedCourseListsPromise = fetchJson<GeneratedCourseListCatalog>(GENERATED_COURSE_LISTS_PUBLIC_PATH);
  }

  return generatedCourseListsPromise;
}
