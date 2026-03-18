import { useMemo, useState, type DragEvent } from "react";
import { ArrowRight, GripVertical, ListOrdered, Medal, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

import UnrankCourseButton from "@/components/rankings/UnrankCourseButton";
import { useCourseRankings } from "@/hooks/use-course-rankings";
import { useRankedCourseRecords } from "@/hooks/use-ranked-course-records";
import type { CourseRankingBucket } from "@/lib/course-rankings";
import { formatDisplayDate } from "@/lib/app-content";

const REORDER_END_TARGET = "__end__";

const BUCKET_STYLES: Record<
  CourseRankingBucket,
  {
    badgeClassName: string;
    rowClassName: string;
    numberClassName: string;
  }
> = {
  great: {
    badgeClassName: "bg-[#dcefe2] text-[#123d2a]",
    rowClassName: "border-[#c9e1d1] bg-[#f5fbf6]",
    numberClassName: "bg-[#123d2a] text-white",
  },
  fine: {
    badgeClassName: "bg-[#f9e7a5] text-[#5a4708]",
    rowClassName: "border-[#f0dc92] bg-[#fffaf0]",
    numberClassName: "bg-[#caa53a] text-white",
  },
  bad: {
    badgeClassName: "bg-[#f7d2cb] text-[#7d2b1f]",
    rowClassName: "border-[#efc0b8] bg-[#fff5f3]",
    numberClassName: "bg-[#b95041] text-white",
  },
};

type DropIndicator = {
  courseId: string;
  placement: "before" | "after";
};

export default function ProfileRankingSection() {
  const navigate = useNavigate();
  const {
    rankedCourses,
    rankedCourseCount,
    hasTrueRankingThreshold,
    reorderFullRanking,
    getCourseNumericRating,
  } = useCourseRankings();
  const {
    records: rankedCourseRecords,
    isLoading: isRankedCoursesLoading,
    hasError: hasRankedCoursesError,
  } = useRankedCourseRecords(rankedCourses);
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [draggedCourseId, setDraggedCourseId] = useState<string | null>(null);
  const [dropIndicator, setDropIndicator] = useState<DropIndicator | null>(null);

  const visibleCourseIds = useMemo(
    () => rankedCourseRecords.map(({ ranking }) => ranking.courseId),
    [rankedCourseRecords],
  );

  function clearDragState() {
    setDraggedCourseId(null);
    setDropIndicator(null);
  }

  function handleDragStart(courseId: string) {
    if (!isReorderMode) return;
    setDraggedCourseId(courseId);
    setDropIndicator(null);
  }

  function handleRowDragOver(
    event: DragEvent<HTMLElement>,
    targetCourseId: string,
  ) {
    if (!isReorderMode || !draggedCourseId || draggedCourseId === targetCourseId) return;

    event.preventDefault();
    const bounds = event.currentTarget.getBoundingClientRect();
    const placement = event.clientY < bounds.top + bounds.height / 2 ? "before" : "after";
    setDropIndicator({
      courseId: targetCourseId,
      placement,
    });
  }

  function handleRowDrop(targetCourseId: string) {
    if (!isReorderMode || !draggedCourseId) return;

    const nextOrderedCourseIds = visibleCourseIds.filter((courseId) => courseId !== draggedCourseId);
    const targetIndex = nextOrderedCourseIds.indexOf(targetCourseId);

    if (targetIndex === -1) {
      clearDragState();
      return;
    }

    const placement =
      dropIndicator?.courseId === targetCourseId ? dropIndicator.placement : "after";
    const insertionIndex = placement === "before" ? targetIndex : targetIndex + 1;

    nextOrderedCourseIds.splice(insertionIndex, 0, draggedCourseId);
    reorderFullRanking({
      orderedCourseIds: nextOrderedCourseIds,
      movedCourseId: draggedCourseId,
      targetCourseId,
      placement,
    });
    clearDragState();
  }

  function handleEndZoneDrop() {
    if (!isReorderMode || !draggedCourseId) return;

    const nextOrderedCourseIds = visibleCourseIds.filter((courseId) => courseId !== draggedCourseId);
    nextOrderedCourseIds.push(draggedCourseId);
    reorderFullRanking({
      orderedCourseIds: nextOrderedCourseIds,
      movedCourseId: draggedCourseId,
      targetCourseId: null,
      placement: "after",
    });
    clearDragState();
  }

  return (
    <section id="rankings" className="rounded-[32px] border border-[hsl(var(--golfer-line))] bg-white p-7 shadow-[0_24px_70px_-48px_rgba(12,25,19,0.35)] sm:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[hsl(var(--golfer-deep-soft))]/[0.58]">
            My rankings
          </p>
          <h2 className="mt-4 text-3xl text-[hsl(var(--golfer-deep))]">
            {hasTrueRankingThreshold ? "My GolfeR ranking" : "My ranking is taking shape"}
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-8 text-[hsl(var(--golfer-deep-soft))]/[0.74]">
            One full saved list with visible bucket labels. After manual reorder, the persisted display order becomes
            the source of truth for bucket assignment and the numeric rating values once they unlock.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-4 py-2 text-sm font-medium ${
              hasTrueRankingThreshold
                ? "bg-[hsl(var(--golfer-deep))] text-white"
                : "bg-[hsl(var(--golfer-mist))] text-[hsl(var(--golfer-deep))]"
            }`}
          >
            {rankedCourseCount} ranked course{rankedCourseCount === 1 ? "" : "s"}
          </span>
          <span className="rounded-full bg-[hsl(var(--golfer-cream))] px-4 py-2 text-sm font-medium text-[hsl(var(--golfer-deep))]">
            {hasTrueRankingThreshold ? "Full ranking mode" : "Early-stage mode"}
          </span>
          {rankedCourseCount > 0 ? (
            <button
              onClick={() => {
                setIsReorderMode((currentValue) => !currentValue);
                clearDragState();
              }}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                isReorderMode
                  ? "bg-[hsl(var(--golfer-deep))] text-white"
                  : "border border-[hsl(var(--golfer-line))] bg-white text-[hsl(var(--golfer-deep))]"
              }`}
            >
              <GripVertical size={15} />
              {isReorderMode ? "Done reordering" : "Reorder list"}
            </button>
          ) : null}
        </div>
      </div>

      <div
        className={`mt-6 rounded-[24px] px-5 py-4 text-sm leading-7 ${
          hasTrueRankingThreshold
            ? "bg-[hsl(var(--golfer-deep))] text-white/88"
            : "bg-[hsl(var(--golfer-cream))] text-[hsl(var(--golfer-deep-soft))]/[0.76]"
        }`}
      >
        {hasTrueRankingThreshold ? (
          <span className="inline-flex items-center gap-2">
            <Medal size={15} />
            The five-course threshold has been reached. Ratings now use exact Great, Fine, and Bad score bands.
          </span>
        ) : (
          <span className="inline-flex items-center gap-2">
            <Sparkles size={15} />
            Fewer than five courses are ranked, so this stays a softer early-stage list. Order is saved, but final
            numeric ratings stay hidden until five courses are ranked.
          </span>
        )}
      </div>

      {isReorderMode && rankedCourseCount > 0 ? (
        <div className="mt-4 rounded-[22px] bg-[hsl(var(--golfer-cream))] px-5 py-4 text-sm leading-7 text-[hsl(var(--golfer-deep-soft))]/[0.76]">
          Drag rows into any order. Dropping a course into a different bucket region reassigns its bucket and recalculates
          its numeric rating.
        </div>
      ) : null}

      <div className="mt-8">
        {rankedCourseCount === 0 ? (
          <div className="rounded-[28px] border border-dashed border-[hsl(var(--golfer-line))] bg-white p-10 text-center">
            <div className="mx-auto max-w-2xl">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[hsl(var(--golfer-mist))] text-[hsl(var(--golfer-deep))]">
                <ListOrdered size={18} />
              </span>
              <h3 className="mt-5 text-2xl text-[hsl(var(--golfer-deep))]">No ranked courses yet</h3>
              <p className="mt-3 text-sm leading-8 text-[hsl(var(--golfer-deep-soft))]/[0.74]">
                Open a course page and use the Played this course popup to start building your saved ranking.
              </p>
            </div>
          </div>
        ) : isRankedCoursesLoading ? (
          <div className="rounded-[24px] bg-[hsl(var(--golfer-cream))] p-6 text-sm text-[hsl(var(--golfer-deep-soft))]/[0.74]">
            Loading ranked course details...
          </div>
        ) : hasRankedCoursesError ? (
          <div className="rounded-[24px] bg-[hsl(var(--golfer-cream))] p-6 text-sm leading-7 text-[hsl(var(--golfer-deep-soft))]/[0.74]">
            Your saved rankings loaded, but one or more course detail files could not be resolved for display.
          </div>
        ) : (
          <div className="space-y-4">
            {rankedCourseRecords.map(({ ranking, course, fallbackName, fallbackLocation }) => {
              const bucketStyle = BUCKET_STYLES[ranking.bucket];
              const numericRating = hasTrueRankingThreshold ? getCourseNumericRating(ranking.courseId) : null;
              const isDragged = draggedCourseId === ranking.courseId;
              const showTopDropIndicator =
                dropIndicator?.courseId === ranking.courseId && dropIndicator.placement === "before";
              const showBottomDropIndicator =
                dropIndicator?.courseId === ranking.courseId && dropIndicator.placement === "after";

              return (
                <article
                  key={ranking.courseId}
                  draggable={isReorderMode}
                  onDragStart={() => handleDragStart(ranking.courseId)}
                  onDragEnd={clearDragState}
                  onDragOver={(event) => handleRowDragOver(event, ranking.courseId)}
                  onDrop={() => handleRowDrop(ranking.courseId)}
                  className={`relative grid gap-4 rounded-[28px] border p-5 shadow-[0_18px_44px_-42px_rgba(12,25,19,0.35)] transition ${
                    hasTrueRankingThreshold ? bucketStyle.rowClassName : "border-[hsl(var(--golfer-line))] bg-white"
                  } ${isReorderMode ? "cursor-grab" : ""} ${isDragged ? "opacity-55" : ""} sm:grid-cols-[5rem_minmax(0,1fr)_auto]`}
                >
                  {showTopDropIndicator ? (
                    <span className="absolute inset-x-5 top-0 h-[3px] -translate-y-1/2 rounded-full bg-[hsl(var(--golfer-deep))]" />
                  ) : null}
                  {showBottomDropIndicator ? (
                    <span className="absolute inset-x-5 bottom-0 h-[3px] translate-y-1/2 rounded-full bg-[hsl(var(--golfer-deep))]" />
                  ) : null}

                  <div className="flex items-center gap-3">
                    {hasTrueRankingThreshold ? (
                      <span
                        className={`inline-flex h-12 min-w-12 items-center justify-center rounded-full px-3 text-base font-semibold ${bucketStyle.numberClassName}`}
                      >
                        {numericRating != null ? numericRating.toFixed(1) : "--"}
                      </span>
                    ) : (
                      <span className="inline-flex h-12 min-w-12 items-center justify-center rounded-full border border-[hsl(var(--golfer-line))] bg-white px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[hsl(var(--golfer-deep-soft))]/[0.62]">
                        Early
                      </span>
                    )}
                    {isReorderMode ? (
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[hsl(var(--golfer-line))] bg-white text-[hsl(var(--golfer-deep))]">
                        <GripVertical size={16} />
                      </span>
                    ) : (
                      <div className="sm:hidden">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-[hsl(var(--golfer-deep-soft))]/[0.56]">
                          Rank
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-[hsl(var(--golfer-deep))]">
                        {course?.name ?? fallbackName}
                      </h3>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${bucketStyle.badgeClassName}`}>
                        {ranking.bucket}
                      </span>
                      {ranking.tags?.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-[hsl(var(--golfer-line))] bg-white/80 px-3 py-1 text-xs font-medium text-[hsl(var(--golfer-deep))]"
                        >
                          {tag}
                        </span>
                      ))}
                      {ranking.tags && ranking.tags.length > 2 ? (
                        <span className="rounded-full border border-[hsl(var(--golfer-line))] bg-white/80 px-3 py-1 text-xs font-medium text-[hsl(var(--golfer-deep-soft))]/[0.72]">
                          +{ranking.tags.length - 2} more
                        </span>
                      ) : null}
                      {hasTrueRankingThreshold ? (
                        <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-[hsl(var(--golfer-deep))]">
                          Rating {numericRating != null ? numericRating.toFixed(1) : "--"}
                        </span>
                      ) : null}
                    </div>

                    <p className="mt-2 text-sm text-[hsl(var(--golfer-deep-soft))]/[0.72]">
                      {course?.location ?? fallbackLocation}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2 text-xs text-[hsl(var(--golfer-deep-soft))]/[0.74]">
                      <span className="rounded-full bg-white/80 px-3 py-1.5">
                        Play count {ranking.playCount}
                      </span>
                      <span className="rounded-full bg-white/80 px-3 py-1.5">
                        Last played {ranking.lastPlayedAt ? formatDisplayDate(ranking.lastPlayedAt) : "Not recorded"}
                      </span>
                      {!isReorderMode ? (
                        <span className="rounded-full bg-white/80 px-3 py-1.5">
                          Bucket order #{ranking.bucketOrder}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex flex-col items-stretch gap-2 sm:items-end">
                    {isReorderMode ? (
                      <div className="rounded-[18px] bg-white/80 px-4 py-3 text-sm text-[hsl(var(--golfer-deep-soft))]/[0.72]">
                        Drag to place anywhere
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => navigate(`/course/${ranking.courseId}`)}
                          className="inline-flex items-center justify-center gap-2 rounded-full bg-[hsl(var(--golfer-deep))] px-4 py-2.5 text-sm font-medium text-white"
                        >
                          Open course <ArrowRight size={14} />
                        </button>
                        <UnrankCourseButton
                          courseId={ranking.courseId}
                          courseName={course?.name ?? fallbackName}
                          className="inline-flex items-center justify-center gap-2 rounded-full border border-rose-200 bg-white px-4 py-2.5 text-sm font-medium text-rose-700"
                          triggerLabel="Unrank course"
                        />
                      </>
                    )}
                  </div>
                </article>
              );
            })}

            {isReorderMode ? (
              <div
                onDragOver={(event) => {
                  if (!draggedCourseId) return;
                  event.preventDefault();
                  setDropIndicator({
                    courseId: REORDER_END_TARGET,
                    placement: "after",
                  });
                }}
                onDrop={handleEndZoneDrop}
                className={`rounded-[24px] border border-dashed px-5 py-5 text-center text-sm transition ${
                  dropIndicator?.courseId === REORDER_END_TARGET
                    ? "border-[hsl(var(--golfer-deep))] bg-[hsl(var(--golfer-mist))] text-[hsl(var(--golfer-deep))]"
                    : "border-[hsl(var(--golfer-line))] bg-white text-[hsl(var(--golfer-deep-soft))]/[0.72]"
                }`}
              >
                Drag here to place a course at the end of the list
              </div>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}
