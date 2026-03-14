import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import {
  COURSE_RANKING_STORAGE_KEY,
  createEmptyCourseRankingState,
  getBucketCourses,
  getCourseBucket,
  getCourseBucketOrder,
  getCourseGlobalOrder,
  getCoursePlayCount,
  getCourseRanking,
  getRankedCourseCount,
  getRankedCourses,
  hasCourseBeenPlayed,
  hasMinimumRankedCourses,
  markCoursePlayed,
  normalizeCourseRankingState,
  reorderFullCourseRanking,
  removeCourseRanking,
  reorderBucketCourses,
  updateCourseRanking,
  type CourseRankingBucket,
  type CourseRankingState,
  type MarkCoursePlayedInput,
  type UpdateCourseRankingInput,
} from "@/lib/course-rankings";

interface CourseRankingContextValue {
  rankingState: CourseRankingState;
  rankedCourses: ReturnType<typeof getRankedCourses>;
  rankedCourseCount: number;
  hasTrueRankingThreshold: boolean;
  markPlayedCourse: (input: MarkCoursePlayedInput) => void;
  saveCourseRanking: (input: UpdateCourseRankingInput) => void;
  removePlayedCourse: (courseId: string) => void;
  reorderFullRanking: (orderedCourseIds: string[]) => void;
  reorderBucket: (bucket: CourseRankingBucket, orderedCourseIds: string[]) => void;
  getCourseRankingRecord: (courseId: string) => ReturnType<typeof getCourseRanking>;
  hasCourseBeenPlayed: (courseId: string) => boolean;
  getCourseBucket: (courseId: string) => CourseRankingBucket | null;
  getCourseGlobalOrder: (courseId: string) => number | null;
  getCourseBucketOrder: (courseId: string) => number | null;
  getCoursePlayCount: (courseId: string) => number;
  getBucketCourses: (bucket: CourseRankingBucket) => ReturnType<typeof getBucketCourses>;
}

const CourseRankingContext = createContext<CourseRankingContextValue | null>(null);

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

function writeStoredCourseRankingState(state: CourseRankingState) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(COURSE_RANKING_STORAGE_KEY, JSON.stringify(state));
}

export function CourseRankingProvider({ children }: { children: ReactNode }) {
  const [rankingState, setRankingState] = useState<CourseRankingState>(() => readStoredCourseRankingState());

  useEffect(() => {
    writeStoredCourseRankingState(rankingState);
  }, [rankingState]);

  const rankedCourses = getRankedCourses(rankingState);
  const rankedCourseCount = getRankedCourseCount(rankingState);
  const hasTrueRankingThreshold = hasMinimumRankedCourses(rankingState);

  return (
    <CourseRankingContext.Provider
      value={{
        rankingState,
        rankedCourses,
        rankedCourseCount,
        hasTrueRankingThreshold,
        markPlayedCourse: (input) => {
          setRankingState((currentState) => markCoursePlayed(currentState, input));
        },
        saveCourseRanking: (input) => {
          setRankingState((currentState) => updateCourseRanking(currentState, input));
        },
        removePlayedCourse: (courseId) => {
          setRankingState((currentState) => removeCourseRanking(currentState, courseId));
        },
        reorderFullRanking: (orderedCourseIds) => {
          setRankingState((currentState) => reorderFullCourseRanking(currentState, orderedCourseIds));
        },
        reorderBucket: (bucket, orderedCourseIds) => {
          setRankingState((currentState) => reorderBucketCourses(currentState, bucket, orderedCourseIds));
        },
        getCourseRankingRecord: (courseId) => getCourseRanking(rankingState, courseId),
        hasCourseBeenPlayed: (courseId) => hasCourseBeenPlayed(rankingState, courseId),
        getCourseBucket: (courseId) => getCourseBucket(rankingState, courseId),
        getCourseGlobalOrder: (courseId) => getCourseGlobalOrder(rankingState, courseId),
        getCourseBucketOrder: (courseId) => getCourseBucketOrder(rankingState, courseId),
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
