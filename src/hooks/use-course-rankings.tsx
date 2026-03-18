import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { loadCourseById } from "@/lib/course-data";
import {
  COURSE_RANKING_STORAGE_KEY,
  createEmptyCourseRankingState,
  getBucketCourses,
  getCourseBucket,
  getCourseBucketOrder,
  getCourseGlobalOrder,
  getCourseNumericRating,
  getCoursePlayCount,
  getCourseRanking,
  getRankedCourseCount,
  getRankedCourses,
  hasCourseBeenPlayed,
  hasMinimumRankedCourses,
  markCoursePlayed,
  normalizeCourseRankingState,
  saveCourseRoundDetails,
  reorderFullCourseRanking,
  removeCourseRanking,
  reorderBucketCourses,
  updateCourseRanking,
  type CourseRankingBucket,
  type CourseRankingState,
  type PlayedCourseRankingRecord,
  type MarkCoursePlayedInput,
  type ReorderFullCourseRankingInput,
  type SaveCourseRoundDetailsInput,
  type UpdateCourseRankingInput,
} from "@/lib/course-rankings";
import {
  deleteRanking as deleteSupabaseRanking,
  getMyRankings,
  upsertRanking,
  type RankingRecord,
} from "@/lib/rankings";

interface CourseRankingContextValue {
  rankingState: CourseRankingState;
  rankedCourses: ReturnType<typeof getRankedCourses>;
  rankedCourseCount: number;
  hasTrueRankingThreshold: boolean;
  replaceRankingState: (nextState: CourseRankingState) => void;
  markPlayedCourse: (input: MarkCoursePlayedInput) => void;
  saveCourseRanking: (input: UpdateCourseRankingInput) => void;
  saveRoundDetails: (input: SaveCourseRoundDetailsInput) => void;
  removePlayedCourse: (courseId: string) => void;
  reorderFullRanking: (input: ReorderFullCourseRankingInput) => void;
  reorderBucket: (bucket: CourseRankingBucket, orderedCourseIds: string[]) => void;
  getCourseRankingRecord: (courseId: string) => ReturnType<typeof getCourseRanking>;
  hasCourseBeenPlayed: (courseId: string) => boolean;
  getCourseBucket: (courseId: string) => CourseRankingBucket | null;
  getCourseGlobalOrder: (courseId: string) => number | null;
  getCourseBucketOrder: (courseId: string) => number | null;
  getCourseNumericRating: (courseId: string) => number | null;
  getCoursePlayCount: (courseId: string) => number;
  getBucketCourses: (bucket: CourseRankingBucket) => ReturnType<typeof getBucketCourses>;
}

const CourseRankingContext = createContext<CourseRankingContextValue | null>(null);

function getRankingStorageKey(userId: string | null | undefined) {
  return userId ? `${COURSE_RANKING_STORAGE_KEY}:${userId}` : COURSE_RANKING_STORAGE_KEY;
}

function readStoredCourseRankingState(userId: string | null | undefined) {
  if (typeof window === "undefined") {
    return createEmptyCourseRankingState();
  }

  try {
    const storageKeys = [getRankingStorageKey(userId)];
    if (userId) {
      storageKeys.push(COURSE_RANKING_STORAGE_KEY);
    }

    for (const storageKey of storageKeys) {
      const storedValue = window.localStorage.getItem(storageKey);
      if (!storedValue) continue;
      return normalizeCourseRankingState(JSON.parse(storedValue));
    }

    return createEmptyCourseRankingState();
  } catch {
    return createEmptyCourseRankingState();
  }
}

function writeStoredCourseRankingState(state: CourseRankingState, userId: string | null | undefined) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(getRankingStorageKey(userId), JSON.stringify(state));
}

function inferBucketFromOverallRating(overallRating: number | null) {
  if (overallRating == null) return "fine" as const;
  if (overallRating >= 7.5) return "great" as const;
  if (overallRating >= 4.5) return "fine" as const;
  return "bad" as const;
}

function sortSupabaseRankings(a: RankingRecord, b: RankingRecord) {
  const aRating = a.overall_rating ?? Number.NEGATIVE_INFINITY;
  const bRating = b.overall_rating ?? Number.NEGATIVE_INFINITY;
  if (bRating !== aRating) {
    return bRating - aRating;
  }

  return (b.updated_at ?? "").localeCompare(a.updated_at ?? "");
}

