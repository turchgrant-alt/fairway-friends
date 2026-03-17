import { useRef, type ChangeEvent } from "react";
import { Camera, ImagePlus, LoaderCircle, Sparkles } from "lucide-react";

import { toast } from "@/components/ui/sonner";
import type { UploadedCoursePhotoRecord } from "@/lib/course-photo-uploads";
import { formatDemoDate } from "@/lib/demo-v1";

interface CoursePhotoGallerySectionProps {
  courseId: string;
  uploadedPhotos: UploadedCoursePhotoRecord[];
  uploadsConfigured: boolean;
  isLoading: boolean;
  isUploading: boolean;
  isSettingCover: boolean;
  onUploadPhotos: (files: File[]) => Promise<unknown>;
  onSetCover: (photoId: string) => Promise<unknown>;
}

export default function CoursePhotoGallerySection({
  courseId,
  uploadedPhotos,
  uploadsConfigured,
  isLoading,
  isUploading,
  isSettingCover,
  onUploadPhotos,
  onSetCover,
}: CoursePhotoGallerySectionProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleChooseFiles = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelection = async (event: ChangeEvent<HTMLInputElement>) => {
    const nextFiles = Array.from(event.target.files ?? []);
    event.target.value = "";

    if (nextFiles.length === 0) {
      return;
    }

    try {
      await onUploadPhotos(nextFiles);
      toast.success(
        nextFiles.length === 1 ? "Course photo uploaded." : `${nextFiles.length} course photos uploaded.`,
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Course photo upload failed.");
    }
  };

  const handleSetCover = async (photoId: string) => {
    try {
      await onSetCover(photoId);
      toast.success("Course cover photo updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update the course cover photo.");
    }
  };

  return (
    <section className="rounded-[30px] border border-[hsl(var(--golfer-line))] bg-white p-5 shadow-[0_24px_70px_-48px_rgba(12,25,19,0.35)] sm:p-6">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileSelection}
      />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[hsl(var(--golfer-deep-soft))]/[0.58]">
            Course photos
          </p>
          <h2 className="mt-3 text-2xl text-[hsl(var(--golfer-deep))]">Community gallery</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[hsl(var(--golfer-deep-soft))]/[0.76]">
            Upload course photos tied to <code className="text-xs">{courseId}</code>. The first uploaded photo becomes
            the course cover unless you explicitly choose another one.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-[hsl(var(--golfer-mist))] px-3 py-1.5 text-xs font-medium text-[hsl(var(--golfer-deep))]">
            {uploadedPhotos.length} uploaded photo{uploadedPhotos.length === 1 ? "" : "s"}
          </span>
          <button
            onClick={handleChooseFiles}
            disabled={!uploadsConfigured || isUploading}
            className="inline-flex items-center gap-2 rounded-full bg-[hsl(var(--golfer-deep))] px-4 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isUploading ? <LoaderCircle size={15} className="animate-spin" /> : <ImagePlus size={15} />}
            {isUploading ? "Uploading..." : "Upload photo"}
          </button>
        </div>
      </div>

      {!uploadsConfigured ? (
        <div className="mt-5 rounded-[22px] border border-dashed border-[hsl(var(--golfer-line))] bg-[hsl(var(--golfer-cream))] px-4 py-3 text-sm leading-6 text-[hsl(var(--golfer-deep-soft))]/[0.76]">
          Uploads are ready in code, but this app still needs Supabase env vars and the `course_photos` table/bucket
          configured before the button can send real files.
        </div>
      ) : null}

      {isLoading ? (
        <div className="mt-5 flex min-h-40 items-center justify-center rounded-[22px] bg-[hsl(var(--golfer-cream))] text-sm text-[hsl(var(--golfer-deep-soft))]/[0.76]">
          Loading uploaded course photos...
        </div>
      ) : uploadedPhotos.length === 0 ? (
        <div className="mt-5 flex min-h-40 flex-col items-center justify-center rounded-[24px] border border-dashed border-[hsl(var(--golfer-line))] bg-[hsl(var(--golfer-cream))] px-6 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-[hsl(var(--golfer-deep))] shadow-sm">
            <Camera size={20} />
          </div>
          <p className="mt-4 text-base font-medium text-[hsl(var(--golfer-deep))]">No uploaded photos yet</p>
          <p className="mt-2 max-w-md text-sm leading-6 text-[hsl(var(--golfer-deep-soft))]/[0.76]">
            Add the first course photo here. If there is no uploaded cover yet, the first successful upload becomes it.
          </p>
        </div>
      ) : (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {uploadedPhotos.map((photo) => (
            <article
              key={photo.id}
              className={`overflow-hidden rounded-[24px] border bg-white shadow-[0_24px_60px_-48px_rgba(12,25,19,0.35)] ${
                photo.isCover
                  ? "border-[hsl(var(--golfer-deep))]"
                  : "border-[hsl(var(--golfer-line))]"
              }`}
            >
              <img
                src={photo.thumbnailUrl}
                alt="Course upload"
                loading="lazy"
                className="h-44 w-full object-cover"
              />

              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-[hsl(var(--golfer-deep))]">
                      {photo.isCover ? "Current cover photo" : "Uploaded course photo"}
                    </p>
                    <p className="mt-1 text-xs text-[hsl(var(--golfer-deep-soft))]/[0.68]">
                      Uploaded {formatDemoDate(photo.uploadedAt)}
                    </p>
                  </div>
                  {photo.isCover ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[hsl(var(--golfer-mist))] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-[hsl(var(--golfer-deep))]">
                      <Sparkles size={11} /> Cover
                    </span>
                  ) : (
                    <button
                      onClick={() => handleSetCover(photo.id)}
                      disabled={isSettingCover}
                      className="rounded-full border border-[hsl(var(--golfer-line))] bg-[hsl(var(--golfer-cream))] px-3 py-1.5 text-xs font-medium text-[hsl(var(--golfer-deep))] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSettingCover ? "Saving..." : "Set as cover"}
                    </button>
                  )}
                </div>

                {photo.caption ? (
                  <p className="mt-3 text-sm leading-6 text-[hsl(var(--golfer-deep-soft))]/[0.78]">{photo.caption}</p>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
