export const COURSE_RANKING_STORAGE_KEY = "golfer:v1-course-rankings";
export const MINIMUM_TRUE_RANKING_COUNT = 5;
export const COURSE_RANKING_STATE_VERSION = 3;

export const COURSE_BUCKET_PRIORITY = ["great", "fine", "bad"] as const;
export const COURSE_BUCKET_SCORE_BANDS = {
  great: { max: 10.0, min: 7.5 },
  fine: { max: 7.4, min: 4.5 },
  bad: { max: 4.4, min: 0.0 },
} as const;

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
  version: number;
  updatedAt: string | null;
  courses: PlayedCourseRankingRecord[];
  manualOrderCourseIds: string[];
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

export interface ReorderFullCourseRankingInput {
  orderedCourseIds: string[];
  movedCourseId?: string;
  targetCourseId?: string | null;
  placement?: "before" | "after";
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

function roundToDecimals(value: number, decimals: number) {
  const precision = 10 ** decimals;
  return Math.round(value * precision) / precision;
}

function bucketPriority(bucket: CourseRankingBucket) {
  return COURSE_BUCKET_PRIORITY.indexOf(bucket);
}

function compareCanonicalCourses(a: PlayedCourseRankingRecord, b: PlayedCourseRankingRecord) {
  const bucketPriorityDifference = bucketPriority(a.bucket) - bucketPriority(b.bucket);
  if (bucketPriorityDifference !== 0) return bucketPriorityDifference;

  if (a.bucketOrder !== b.bucketOrder) {
    return a.bucketOrder - b.bucketOrder;
  }

  return a.courseId.localeCompare(b.courseId);
}

function createEmptyCourseRankingStateBase(): CourseRankingState {
  return {
    version: COURSE_RANKING_STATE_VERSION,
    updatedAt: null,
    courses: [],
    manualOrderCourseIds: [],
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

function normalizeManualOrderCourseIds(ids: unknown, validCourseIds: string[]) {
  if (!Array.isArray(ids)) return [];

  const validCourseIdSet = new Set(validCourseIds);
  const dedupedIds = new Set<string>();

  ids.forEach((value) => {
    if (typeof value !== "string") return;
    if (!validCourseIdSet.has(value)) return;
    dedupedIds.add(value);
  });

  return Array.from(dedupedIds);
}

function mergeManualOrderCourseIds(canonicalCourseIds: string[], manualOrderCourseIds: string[]) {
  if (canonicalCourseIds.length === 0) return [];
  if (manualOrderCourseIds.length === 0) return [...canonicalCourseIds];

  const orderedIds = [...manualOrderCourseIds];

  canonicalCourseIds.forEach((courseId, canonicalIndex) => {
    if (orderedIds.includes(courseId)) return;

    const previousNeighbor = [...canonicalCourseIds.slice(0, canonicalIndex)]
      .reverse()
      .find((candidateId) => orderedIds.includes(candidateId));

    if (previousNeighbor) {
      const insertionIndex = orderedIds.indexOf(previousNeighbor) + 1;
      orderedIds.splice(insertionIndex, 0, courseId);
      return;
    }

    const nextNeighbor = canonicalCourseIds
      .slice(canonicalIndex + 1)
      .find((candidateId) => orderedIds.includes(candidateId));

    if (nextNeighbor) {
      const insertionIndex = orderedIds.indexOf(nextNeighbor);
      orderedIds.splice(insertionIndex, 0, courseId);
      return;
    }

    orderedIds.push(courseId);
  });

  return orderedIds;
}

function buildCanonicalCourses(courses: PlayedCourseRankingRecord[]) {
  const sortedCourses = [...courses].sort(compareCanonicalCourses);

  return COURSE_BUCKET_PRIORITY.flatMap((bucket) => {
    let bucketOrder = 1;

    return sortedCourses
      .filter((course) => course.bucket === bucket)
      .map((course) => ({
        ...course,
        played: true as const,
        playCount: clampPositiveInteger(course.playCount, 1),
        bucketOrder: bucketOrder++,
      }));
  });
}

function normalizeBucketsToVisibleOrder(orderedCourses: PlayedCourseRankingRecord[]) {
  if (orderedCourses.length === 0) return [];

  const bucketIndices = orderedCourses.map((course) => bucketPriority(course.bucket));
  const bucketCount = COURSE_BUCKET_PRIORITY.length;
  const costMatrix = Array.from({ length: orderedCourses.length }, () =>
    Array.from({ length: bucketCount }, () => Number.POSITIVE_INFINITY),
  );
  const nextBucketMatrix = Array.from({ length: orderedCourses.length }, () =>
    Array.from({ length: bucketCount }, () => 0),
  );

  for (let position = orderedCourses.length - 1; position >= 0; position -= 1) {
    for (let bucketIndex = bucketCount - 1; bucketIndex >= 0; bucketIndex -= 1) {
      const changeCost = bucketIndices[position] === bucketIndex ? 0 : 1;

      if (position === orderedCourses.length - 1) {
        costMatrix[position][bucketIndex] = changeCost;
        nextBucketMatrix[position][bucketIndex] = bucketIndex;
        continue;
      }

      let bestNextBucketIndex = bucketIndex;
      let bestRemainingCost = Number.POSITIVE_INFINITY;

      for (let nextBucketIndex = bucketIndex; nextBucketIndex < bucketCount; nextBucketIndex += 1) {
        const candidateCost = costMatrix[position + 1][nextBucketIndex];
        if (
          candidateCost < bestRemainingCost ||
          (candidateCost === bestRemainingCost && nextBucketIndex < bestNextBucketIndex)
        ) {
          bestRemainingCost = candidateCost;
          bestNextBucketIndex = nextBucketIndex;
        }
      }

      costMatrix[position][bucketIndex] = changeCost + bestRemainingCost;
      nextBucketMatrix[position][bucketIndex] = bestNextBucketIndex;
    }
  }

  let currentBucketIndex = 0;
  for (let bucketIndex = 1; bucketIndex < bucketCount; bucketIndex += 1) {
    if (costMatrix[0][bucketIndex] < costMatrix[0][currentBucketIndex]) {
      currentBucketIndex = bucketIndex;
    }
  }

  return orderedCourses.map((course, position) => {
    const nextCourse = {
      ...course,
      bucket: COURSE_BUCKET_PRIORITY[currentBucketIndex],
    };

    if (position < orderedCourses.length - 1) {
      currentBucketIndex = nextBucketMatrix[position][currentBucketIndex];
    }

    return nextCourse;
  });
}

function assignOrdersFromVisibleOrder(orderedCourses: PlayedCourseRankingRecord[]) {
  const bucketOrderCounts: Record<CourseRankingBucket, number> = {
    great: 0,
    fine: 0,
    bad: 0,
  };

  const orderedCoursesWithRankState = orderedCourses.map((course, index) => {
    bucketOrderCounts[course.bucket] += 1;

    return {
      ...course,
      played: true as const,
      playCount: clampPositiveInteger(course.playCount, 1),
      bucketOrder: bucketOrderCounts[course.bucket],
      globalOrder: index + 1,
    };
  });

  return [...orderedCoursesWithRankState].sort(compareCanonicalCourses);
}

function finalizeCourseRankings(
  courses: PlayedCourseRankingRecord[],
  updatedAt: string,
  manualOrderCourseIds: string[] = [],
): CourseRankingState {
  const canonicalCourses = buildCanonicalCourses(courses);
  const canonicalCourseIds = canonicalCourses.map((course) => course.courseId);
  const resolvedManualOrderCourseIds = mergeManualOrderCourseIds(
    canonicalCourseIds,
    normalizeManualOrderCourseIds(manualOrderCourseIds, canonicalCourseIds),
  );
  const courseById = new Map(canonicalCourses.map((course) => [course.courseId, course]));
  const visibleOrderCourses = normalizeBucketsToVisibleOrder(
    resolvedManualOrderCourseIds
      .map((courseId) => courseById.get(courseId))
      .filter(Boolean) as PlayedCourseRankingRecord[],
  );

  return {
    version: COURSE_RANKING_STATE_VERSION,
    updatedAt,
    manualOrderCourseIds: resolvedManualOrderCourseIds,
    courses: assignOrdersFromVisibleOrder(visibleOrderCourses),
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
    const bucketCourses = withoutRecord.filter((course) => course.bucket === bucket).sort(compareCanonicalCourses);

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

  const nextState = state as Partial<CourseRankingState> & { manualOrderCourseIds?: unknown };
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
  const courses = Array.from(dedupedCourses.values());
  const validCourseIds = courses.map((course) => course.courseId);
  const manualOrderCourseIds = normalizeManualOrderCourseIds(nextState.manualOrderCourseIds, validCourseIds);

  return finalizeCourseRankings(courses, updatedAt, manualOrderCourseIds);
}

export function serializeCourseRankingState(state: CourseRankingState) {
  return JSON.stringify(normalizeCourseRankingState(state));
}

export function getRankedCourses(state: CourseRankingState) {
  const normalizedState = normalizeCourseRankingState(state);
  const courseById = new Map(normalizedState.courses.map((course) => [course.courseId, course]));

  return normalizedState.manualOrderCourseIds
    .map((courseId) => courseById.get(courseId))
    .filter(Boolean) as PlayedCourseRankingRecord[];
}

export function getRankedCourseCount(state: CourseRankingState) {
  return normalizeCourseRankingState(state).courses.length;
}

export function hasMinimumRankedCourses(state: CourseRankingState, minimum = MINIMUM_TRUE_RANKING_COUNT) {
  return getRankedCourseCount(state) >= minimum;
}

export function getCourseRanking(state: CourseRankingState, courseId: string) {
  return normalizeCourseRankingState(state).courses.find((course) => course.courseId === courseId);
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
  return normalizeCourseRankingState(state).courses
    .filter((course) => course.bucket === bucket)
    .sort((a, b) => a.bucketOrder - b.bucketOrder || a.courseId.localeCompare(b.courseId));
}

export function getBucketScore(bucket: CourseRankingBucket, bucketRankPosition: number, bucketCount: number) {
  if (bucketCount <= 0) return null;

  const { max: bucketMax, min: bucketMin } = COURSE_BUCKET_SCORE_BANDS[bucket];
  if (bucketCount === 1) {
    return roundToDecimals(bucketMax, 2);
  }

  const nextScore =
    bucketMax - ((bucketRankPosition - 1) / (bucketCount - 1)) * (bucketMax - bucketMin);

  return roundToDecimals(nextScore, 2);
}

export function getCourseNumericRating(state: CourseRankingState, courseId: string) {
  const normalizedState = normalizeCourseRankingState(state);
  const course = normalizedState.courses.find((candidate) => candidate.courseId === courseId);
  if (!course) return null;

  const bucketCount = normalizedState.courses.filter((candidate) => candidate.bucket === course.bucket).length;
  return getBucketScore(course.bucket, course.bucketOrder, bucketCount);
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

  return finalizeCourseRankings(nextCourses, nowIso, normalizedState.manualOrderCourseIds);
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

  return finalizeCourseRankings(nextCourses, nowIso, normalizedState.manualOrderCourseIds);
}

export function removeCourseRanking(state: CourseRankingState, courseId: string) {
  const normalizedState = normalizeCourseRankingState(state);
  const nowIso = new Date().toISOString();

  return finalizeCourseRankings(
    normalizedState.courses.filter((course) => course.courseId !== courseId),
    nowIso,
    normalizedState.manualOrderCourseIds.filter((id) => id !== courseId),
  );
}

export function reorderBucketCourses(state: CourseRankingState, bucket: CourseRankingBucket, orderedCourseIds: string[]) {
  const normalizedState = normalizeCourseRankingState(state);
  const nowIso = new Date().toISOString();
  const bucketCourseIdSet = new Set(
    normalizedState.courses.filter((course) => course.bucket === bucket).map((course) => course.courseId),
  );
  const nextOrderedBucketIds = [
    ...orderedCourseIds.filter((courseId) => bucketCourseIdSet.has(courseId)),
    ...normalizedState.manualOrderCourseIds.filter(
      (courseId) => bucketCourseIdSet.has(courseId) && !orderedCourseIds.includes(courseId),
    ),
  ];
  const nextManualOrderCourseIds = normalizedState.manualOrderCourseIds.filter(
    (courseId) => !bucketCourseIdSet.has(courseId),
  );

  let insertionIndex = 0;
  normalizedState.manualOrderCourseIds.forEach((courseId, index) => {
    if (bucketCourseIdSet.has(courseId) && insertionIndex === 0) {
      insertionIndex = index;
    }
  });

  nextManualOrderCourseIds.splice(insertionIndex, 0, ...nextOrderedBucketIds);

  return finalizeCourseRankings(normalizedState.courses, nowIso, nextManualOrderCourseIds);
}

export function reorderFullCourseRanking(state: CourseRankingState, input: ReorderFullCourseRankingInput) {
  const normalizedState = normalizeCourseRankingState(state);
  const nowIso = new Date().toISOString();
  const validCourseIds = new Set(normalizedState.courses.map((course) => course.courseId));
  const dedupedOrderedIds = Array.from(
    new Set(input.orderedCourseIds.filter((courseId) => validCourseIds.has(courseId))),
  );
  const remainingCourseIds = normalizedState.manualOrderCourseIds.filter(
    (courseId) => validCourseIds.has(courseId) && !dedupedOrderedIds.includes(courseId),
  );
  const nextManualOrderCourseIds = [...dedupedOrderedIds, ...remainingCourseIds];
  const courseById = new Map(normalizedState.courses.map((course) => [course.courseId, course]));
  const movedCourse = input.movedCourseId ? courseById.get(input.movedCourseId) ?? null : null;
  const targetCourse =
    input.targetCourseId && input.targetCourseId !== input.movedCourseId
      ? courseById.get(input.targetCourseId) ?? null
      : null;
  const fallbackTargetCourseId = [...nextManualOrderCourseIds]
    .reverse()
    .find((courseId) => courseId !== input.movedCourseId);
  const fallbackTargetCourse = fallbackTargetCourseId ? courseById.get(fallbackTargetCourseId) ?? null : null;
  const nextBucket = targetCourse?.bucket ?? fallbackTargetCourse?.bucket ?? movedCourse?.bucket ?? "fine";
  const nextCourses =
    movedCourse && movedCourse.bucket !== nextBucket
      ? normalizedState.courses.map((course) =>
          course.courseId === movedCourse.courseId ? { ...course, bucket: nextBucket } : course,
        )
      : normalizedState.courses;

  return finalizeCourseRankings(
    nextCourses,
    nowIso,
    nextManualOrderCourseIds,
  );
}
