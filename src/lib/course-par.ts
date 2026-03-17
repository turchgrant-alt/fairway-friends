import type { CourseRankingState } from "@/lib/course-rankings";
import {
  COURSE_RANKING_STORAGE_KEY,
  createEmptyCourseRankingState,
  getCourseRanking,
  normalizeCourseRankingState,
} from "@/lib/course-rankings";

type CourseParSource = "catalog" | "user";

const catalogParByCourseId = new Map<string, number>();

function normalizePositiveInteger(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;

  const nextValue = Math.trunc(value);
  return nextValue > 0 ? nextValue : null;
}

function readStoredCourseRankingState() {
  if (typeof window === "undefined") {
    return createEmptyCourseRankingState();
  }

  try {
    const storedValue = window.localStorage.getItem(COURSE_RANKING_STORAGE_KEY);
    if (!storedValue) return createEmptyCourseRankingState();

    return normalizeCourseRankingState(JSON.parse(storedValue));
  } catch {
    return createEmptyCourseRankingState();
  }
}

export function registerCourseCatalogPar(courseId: string, par: number | null | undefined) {
  const normalizedPar = normalizePositiveInteger(par);
  if (!normalizedPar) return;

  catalogParByCourseId.set(courseId, normalizedPar);
}

export function getCoursePar(courseId: string): { par: number; source: CourseParSource } | null;
export function getCoursePar(
  courseId: string,
  rankingState: CourseRankingState,
): { par: number; source: CourseParSource } | null;
export function getCoursePar(courseId: string, rankingState?: CourseRankingState) {
  const catalogPar = catalogParByCourseId.get(courseId);
  if (catalogPar) {
    return { par: catalogPar, source: "catalog" as const };
  }

  const resolvedRankingState = rankingState ?? readStoredCourseRankingState();
  const userEnteredPar = normalizePositiveInteger(getCourseRanking(resolvedRankingState, courseId)?.userEnteredPar);
  if (userEnteredPar) {
    return { par: userEnteredPar, source: "user" as const };
  }

  return null;
}
