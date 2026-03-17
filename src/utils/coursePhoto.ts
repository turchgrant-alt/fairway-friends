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

const manualPhotoLookup = new Map(
  (coursePhotosManual as CoursePhoto[]).map((photo) => [photo.courseId, photo]),
);

const autoPhotoLookup = new Map(
  (coursePhotos as CoursePhoto[]).map((photo) => [photo.courseId, photo]),
);

export function getCoursePhoto(courseId: string): CoursePhoto | null {
  return manualPhotoLookup.get(courseId) ?? autoPhotoLookup.get(courseId) ?? null;
}
