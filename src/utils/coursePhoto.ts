import coursePhotosManual from '@/data/coursePhotosManual.json';
import coursePhotos from '@/data/coursePhotos.json';

export type CoursePhoto = {
  courseId: string;
  coverPhotoUrl: string;
  thumbnailUrl: string;
  photoSource: string;
  photoLicense: string;
  photoCredit: string;
  photoConfidence: 'high' | 'medium';
  wikidataEntityId?: string;
  lastEnriched?: string;
  addedBy?: string;
  addedDate?: string;
};

export type CoursePhotoResolutionState = 'manual' | 'auto' | 'placeholder';

const manualPhotoLookup = new Map(
  (coursePhotosManual as CoursePhoto[]).map((photo) => [photo.courseId, photo]),
);

const autoPhotoLookup = new Map(
  (coursePhotos as CoursePhoto[]).map((photo) => [photo.courseId, photo]),
);

export function getCoursePhoto(courseId: string): CoursePhoto | null {
  return manualPhotoLookup.get(courseId) ?? autoPhotoLookup.get(courseId) ?? null;
}

export function getCoursePhotoResolution(courseId: string): {
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

  const autoPhoto = autoPhotoLookup.get(courseId);
  if (autoPhoto) {
    return {
      state: 'auto',
      photo: autoPhoto,
    };
  }

  return {
    state: 'placeholder',
    photo: null,
  };
}
