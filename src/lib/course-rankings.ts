export const COURSE_RANKING_STORAGE_KEY = "golfer:v1-course-rankings";
export const MINIMUM_TRUE_RANKING_COUNT = 5;

export const COURSE_BUCKET_PRIORITY = ["great", "fine", "bad"] as const;

export type CourseRankingBucket = (typeof COURSE_BUCKET_PRIORITY)[number];

export interface PlayedCourseRankingRecord {
  courseId: string;
  played: true;
  bucket: CourseRankingBucket;
  playCount: number;
  lastPlayedAt: string | null;
  rankedAt: string;
  globalOrder: number;
  bucketOrder: number;
  comparisonIds?: string[];
  lastComparedAt?: string | null;
}

export interface CourseRankingState {
  version: 1;
  updatedAt: string | null;
  courses: PlayedCourseRankingRecord[];
}

export interface UpdateCourseRankingInput {
  courseId: string;
  bucket?: CourseRankingBucket;
  rankedAt?: string | Date | null;
  lastPlayedAt?: string | Date | null;
  bucketOrder?: number | null;
}

export interface MarkCoursePlayedInput extends UpdateCourseRankingInput {
  playCountIncrement?: number;
}

function isBucket(value: unknown): value is CourseRankingBucket {
  return typeof value === "string" && COURSE_BUCKET_PRIORITY.includes(value as CourseRankingBucket);
}

function toIsoDateString(value: string | Date | null | undefined) {
  if (!value) return null;

  const nextDate = value instanceof Date ? value : new Date(value);
  return Number.isNaN(nextDate.getTime()) ? null : nextDate.toISOString();
}

function clampPositiveInteger(value: number | null | undefined, fallback: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.max(1, Math.trunc(value));
}

function bucketPriority(bucket: CourseRankingBucket) {
  return COURSE_BUCKET_PRIORITY.indexOf(bucket);
}

function compareRankedCourses(a: PlayedCourseRankingRecord, b: PlayedCourseRankingRecord) {
  const bucketPriorityDifference = bucketPriority(a.bucket) - bucketPriority(b.bucket);
  if (bucketPriorityDifference !== 0) return bucketPriorityDifference;

  if (a.bucketOrder !== b.bucketOrder) {
    return a.bucketOrder - b.bucketOrder;
  }

  return a.courseId.localeCompare(b.courseId);
}

function createEmptyCourseRankingStateBase(): CourseRankingState {
  return {
    version: 1,
    updatedAt: null,
    courses: [],
  };
}

export function createEmptyCourseRankingState() {
  return createEmptyCourseRankingStateBase();
}

function createBaseCourseRankingRecord(courseId: string, bucket: CourseRankingBucket, nowIso: string): PlayedCourseRankingRecord {
  return {
    courseId,
    played: true,
    bucket,
    playCount: 1,
    lastPlayedAt: nowIso,
    rankedAt: nowIso,
    globalOrder: 1,
    bucketOrder: 1,
  };
}

function finalizeCourseRankings(courses: PlayedCourseRankingRecord[], updatedAt: string): CourseRankingState {
  const sortedCourses = [...courses].sort(compareRankedCourses);
  let globalOrder = 1;

  const coursesWithFreshOrder = COURSE_BUCKET_PRIORITY.flatMap((bucket) => {
    let bucketOrder = 1;

    return sortedCourses
      .filter((course) => course.bucket === bucket)
      .map((course) => ({
        ...course,
        played: true as const,
        playCount: clampPositiveInteger(course.playCount, 1),
        bucketOrder: bucketOrder++,
        globalOrder: globalOrder++,
      }));
  });

  return {
    version: 1,
    updatedAt,
    courses: coursesWithFreshOrder,
  };
}

function insertCourseIntoBucket(
  courses: PlayedCourseRankingRecord[],
  record: PlayedCourseRankingRecord,
  bucketOrder: number | null | undefined,
) {
  const withoutRecord = courses.filter((course) => course.courseId !== record.courseId);
  const nextCourses: PlayedCourseRankingRecord[] = [];

  for (const bucket of COURSE_BUCKET_PRIORITY) {
    const bucketCourses = withoutRecord.filter((course) => course.bucket === bucket).sort(compareRankedCourses);

    if (bucket === record.bucket) {
      const insertIndex =
        bucketOrder == null ? bucketCourses.length : Math.min(Math.max(bucketOrder - 1, 0), bucketCourses.length);
      bucketCourses.splice(insertIndex, 0, record);
    }

    nextCourses.push(...bucketCourses);
  }

  return nextCourses;
}

