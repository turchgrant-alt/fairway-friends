import { useState } from "react";
import { Trash2 } from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { useCourseRankings } from "@/hooks/use-course-rankings";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";

interface UnrankCourseButtonProps {
  courseId: string;
  courseName: string;
  className?: string;
  triggerLabel?: string;
  onRemoved?: () => void;
}

export default function UnrankCourseButton({
  courseId,
  courseName,
  className,
  triggerLabel = "Remove from rankings",
  onRemoved,
}: UnrankCourseButtonProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { removePlayedCourse } = useCourseRankings();
  const [open, setOpen] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  async function handleConfirm() {
    setIsRemoving(true);

    try {
      const result = await removePlayedCourse(courseId);
      setOpen(false);
      onRemoved?.();

      if (result.remoteSyncFailed) {
        toast({
          variant: "destructive",
          title: "Removed locally, but sync failed",
          description:
            "The course was removed from this device, but GolfeR could not delete the saved Supabase record. Try again later to resync.",
        });
        return;
      }

      toast({
        title: "Removed from rankings",
        description: `${courseName} is no longer in your rankings.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Could not remove course",
        description: error instanceof Error ? error.message : "Try again.",
      });
    } finally {
      setIsRemoving(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={
          className ??
          "inline-flex items-center justify-center gap-2 rounded-full border border-rose-200 bg-white px-4 py-2.5 text-sm font-medium text-rose-700"
        }
      >
        <Trash2 size={14} />
        {triggerLabel}
      </button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent className="max-w-md rounded-[28px] border border-[hsl(var(--golfer-line))] bg-white shadow-[0_32px_90px_-55px_rgba(12,25,19,0.5)]">
          <AlertDialogHeader className="text-left">
            <AlertDialogTitle className="text-[1.6rem] leading-tight text-[hsl(var(--golfer-deep))]">
              Remove this course from your rankings?
            </AlertDialogTitle>
            <AlertDialogDescription className="mt-3 text-sm leading-7 text-[hsl(var(--golfer-deep-soft))]/[0.78]">
              {courseName} will be removed from your ranking list, and any saved round details for this course will be
              deleted from this device.
              {user ? " GolfeR will also try to delete the saved ranking from Supabase for your account." : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="rounded-[20px] bg-[hsl(var(--golfer-cream))] px-4 py-3 text-sm leading-7 text-[hsl(var(--golfer-deep-soft))]/[0.76]">
            This cannot be undone from the list. You can add the course again later by using <span className="font-medium text-[hsl(var(--golfer-deep))]">Played this course</span>.
          </div>

          <AlertDialogFooter className="gap-2 sm:justify-end">
            <AlertDialogCancel
              disabled={isRemoving}
              className="mt-0 rounded-full border-[hsl(var(--golfer-line))] text-[hsl(var(--golfer-deep))]"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                if (isRemoving) return;
                void handleConfirm();
              }}
              className="rounded-full bg-rose-600 text-white hover:bg-rose-700"
            >
              {isRemoving ? "Removing..." : "Remove course"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
