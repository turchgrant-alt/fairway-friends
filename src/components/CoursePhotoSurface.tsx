import { Flag } from 'lucide-react';

import { getCoursePhoto } from '@/utils/coursePhoto';

interface CoursePhotoSurfaceProps {
  courseId: string;
  courseName: string;
  className: string;
  imageClassName: string;
  placeholderClassName: string;
  lazy?: boolean;
  showAttribution?: boolean;
  disablePhoto?: boolean;
  linkToCover?: boolean;
}

function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}

export default function CoursePhotoSurface({
  courseId,
  courseName,
  className,
  imageClassName,
  placeholderClassName,
  lazy = true,
  showAttribution = false,
  disablePhoto = false,
  linkToCover = false,
}: CoursePhotoSurfaceProps) {
  const photo = disablePhoto ? null : getCoursePhoto(courseId);
  const imageElement = photo ? (
    <img
      src={photo.thumbnailUrl}
      alt={courseName}
      loading={lazy ? 'lazy' : 'eager'}
      className={imageClassName}
    />
  ) : null;

  return (
    <div className={className}>
      {photo ? (
        <>
          {linkToCover ? (
            <a
              href={photo.coverPhotoUrl}
              target="_blank"
              rel="noreferrer"
              className="block"
              aria-label={`Open full-size photo for ${courseName}`}
            >
              {imageElement}
            </a>
          ) : (
            imageElement
          )}
          {showAttribution ? (
            <p className="mt-3 text-xs leading-6 text-[hsl(var(--golfer-deep-soft))]/[0.72]">
              Photo: {photo.photoCredit} · {photo.photoLicense}
            </p>
          ) : null}
        </>
      ) : (
        <div className={cn('flex items-center justify-center', placeholderClassName)}>
          <div className="flex flex-col items-center gap-3 text-center text-[hsl(var(--golfer-deep-soft))]/[0.78]">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/70 text-[hsl(var(--golfer-deep))] shadow-sm">
              <Flag size={22} />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-[hsl(var(--golfer-deep))]">No course photo yet</p>
              <p className="text-xs uppercase tracking-[0.18em]">Wikimedia pass pending</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