function normalizeStoredCourse(course: unknown, fallbackRankedAt: string): PlayedCourseRankingRecord | null {
  if (!course || typeof course !== "object") return null;

  const nextCourse = course as Partial<PlayedCourseRankingRecord>;
  const courseId = typeof nextCourse.courseId === "string" ? nextCourse.courseId.trim() : "";
  if (!courseId) return null;

  const bucket = isBucket(nextCourse.bucket) ? nextCourse.bucket : "fine";
  const rankedAt = toIsoDateString(nextCourse.rankedAt) ?? fallbackRankedAt;
  const lastPlayedAt = toIsoDateString(nextCourse.lastPlayedAt);

  return {
    courseId,
    played: true,
    bucket,
    playCount: clampPositiveInteger(nextCourse.playCount, 1),
    lastPlayedAt,
    rankedAt,
    globalOrder: clampPositiveInteger(nextCourse.globalOrder, 1),
    bucketOrder: clampPositiveInteger(nextCourse.bucketOrder, 1),
    comparisonIds: Array.isArray(nextCourse.comparisonIds)
      ? nextCourse.comparisonIds.filter((value): value is string => typeof value === "string" && value.trim().length > 0)
      : undefined,
    lastComparedAt: toIsoDateString(nextCourse.lastComparedAt),
  };
}

export function normalizeCourseRankingState(state: unknown): CourseRankingState {
  const fallbackUpdatedAt = new Date().toISOString();

  if (!state || typeof state !== "object") {
    return createEmptyCourseRankingStateBase();
  }

  const nextState = state as Partial<CourseRankingState>;
  const dedupedCourses = new Map<string, PlayedCourseRankingRecord>();

  for (const course of Array.isArray(nextState.courses) ? nextState.courses : []) {
    const normalizedCourse = normalizeStoredCourse(course, fallbackUpdatedAt);
    if (!normalizedCourse) continue;

    const existingCourse = dedupedCourses.get(normalizedCourse.courseId);
    if (!existingCourse) {
      dedupedCourses.set(normalizedCourse.courseId, normalizedCourse);
      continue;
    }

    dedupedCourses.set(normalizedCourse.courseId, {
      ...existingCourse,
      ...normalizedCourse,
      played: true,
      playCount: Math.max(existingCourse.playCount, normalizedCourse.playCount),
      lastPlayedAt:
        [existingCourse.lastPlayedAt, normalizedCourse.lastPlayedAt]
          .filter(Boolean)
          .sort()
          .at(-1) ?? null,
      rankedAt: [existingCourse.rankedAt, normalizedCourse.rankedAt].sort().at(-1) ?? fallbackUpdatedAt,
    });
  }

  const updatedAt = toIsoDateString(nextState.updatedAt) ?? fallbackUpdatedAt;
  return finalizeCourseRankings(Array.from(dedupedCourses.values()), updatedAt);
}

export function serializeCourseRankingState(state: CourseRankingState) {
  return JSON.stringify(normalizeCourseRankingState(state));
}

export function getRankedCourses(state: CourseRankingState) {
  return normalizeCourseRankingState(state).courses;
}

export function getRankedCourseCount(state: CourseRankingState) {
  return getRankedCourses(state).length;
}

export function hasMinimumRankedCourses(state: CourseRankingState, minimum = MINIMUM_TRUE_RANKING_COUNT) {
  return getRankedCourseCount(state) >= minimum;
}

export function getCourseRanking(state: CourseRankingState, courseId: string) {
  return getRankedCourses(state).find((course) => course.courseId === courseId);
}

export function hasCourseBeenPlayed(state: CourseRankingState, courseId: string) {
  return getCourseRanking(state, courseId)?.played ?? false;
}

export function getCourseBucket(state: CourseRankingState, courseId: string) {
  return getCourseRanking(state, courseId)?.bucket ?? null;
}