function mergeLocalExtras(
  existingCourse: PlayedCourseRankingRecord | undefined,
  ranking: RankingRecord,
  bucket: CourseRankingBucket,
  bucketOrder: number,
  globalOrder: number,
): PlayedCourseRankingRecord {
  const datePlayedIso = ranking.date_played ? new Date(ranking.date_played).toISOString() : null;

  return {
    courseId: ranking.course_id,
    played: true,
    bucket,
    playCount: existingCourse?.playCount ?? 1,
    lastPlayedAt: datePlayedIso ?? existingCourse?.lastPlayedAt ?? ranking.updated_at ?? null,
    rankedAt: ranking.updated_at ?? ranking.created_at ?? existingCourse?.rankedAt ?? new Date().toISOString(),
    globalOrder,
    bucketOrder,
    comparisonIds: existingCourse?.comparisonIds,
    lastComparedAt: existingCourse?.lastComparedAt ?? null,
    userEnteredPar: existingCourse?.userEnteredPar,
    pricePaid: existingCourse?.pricePaid,
    scoreShot: existingCourse?.scoreShot,
    tags: existingCourse?.tags,
    notes: ranking.notes ?? existingCourse?.notes,
    roundDate: datePlayedIso ?? existingCourse?.roundDate ?? null,
  };
}

function createStateFromSupabaseRankings(
  rankings: RankingRecord[],
  localState: CourseRankingState,
) {
  const existingByCourseId = new Map(localState.courses.map((course) => [course.courseId, course]));
  const sortedRankings = [...rankings].sort(sortSupabaseRankings);
  const bucketCounts: Record<CourseRankingBucket, number> = {
    great: 0,
    fine: 0,
    bad: 0,
  };

  const nextCourses = sortedRankings.map((ranking, index) => {
    const bucket = inferBucketFromOverallRating(ranking.overall_rating);
    bucketCounts[bucket] += 1;

    return mergeLocalExtras(
      existingByCourseId.get(ranking.course_id),
      ranking,
      bucket,
      bucketCounts[bucket],
      index + 1,
    );
  });

  return normalizeCourseRankingState({
    version: localState.version,
    updatedAt: new Date().toISOString(),
    courses: nextCourses,
    manualOrderCourseIds: sortedRankings.map((ranking) => ranking.course_id),
  });
}

async function syncRankingStateToSupabase(
  nextState: CourseRankingState,
  currentRemoteRankings: RankingRecord[],
) {
  const rankedCourses = getRankedCourses(nextState);
  const remoteByCourseId = new Map(currentRemoteRankings.map((ranking) => [ranking.course_id, ranking]));
  const nextCourseIds = new Set(rankedCourses.map((course) => course.courseId));

  const deletedRankings = currentRemoteRankings.filter((ranking) => !nextCourseIds.has(ranking.course_id));
  await Promise.all(deletedRankings.map((ranking) => deleteSupabaseRanking(ranking.id)));

  await Promise.all(
    rankedCourses.map(async (courseRanking) => {
      const course = await loadCourseById(courseRanking.courseId);
      const existingRemoteRanking = remoteByCourseId.get(courseRanking.courseId);

      await upsertRanking({
        id: existingRemoteRanking?.id,
        course_id: courseRanking.courseId,
        course_name: course?.name ?? existingRemoteRanking?.course_name ?? courseRanking.courseId,
        course_city: course?.city ?? existingRemoteRanking?.course_city ?? null,
        course_state: course?.stateCode ?? course?.state ?? existingRemoteRanking?.course_state ?? null,
        overall_rating: getCourseNumericRating(nextState, courseRanking.courseId),
        notes: courseRanking.notes ?? existingRemoteRanking?.notes ?? null,
        date_played: (courseRanking.roundDate ?? courseRanking.lastPlayedAt)?.slice(0, 10) ?? null,
      });
    }),
  );
}

