import coursePhotos from '@/data/coursePhotos.json';

export type CoursePhoto = {
  courseId: string;
  coverPhotoUrl: string;
  thumbnailUrl: string;
  photoSource: 'wikimedia-commons';
  photoLicense: string;
  photoCredit: string;
  photoConfidence: 'high' | 'medium';
  wikidataEntityId: string;
  lastEnriched: string;
};

const photoLookup = new Map(
  (coursePhotos as CoursePhoto[]).map((photo) => [photo.courseId, photo]),
);

export function getCoursePhoto(courseId: string): CoursePhoto | null {
  return photoLookup.get(courseId) ?? null;
}
