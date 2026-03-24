import coursePhotosManual from '@/data/coursePhotosManual.json';
import coursePhotos from '@/data/coursePhotos.json';
import type { UploadedCoursePhotoRecord } from '@/lib/course-photo-uploads';

export type CoursePhoto = {
  courseId: string;
  coverPhotoUrl: string;
  thumbnailUrl: string;
  photoSource: string;
  photoLicense?: string;
  photoCredit?: string;
  photoConfidence?: 'high' | 'medium';
  wikidataEntityId?: string;
  lastEnriched?: string;
  addedBy?: string;
  addedDate?: string;
};

export type CoursePhotoResolutionState = 'manual' | 'uploaded' | 'auto' | 'placeholder';

export const PLACEHOLDER_IMAGES = [
  'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&q=80',
  'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=800&q=80',
  'https://images.unsplash.com/photo-1593111774240-004412c0d235?w=800&q=80',
  'https://images.unsplash.com/photo-1592919505780-303950717480?w=800&q=80',
  'https://images.unsplash.com/photo-1600007370700-545eb0525a87?w=800&q=80',
  'https://images.unsplash.com/photo-1611374243147-44a702c2d44c?w=800&q=80',
  'https://images.unsplash.com/photo-1632932693498-58789a4746d4?w=800&q=80',
  'https://images.unsplash.com/photo-1622397815765-53a970a096c2?w=800&q=80',
  'https://images.unsplash.com/photo-1596727362302-b8d891c42ab8?w=800&q=80',
  'https://images.unsplash.com/photo-1540539234-c14a20fb7c7b?w=800&q=80',
  'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?w=800&q=80',
  'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&q=80',
] as const;

const manualPhotoLookup = new Map(
  (coursePhotosManual as CoursePhoto[]).map((photo) => [photo.courseId, photo]),
);

const autoPhotoLookup = new Map(
  (coursePhotos as CoursePhoto[]).map((photo) => [photo.courseId, photo]),
);

export function hashCourseId(courseId: string) {
  let hash = 0;

  for (let index = 0; index < courseId.length; index += 1) {
    hash = ((hash << 5) - hash + courseId.charCodeAt(index)) | 0;
  }

  return Math.abs(hash);
}

export function getPlaceholderImage(courseId: string) {
  return PLACEHOLDER_IMAGES[hashCourseId(courseId) % PLACEHOLDER_IMAGES.length];
}

function createPlaceholderCoursePhoto(courseId: string): CoursePhoto {
  const placeholderImage = getPlaceholderImage(courseId);

  return {
    courseId,
    coverPhotoUrl: placeholderImage,
    thumbnailUrl: placeholderImage,
    photoSource: 'placeholder',
  };
}

export function getCoursePhoto(courseId: string): CoursePhoto | null {
  return manualPhotoLookup.get(courseId) ?? autoPhotoLookup.get(courseId) ?? null;
}

function createUploadedCoursePhoto(uploadedCover: UploadedCoursePhotoRecord): CoursePhoto {
  return {
    courseId: uploadedCover.courseId,
    coverPhotoUrl: uploadedCover.imageUrl,
    thumbnailUrl: uploadedCover.thumbnailUrl,
    photoSource: 'course-upload',
    photoCredit: 'GolfeR upload',
  };
}

export function resolveCoursePhoto(courseId: string, uploadedCover?: UploadedCoursePhotoRecord | null): {
  state: CoursePhotoResolutionState;
  photo: CoursePhoto | null;
} {
  const manualPhoto = manualPhotoLookup.get(courseId);
  if (manualPhoto) {
    return {
      state: 'manual',
      photo: manualPhoto,
    };
  }

  if (uploadedCover) {
    return {
      state: 'uploaded',
      photo: createUploadedCoursePhoto(uploadedCover),
    };
  }

  const autoPhoto = autoPhotoLookup.get(courseId);
  if (autoPhoto) {
    return {
      state: 'auto',
      photo: autoPhoto,
    };
  }

  return {
    state: 'placeholder',
    photo: createPlaceholderCoursePhoto(courseId),
  };
}

export function getCoursePhotoResolution(courseId: string): {
  state: CoursePhotoResolutionState;
  photo: CoursePhoto | null;
} {
  return resolveCoursePhoto(courseId, null);
}
