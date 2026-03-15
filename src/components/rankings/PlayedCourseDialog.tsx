import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Scale, Trophy } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCourseRankings } from "@/hooks/use-course-rankings";
import { useRankedCourseRecords } from "@/hooks/use-ranked-course-records";
import {
  COURSE_BUCKET_PRIORITY,
  MINIMUM_TRUE_RANKING_COUNT,
  normalizeCourseRankingState,
  type CourseRankingState,
  type CourseRankingBucket,
} from "@/lib/course-rankings";

type FlowStep = "bucket" | "compare" | "saved";

interface ComparisonState {
  low: number;
  high: number;
  skippedIndices: number[];
}

interface PlayedCourseDialogProps {
  courseId: string;
  courseName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: "play" | "rerank";
}

const BUCKET_COPY: Record<
  CourseRankingBucket,
  { label: string; description: string; accentClassName: string; badgeClassName: string }
> = {
  great: {
    label: "Great",
    description: "Courses worth chasing again and stacking near the top.",
    accentClassName: "border-[hsl(var(--golfer-deep))] bg-[hsl(var(--golfer-deep))] text-white",
    badgeClassName: "bg-white/14 text-white",
  },
  fine: {
    label: "Fine",
    description: "Solid rounds that belong in the middle of the pack.",
    accentClassName: "border-[hsl(var(--golfer-line))] bg-[hsl(var(--golfer-cream))] text-[hsl(var(--golfer-deep))]",
    badgeClassName: "bg-white text-[hsl(var(--golfer-deep))]",
  },
  bad: {
    label: "Bad",
    description: "Courses you would rank clearly below the rest.",
    accentClassName: "border-[hsl(var(--golfer-line))] bg-white text-[hsl(var(--golfer-deep))]",
    badgeClassName: "bg-[hsl(var(--golfer-mist))] text-[hsl(var(--golfer-deep))]",
  },
};

function formatBucketLabel(bucket: CourseRankingBucket | null) {
  return bucket ? BUCKET_COPY[bucket].label : "Unknown";
}

function createInitialComparisonState(bucketSize: number): ComparisonState | null {
  if (bucketSize <= 0) return null;

  return {
    low: 0,
    high: bucketSize,
    skippedIndices: [],
  };
}

function getCandidateIndices(state: ComparisonState) {
  const nextIndices = [];

  for (let index = state.low; index < state.high; index += 1) {
    if (!state.skippedIndices.includes(index)) {
      nextIndices.push(index);
    }
  }

  return nextIndices;
}

function getComparisonIndex(state: ComparisonState | null) {
  if (!state) return null;

  const candidateIndices = getCandidateIndices(state);
  if (candidateIndices.length === 0) return null;

  const midpoint = (state.low + state.high - 1) / 2;

  return [...candidateIndices].sort((a, b) => {
    const distanceDifference = Math.abs(a - midpoint) - Math.abs(b - midpoint);
    if (distanceDifference !== 0) return distanceDifference;
    return a - b;
  })[0];
}

function canSkipComparison(state: ComparisonState | null) {
  if (!state) return false;
  return getCandidateIndices(state).length > 1;
}

function hasResolvedPlacement(state: ComparisonState | null) {
  return Boolean(state && state.low >= state.high);
}

function getResolvedBucketOrder(state: ComparisonState | null) {
  if (!state || !hasResolvedPlacement(state)) return null;
  return state.low + 1;
}

function formatBucketTitle(bucket: CourseRankingBucket | null) {
  if (!bucket) return "Unknown";
  return formatBucketLabel(bucket);
}