export function CourseRankingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [rankingState, setRankingState] = useState<CourseRankingState>(() =>
    readStoredCourseRankingState(user?.id ?? null),
  );
  const rankingStateRef = useRef(rankingState);
  const syncQueueRef = useRef(Promise.resolve());
  const userIdRef = useRef<string | null>(user?.id ?? null);

  useEffect(() => {
    setRankingState(readStoredCourseRankingState(user?.id ?? null));
  }, [user?.id]);

  useEffect(() => {
    rankingStateRef.current = rankingState;
  }, [rankingState]);

  useEffect(() => {
    userIdRef.current = user?.id ?? null;
    syncQueueRef.current = Promise.resolve();
  }, [user?.id]);

  useEffect(() => {
    writeStoredCourseRankingState(rankingState, user?.id ?? null);
  }, [rankingState, user?.id]);

  useEffect(() => {
    if (!user) {
      return;
    }

    let isCancelled = false;

    async function hydrateRankings() {
      const localState = readStoredCourseRankingState(user.id);

      try {
        const remoteRankings = await getMyRankings();
        if (isCancelled) return;

        if (remoteRankings.length === 0) {
          if (getRankedCourseCount(localState) > 0) {
            await syncRankingStateToSupabase(localState, []);
          }
          return;
        }

        const nextState = createStateFromSupabaseRankings(remoteRankings, localState);
        if (!isCancelled) {
          setRankingState(nextState);
        }
      } catch (error) {
        console.error("Failed to hydrate Supabase rankings.", error);
      }
    }

    void hydrateRankings();

    return () => {
      isCancelled = true;
    };
  }, [user]);

  const rankedCourses = getRankedCourses(rankingState);
  const rankedCourseCount = getRankedCourseCount(rankingState);
  const hasTrueRankingThreshold = hasMinimumRankedCourses(rankingState);

  async function applyRankingStateUpdate(
    updater: (currentState: CourseRankingState) => CourseRankingState,
  ) {
    const nextState = updater(rankingStateRef.current);
    rankingStateRef.current = nextState;
    setRankingState(nextState);

    if (!user) {
      return;
    }

    const queuedUserId = user.id;
    syncQueueRef.current = syncQueueRef.current
      .then(async () => {
        if (userIdRef.current !== queuedUserId) {
          return;
        }

        const currentRemoteRankings = await getMyRankings();
        await syncRankingStateToSupabase(nextState, currentRemoteRankings);
      })
      .catch((error) => {
        console.error("Failed to sync rankings to Supabase.", error);
      });
  }

  return (
    <CourseRankingContext.Provider
      value={{
        rankingState,
        rankedCourses,
        rankedCourseCount,
        hasTrueRankingThreshold,
        replaceRankingState: (nextState) => {
          const normalizedState = normalizeCourseRankingState(nextState);
          void applyRankingStateUpdate(() => normalizedState);
        },
        markPlayedCourse: (input) => {
          void applyRankingStateUpdate((currentState) => markCoursePlayed(currentState, input));
        },
        saveCourseRanking: (input) => {
          void applyRankingStateUpdate((currentState) => updateCourseRanking(currentState, input));
        },
        saveRoundDetails: (input) => {
          void applyRankingStateUpdate((currentState) => saveCourseRoundDetails(currentState, input));
        },
        removePlayedCourse: (courseId) => {
          void applyRankingStateUpdate((currentState) => removeCourseRanking(currentState, courseId));
        },
        reorderFullRanking: (input) => {
          void applyRankingStateUpdate((currentState) => reorderFullCourseRanking(currentState, input));
        },
        reorderBucket: (bucket, orderedCourseIds) => {
          void applyRankingStateUpdate((currentState) =>
            reorderBucketCourses(currentState, bucket, orderedCourseIds),
          );
        },
        getCourseRankingRecord: (courseId) => getCourseRanking(rankingState, courseId),
        hasCourseBeenPlayed: (courseId) => hasCourseBeenPlayed(rankingState, courseId),
        getCourseBucket: (courseId) => getCourseBucket(rankingState, courseId),
        getCourseGlobalOrder: (courseId) => getCourseGlobalOrder(rankingState, courseId),
        getCourseBucketOrder: (courseId) => getCourseBucketOrder(rankingState, courseId),
        getCourseNumericRating: (courseId) => getCourseNumericRating(rankingState, courseId),
        getCoursePlayCount: (courseId) => getCoursePlayCount(rankingState, courseId),
        getBucketCourses: (bucket) => getBucketCourses(rankingState, bucket),
      }}
    >
      {children}
    </CourseRankingContext.Provider>
  );
}

export function useCourseRankings() {
  const context = useContext(CourseRankingContext);

  if (!context) {
    throw new Error("useCourseRankings must be used within a CourseRankingProvider");
  }

  return context;
}
