import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Trophy } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCourseRankings } from "@/hooks/use-course-rankings";
import {
  COURSE_BUCKET_PRIORITY,
  MINIMUM_TRUE_RANKING_COUNT,
  type CourseRankingBucket,
} from "@/lib/course-rankings";

type FlowStep = "bucket" | "compare-placeholder" | "saved";

interface PlayedCourseDialogProps {
  courseId: string;
  courseName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

export default function PlayedCourseDialog({
  courseId,
  courseName,
  open,
  onOpenChange,
}: PlayedCourseDialogProps) {
  const {
    rankedCourseCount,
    hasTrueRankingThreshold,
    getBucketCourses,
    getCourseRankingRecord,
    markPlayedCourse,
    removePlayedCourse,
  } = useCourseRankings();
  const [step, setStep] = useState<FlowStep>("bucket");
  const [selectedBucket, setSelectedBucket] = useState<CourseRankingBucket | null>(null);
  const [insertedDuringCurrentFlow, setInsertedDuringCurrentFlow] = useState(false);

  const selectedBucketCourses = useMemo(
    () => (selectedBucket ? getBucketCourses(selectedBucket) : []),
    [getBucketCourses, selectedBucket],
  );
  const currentCourseRanking = getCourseRankingRecord(courseId);
  const rankedCourseThresholdRemaining = Math.max(
    MINIMUM_TRUE_RANKING_COUNT - (currentCourseRanking ? rankedCourseCount : rankedCourseCount + 1),
    0,
  );

  useEffect(() => {
    if (!open) {
      setStep("bucket");
      setSelectedBucket(null);
      setInsertedDuringCurrentFlow(false);
    }
  }, [open]);

  function handleSelectBucket(bucket: CourseRankingBucket) {
    const bucketCourses = getBucketCourses(bucket);
    setSelectedBucket(bucket);

    if (bucketCourses.length === 0) {
      markPlayedCourse({
        courseId,
        bucket,
      });
      setInsertedDuringCurrentFlow(true);
      setStep("saved");
      return;
    }

    setInsertedDuringCurrentFlow(false);
    setStep("compare-placeholder");
  }

  function handleBack() {
    if (step === "saved" && insertedDuringCurrentFlow) {
      removePlayedCourse(courseId);
    }

    setInsertedDuringCurrentFlow(false);
    setSelectedBucket(null);
    setStep("bucket");
  }

  function handleClose() {
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-[32px] border border-[hsl(var(--golfer-line))] bg-white p-0 shadow-[0_32px_90px_-55px_rgba(12,25,19,0.5)]">
        <div className="overflow-hidden rounded-[32px]">
          <div className="border-b border-[hsl(var(--golfer-line))] bg-[hsl(var(--golfer-cream))] px-7 py-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[hsl(var(--golfer-deep-soft))]/[0.58]">
                  Played flow
                </p>
                <DialogTitle className="mt-3 text-3xl text-[hsl(var(--golfer-deep))]">
                  {step === "bucket" ? "Where does this round belong?" : courseName}
                </DialogTitle>
                <DialogDescription className="mt-3 max-w-2xl text-sm leading-7 text-[hsl(var(--golfer-deep-soft))]/[0.78]">
                  {step === "bucket"
                    ? `Mark ${courseName} as played, then start the ranking flow by choosing a bucket.`
                    : step === "saved"
                      ? "The course has been added locally on this device."
                      : "This bucket already has courses, so the next step will become the head-to-head ranking flow."}
                </DialogDescription>
              </div>
            </div>
          </div>

          <div className="px-7 py-7">
            {step === "bucket" ? (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  {COURSE_BUCKET_PRIORITY.map((bucket) => {
                    const bucketCourses = getBucketCourses(bucket);
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
                            {bucketCourses.length === 0
                              ? "Empty bucket"
                              : `${bucketCourses.length} ranked`}
                          </span>
                        </div>
                        <p className="mt-4 text-sm leading-7 opacity-90">{bucketCopy.description}</p>
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

            {step === "compare-placeholder" && selectedBucket ? (
              <div className="space-y-6">
                <div className="rounded-[28px] border border-[hsl(var(--golfer-line))] bg-white p-6">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[hsl(var(--golfer-mist))] text-[hsl(var(--golfer-deep))]">
                      <Trophy size={18} />
                    </span>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[hsl(var(--golfer-deep-soft))]/[0.56]">
                        Next step placeholder
                      </p>
                      <h3 className="mt-2 text-2xl text-[hsl(var(--golfer-deep))]">
                        Compare inside {formatBucketLabel(selectedBucket)}
                      </h3>
                    </div>
                  </div>

                  <p className="mt-5 text-sm leading-8 text-[hsl(var(--golfer-deep-soft))]/[0.78]">
                    {formatBucketLabel(selectedBucket)} already contains {selectedBucketCourses.length} course
                    {selectedBucketCourses.length === 1 ? "" : "s"}. The next prompt can replace this screen with the
                    actual Beli-style comparison flow and use the existing back button location and state handoff.
                  </p>

                  <div className="mt-5 rounded-[22px] bg-[hsl(var(--golfer-cream))] p-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[hsl(var(--golfer-deep-soft))]/[0.58]">
                      Comparison handoff
                    </p>
                    <p className="mt-3 text-sm leading-7 text-[hsl(var(--golfer-deep))]">
                      Future prompts can replace this panel with matchups against the {selectedBucketCourses.length} existing{" "}
                      {formatBucketLabel(selectedBucket).toLowerCase()} course
                      {selectedBucketCourses.length === 1 ? "" : "s"} already stored locally.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <button
                    onClick={handleBack}
                    className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--golfer-line))] bg-white px-5 py-3 text-sm font-medium text-[hsl(var(--golfer-deep))]"
                  >
                    <ArrowLeft size={15} /> Undo
                  </button>
                  <button
                    onClick={handleClose}
                    className="rounded-full bg-[hsl(var(--golfer-deep))] px-5 py-3 text-sm font-medium text-white"
                  >
                    Close for now
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
                        Added to {formatBucketLabel(selectedBucket)}
                      </h3>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 sm:grid-cols-3">
                    <div className="rounded-[22px] bg-[hsl(var(--golfer-cream))] p-4">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-[hsl(var(--golfer-deep-soft))]/[0.56]">
                        Global position
                      </p>
                      <p className="mt-2 text-xl text-[hsl(var(--golfer-deep))]">
                        {currentCourseRanking?.globalOrder ?? "Pending"}
                      </p>
                    </div>
                    <div className="rounded-[22px] bg-[hsl(var(--golfer-cream))] p-4">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-[hsl(var(--golfer-deep-soft))]/[0.56]">
                        Bucket order
                      </p>
                      <p className="mt-2 text-xl text-[hsl(var(--golfer-deep))]">
                        {currentCourseRanking?.bucketOrder ?? "Pending"}
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

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <button
                    onClick={handleBack}
                    className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--golfer-line))] bg-white px-5 py-3 text-sm font-medium text-[hsl(var(--golfer-deep))]"
                  >
                    <ArrowLeft size={15} /> Undo
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