export default function PlayedCourseDialog({
  courseId,
  courseName,
  open,
  onOpenChange,
  mode = "play",
}: PlayedCourseDialogProps) {
  const {
    rankingState,
    rankedCourseCount,
    hasTrueRankingThreshold,
    getBucketCourses,
    getCourseNumericRating,
    getCourseRankingRecord,
    markPlayedCourse,
    replaceRankingState,
    saveCourseRanking,
  } = useCourseRankings();
  const [step, setStep] = useState<FlowStep>("bucket");
  const [selectedBucket, setSelectedBucket] = useState<CourseRankingBucket | null>(null);
  const [savedDuringCurrentFlow, setSavedDuringCurrentFlow] = useState(false);
  const [comparisonState, setComparisonState] = useState<ComparisonState | null>(null);
  const [comparisonHistory, setComparisonHistory] = useState<ComparisonState[]>([]);
  const [comparisonHint, setComparisonHint] = useState<string | null>(null);
  const [flowStartRankingState, setFlowStartRankingState] = useState<CourseRankingState | null>(null);

  const selectedBucketCourses = useMemo(() => {
    if (!selectedBucket) return [];
    return getBucketCourses(selectedBucket).filter((course) => course.courseId !== courseId);
  }, [courseId, getBucketCourses, selectedBucket]);
  const { records: rankedBucketRecords, isLoading: isRankedBucketRecordsLoading } = useRankedCourseRecords(selectedBucketCourses);
  const currentCourseRanking = getCourseRankingRecord(courseId);
  const currentCourseNumericRating = getCourseNumericRating(courseId);
  const rankedCourseThresholdRemaining = Math.max(
    MINIMUM_TRUE_RANKING_COUNT - (currentCourseRanking ? rankedCourseCount : rankedCourseCount + 1),
    0,
  );
  const currentComparisonIndex = useMemo(() => getComparisonIndex(comparisonState), [comparisonState]);
  const currentComparedRecord =
    currentComparisonIndex != null ? rankedBucketRecords[currentComparisonIndex] ?? null : null;
  const skipDisabled = !canSkipComparison(comparisonState);
  const canUndoComparison = comparisonHistory.length > 0;
  const savedBucketOrder = currentCourseRanking?.bucketOrder ?? getResolvedBucketOrder(comparisonState);

  useEffect(() => {
    if (!open) {
      setFlowStartRankingState(null);
      return;
    }

    if (!flowStartRankingState) {
      setFlowStartRankingState(normalizeCourseRankingState(rankingState));
    }
  }, [flowStartRankingState, open, rankingState]);

  useEffect(() => {
    if (!open) {
      setStep("bucket");
      setSelectedBucket(null);
      setSavedDuringCurrentFlow(false);
      setComparisonState(null);
      setComparisonHistory([]);
      setComparisonHint(null);
    }
  }, [open]);

  const isRerankMode = mode === "rerank";

  function finalizePlacement(bucket: CourseRankingBucket, bucketOrder?: number | null) {
    if (isRerankMode) {
      saveCourseRanking({
        courseId,
        bucket,
        bucketOrder,
      });
    } else {
      markPlayedCourse({
        courseId,
        bucket,
        bucketOrder,
      });
    }

    setSavedDuringCurrentFlow(true);
    setComparisonHint(null);
    setStep("saved");
  }

  function handleSelectBucket(bucket: CourseRankingBucket) {
    const bucketCourses = getBucketCourses(bucket).filter((course) => course.courseId !== courseId);
    const initialState = createInitialComparisonState(bucketCourses.length);

    setSelectedBucket(bucket);
    setComparisonHistory([]);
    setComparisonHint(null);

    if (bucketCourses.length === 0) {
      finalizePlacement(bucket, 1);
      return;
    }

    setSavedDuringCurrentFlow(false);
    setComparisonState(initialState);
    setStep("compare");
  }

  function applyComparisonState(nextState: ComparisonState) {
    setComparisonState(nextState);
    setComparisonHint(null);

    if (hasResolvedPlacement(nextState) && selectedBucket) {
      finalizePlacement(selectedBucket, getResolvedBucketOrder(nextState));
    }
  }

  function handleComparisonDecision(preferNewCourse: boolean) {
    if (!comparisonState || currentComparisonIndex == null) return;

    const nextState: ComparisonState = preferNewCourse
      ? {
          low: comparisonState.low,
          high: currentComparisonIndex,
          skippedIndices: [],
        }
      : {
          low: currentComparisonIndex + 1,
          high: comparisonState.high,
          skippedIndices: [],
        };

    setComparisonHistory((currentHistory) => [...currentHistory, comparisonState]);
    applyComparisonState(nextState);
  }

  function handleTooHardToDecide() {
    if (!comparisonState || currentComparisonIndex == null) return;

    const nextState: ComparisonState = {
      ...comparisonState,
      skippedIndices: [...comparisonState.skippedIndices, currentComparisonIndex],
    };

    if (getComparisonIndex(nextState) == null) {
      setComparisonHint("No other useful comparison is left in this bucket. Choose between these two to finish placement.");
      return;
    }

    setComparisonHistory((currentHistory) => [...currentHistory, comparisonState]);
    setComparisonState(nextState);
    setComparisonHint("Skipped this matchup. GolfeR moved to the next best comparison inside the same bucket.");
  }

  function handleBack() {
    if (step === "saved" && savedDuringCurrentFlow) {
      if (flowStartRankingState) {
        replaceRankingState(flowStartRankingState);
      }

      setSavedDuringCurrentFlow(false);

      if (comparisonHistory.length > 0) {
        const previousState = comparisonHistory[comparisonHistory.length - 1];
        setComparisonHistory((currentHistory) => currentHistory.slice(0, -1));
        setComparisonState(previousState);
        setComparisonHint(null);
        setStep("compare");
        return;
      }

      setComparisonState(null);
      setComparisonHistory([]);
      setSelectedBucket(null);
      setComparisonHint(null);
      setStep("bucket");
      return;
    }

    if (step === "compare") {
      if (comparisonHistory.length > 0) {
        const previousState = comparisonHistory[comparisonHistory.length - 1];
        setComparisonHistory((currentHistory) => currentHistory.slice(0, -1));
        setComparisonState(previousState);
        setComparisonHint(null);
        return;
      }

      setComparisonState(null);
      setSelectedBucket(null);
      setComparisonHint(null);
      setStep("bucket");
      return;
    }

    setSavedDuringCurrentFlow(false);
    setComparisonState(null);
    setComparisonHistory([]);
    setSelectedBucket(null);
    setComparisonHint(null);
    setStep("bucket");
  }

  function handleClose() {
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl rounded-[32px] border border-[hsl(var(--golfer-line))] bg-white p-0 shadow-[0_32px_90px_-55px_rgba(12,25,19,0.5)]">
        <div className="overflow-hidden rounded-[32px]">
          <div className="border-b border-[hsl(var(--golfer-line))] bg-[hsl(var(--golfer-cream))] px-7 py-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[hsl(var(--golfer-deep-soft))]/[0.58]">
                  Played flow
                </p>
                <DialogTitle className="mt-3 text-3xl text-[hsl(var(--golfer-deep))]">
                  {step === "bucket"
                    ? isRerankMode
                      ? "Rerank this course"
                      : "Where does this round belong?"
                    : step === "compare"
                      ? `Place ${courseName} inside ${formatBucketTitle(selectedBucket)}`
                      : courseName}
                </DialogTitle>
                <DialogDescription className="mt-3 max-w-2xl text-sm leading-7 text-[hsl(var(--golfer-deep-soft))]/[0.78]">
                  {step === "bucket"
                    ? isRerankMode
                      ? `Choose a bucket again for ${courseName}, then place it where it belongs.`
                      : `Mark ${courseName} as played, then start the ranking flow by choosing a bucket.`
                    : step === "compare"
                      ? "Pick the course you prefer more. GolfeR will use the fewest bucket-level comparisons it can."
                      : isRerankMode
                        ? "The course ranking has been updated locally on this device."
                        : "The course has been added locally on this device."}
                </DialogDescription>
              </div>
            </div>
          </div>

          <div className="px-7 py-7">
            {step === "bucket" ? (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  {COURSE_BUCKET_PRIORITY.map((bucket) => {
                    const bucketCourses = getBucketCourses(bucket).filter((course) => course.courseId !== courseId);
                    const bucketCopy = BUCKET_COPY[bucket];

                    return (
                      <button
                        key={bucket}
                        onClick={() => handleSelectBucket(bucket)}
                        className={`rounded-[28px] border p-5 text-left transition hover:-translate-y-0.5 ${bucketCopy.accentClassName}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <span className="text-xl font-semibold">{bucketCopy.label}</span>
                          <span className={`rounded-full px-3 py-1 text-xs font-medium ${bucketCopy.badgeClassName}`}>
                            {bucketCourses.length === 0 ? "Empty bucket" : `${bucketCourses.length} ranked`}
                          </span>
                        </div>
                        <p className="mt-4 text-sm leading-7 opacity-90">{bucketCopy.description}</p>
                        {isRerankMode && currentCourseRanking?.bucket === bucket ? (
                          <p className="mt-3 text-xs uppercase tracking-[0.18em] opacity-70">Current bucket</p>
                        ) : null}
                        <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium">
                          Choose bucket <ArrowRight size={15} />
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="rounded-[24px] bg-[hsl(var(--golfer-cream))] px-5 py-4 text-sm leading-7 text-[hsl(var(--golfer-deep-soft))]/[0.78]">
                  The full numbered ranking only needs to feel strict after at least {MINIMUM_TRUE_RANKING_COUNT} ranked
                  courses. This popup already stores the same underlying order locally.
                </div>

                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-[hsl(var(--golfer-deep-soft))]/[0.74]">
                      {rankedCourseCount} course{rankedCourseCount === 1 ? "" : "s"} currently stored in local rankings
                  </span>
                  <button
                    onClick={handleClose}
                    className="rounded-full border border-[hsl(var(--golfer-line))] bg-white px-5 py-3 text-sm font-medium text-[hsl(var(--golfer-deep))]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : null}

            {step === "compare" && selectedBucket ? (
              <div className="space-y-6">
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:items-stretch">
                  <button
                    onClick={() => handleComparisonDecision(false)}
                    disabled={currentComparedRecord == null}
                    className="rounded-[28px] border border-[hsl(var(--golfer-line))] bg-white p-6 text-left shadow-[0_20px_55px_-46px_rgba(12,25,19,0.35)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[hsl(var(--golfer-deep-soft))]/[0.56]">
                      Already ranked
                    </p>
                      <h3 className="mt-4 text-2xl text-[hsl(var(--golfer-deep))]">
                        {currentComparedRecord?.course?.name ?? currentComparedRecord?.fallbackName ?? "Loading course..."}
                      </h3>
                    <p className="mt-3 text-sm leading-7 text-[hsl(var(--golfer-deep-soft))]/[0.74]">
                      {currentComparedRecord
                        ? `Currently #${currentComparedRecord.ranking.bucketOrder} in ${formatBucketTitle(selectedBucket)}`
                        : isRankedBucketRecordsLoading
                          ? "Loading local comparison target..."
                          : "Comparison target unavailable"}
                    </p>
                    <span className="mt-8 inline-flex items-center gap-2 rounded-full bg-[hsl(var(--golfer-cream))] px-4 py-2 text-sm font-medium text-[hsl(var(--golfer-deep))]">
                      Prefer this course <ArrowRight size={14} />
                    </span>
                  </button>

                  <div className="flex items-center justify-center">
                    <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[hsl(var(--golfer-mist))] text-[hsl(var(--golfer-deep))]">
                      <Scale size={18} />
                    </span>
                  </div>

                  <button
                    onClick={() => handleComparisonDecision(true)}
                    className="rounded-[28px] border border-[hsl(var(--golfer-deep))] bg-[hsl(var(--golfer-deep))] p-6 text-left text-white shadow-[0_28px_70px_-52px_rgba(12,25,19,0.65)] transition hover:-translate-y-0.5"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/0.7">
                      New course
                    </p>
                    <h3 className="mt-4 text-2xl">{courseName}</h3>
                    <p className="mt-3 text-sm leading-7 text-white/0.78">
                      Click here if this new round belongs above the ranked course on the left.
                    </p>
                    <span className="mt-8 inline-flex items-center gap-2 rounded-full bg-white/12 px-4 py-2 text-sm font-medium text-white">
                      Prefer this course <ArrowRight size={14} />
                    </span>
                  </button>
                </div>

                <div className="rounded-[24px] bg-[hsl(var(--golfer-cream))] px-5 py-4 text-sm leading-7 text-[hsl(var(--golfer-deep-soft))]/[0.78]">
                  {comparisonHint ??
                    `GolfeR is narrowing a ${formatBucketTitle(selectedBucket).toLowerCase()} insertion point using the current bucket order.`}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={handleBack}
                      className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--golfer-line))] bg-white px-5 py-3 text-sm font-medium text-[hsl(var(--golfer-deep))]"
                    >
                      <ArrowLeft size={15} /> {canUndoComparison ? "Undo" : "Back"}
                    </button>
                    <button
                      onClick={handleTooHardToDecide}
                      disabled={skipDisabled}
                      className="rounded-full border border-[hsl(var(--golfer-line))] bg-[hsl(var(--golfer-cream))] px-5 py-3 text-sm font-medium text-[hsl(var(--golfer-deep))] disabled:cursor-not-allowed disabled:opacity-55"
                    >
                      Too hard to decide
                    </button>
                  </div>
                  <button
                    onClick={handleClose}
                    className="rounded-full bg-[hsl(var(--golfer-deep))] px-5 py-3 text-sm font-medium text-white"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : null}

            {step === "saved" && selectedBucket ? (
              <div className="space-y-6">
                <div className="rounded-[28px] border border-[hsl(var(--golfer-line))] bg-white p-6">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[hsl(var(--golfer-mist))] text-[hsl(var(--golfer-deep))]">
                      <CheckCircle2 size={18} />
                    </span>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[hsl(var(--golfer-deep-soft))]/[0.56]">
                        Stored locally
                      </p>
                      <h3 className="mt-2 text-2xl text-[hsl(var(--golfer-deep))]">
                        {isRerankMode ? "Updated in" : "Added to"} {formatBucketTitle(selectedBucket)}
                      </h3>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 sm:grid-cols-3">
                    <div className="rounded-[22px] bg-[hsl(var(--golfer-cream))] p-4">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-[hsl(var(--golfer-deep-soft))]/[0.56]">
                        {hasTrueRankingThreshold ? "Numeric rating" : "Visible order"}
                      </p>
                      <p className="mt-2 text-xl text-[hsl(var(--golfer-deep))]">
                        {hasTrueRankingThreshold
                          ? currentCourseNumericRating != null
                            ? currentCourseNumericRating.toFixed(1)
                            : "Pending"
                          : currentCourseRanking?.globalOrder ?? "Pending"}
                      </p>
                    </div>
                    <div className="rounded-[22px] bg-[hsl(var(--golfer-cream))] p-4">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-[hsl(var(--golfer-deep-soft))]/[0.56]">
                        Bucket order
                      </p>
                      <p className="mt-2 text-xl text-[hsl(var(--golfer-deep))]">
                        {savedBucketOrder ?? "Pending"}
                      </p>
                    </div>
                    <div className="rounded-[22px] bg-[hsl(var(--golfer-cream))] p-4">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-[hsl(var(--golfer-deep-soft))]/[0.56]">
                        Ranking mode
                      </p>
                      <p className="mt-2 text-sm leading-7 text-[hsl(var(--golfer-deep))]">
                        {hasTrueRankingThreshold
                          ? "Full ranking threshold reached"
                          : `${rankedCourseThresholdRemaining} more course${rankedCourseThresholdRemaining === 1 ? "" : "s"} before the stricter ranking view turns on`}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[24px] bg-[hsl(var(--golfer-cream))] px-5 py-4 text-sm leading-7 text-[hsl(var(--golfer-deep-soft))]/[0.78]">
                  {comparisonHistory.length > 0
                    ? "Undo will restore the previous ranking state and reopen the last comparison so you can answer differently."
                    : isRerankMode
                      ? "This rerank resolved without additional comparisons, so the course was updated directly."
                      : "This bucket was empty, so GolfeR saved the course immediately without needing a comparison."}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <button
                    onClick={handleBack}
                    className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--golfer-line))] bg-white px-5 py-3 text-sm font-medium text-[hsl(var(--golfer-deep))]"
                  >
                    <ArrowLeft size={15} /> {comparisonHistory.length > 0 ? "Undo" : "Back"}
                  </button>
                  <button
                    onClick={handleClose}
                    className="rounded-full bg-[hsl(var(--golfer-deep))] px-5 py-3 text-sm font-medium text-white"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