export function getCourseGlobalOrder(state: CourseRankingState, courseId: string) {
  return getCourseRanking(state, courseId)?.globalOrder ?? null;
}

export function getCourseBucketOrder(state: CourseRankingState, courseId: string) {
  return getCourseRanking(state, courseId)?.bucketOrder ?? null;
}

export function getCoursePlayCount(state: CourseRankingState, courseId: string) {
  return getCourseRanking(state, courseId)?.playCount ?? 0;
}

export function getBucketCourses(state: CourseRankingState, bucket: CourseRankingBucket) {
  return getRankedCourses(state).filter((course) => course.bucket === bucket);
}

export function updateCourseRanking(state: CourseRankingState, input: UpdateCourseRankingInput) {
  const normalizedState = normalizeCourseRankingState(state);
  const nowIso = new Date().toISOString();
  const existingCourse = getCourseRanking(normalizedState, input.courseId);
  const bucket = input.bucket ?? existingCourse?.bucket ?? "fine";
  const rankedAt = toIsoDateString(input.rankedAt) ?? nowIso;
  const lastPlayedAt = toIsoDateString(input.lastPlayedAt) ?? existingCourse?.lastPlayedAt ?? null;
  const nextCourse = {
    ...(existingCourse ?? createBaseCourseRankingRecord(input.courseId, bucket, rankedAt)),
    bucket,
    rankedAt,
    lastPlayedAt,
  };

  const nextCourses =
    existingCourse && bucket === existingCourse.bucket && input.bucketOrder == null
      ? normalizedState.courses.map((course) => (course.courseId === nextCourse.courseId ? nextCourse : course))
      : insertCourseIntoBucket(normalizedState.courses, nextCourse, input.bucketOrder);

  return finalizeCourseRankings(nextCourses, nowIso);
}

export function markCoursePlayed(state: CourseRankingState, input: MarkCoursePlayedInput) {
  const normalizedState = normalizeCourseRankingState(state);
  const nowIso = new Date().toISOString();
  const playedAt = toIsoDateString(input.lastPlayedAt) ?? nowIso;
  const existingCourse = getCourseRanking(normalizedState, input.courseId);
  const playCountIncrement = clampPositiveInteger(input.playCountIncrement, 1);
  const bucket = input.bucket ?? existingCourse?.bucket ?? "fine";
  const rankedAt = toIsoDateString(input.rankedAt) ?? existingCourse?.rankedAt ?? playedAt;
  const nextCourse = {
    ...(existingCourse ?? createBaseCourseRankingRecord(input.courseId, bucket, rankedAt)),
    bucket,
    rankedAt,
    lastPlayedAt: playedAt,
    playCount: (existingCourse?.playCount ?? 0) + playCountIncrement,
  };

  const nextCourses =
    existingCourse && bucket === existingCourse.bucket && input.bucketOrder == null
      ? normalizedState.courses.map((course) => (course.courseId === nextCourse.courseId ? nextCourse : course))
      : insertCourseIntoBucket(normalizedState.courses, nextCourse, input.bucketOrder);

  return finalizeCourseRankings(nextCourses, nowIso);
}

export function removeCourseRanking(state: CourseRankingState, courseId: string) {
  const normalizedState = normalizeCourseRankingState(state);
  const nowIso = new Date().toISOString();
  return finalizeCourseRankings(
    normalizedState.courses.filter((course) => course.courseId !== courseId),
    nowIso,
  );
}

export function reorderBucketCourses(state: CourseRankingState, bucket: CourseRankingBucket, orderedCourseIds: string[]) {
  const normalizedState = normalizeCourseRankingState(state);
  const nowIso = new Date().toISOString();
  const bucketCourses = getBucketCourses(normalizedState, bucket);
  const otherCourses = normalizedState.courses.filter((course) => course.bucket !== bucket);
  const remainingBucketCourses = bucketCourses.filter((course) => !orderedCourseIds.includes(course.courseId));
  const orderedBucketCourses = orderedCourseIds
    .map((courseId) => bucketCourses.find((course) => course.courseId === courseId))
    .filter(Boolean) as PlayedCourseRankingRecord[];

  return finalizeCourseRankings([...otherCourses, ...orderedBucketCourses, ...remainingBucketCourses], nowIso);
}
