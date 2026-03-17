import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getUploadedCourseCoverPhoto,
  hasCoursePhotoUploadConfig,
  listCourseUploadedPhotos,
  setCourseUploadedPhotoAsCover,
  uploadCoursePhotos,
} from "@/lib/course-photo-uploads";

export const COURSE_UPLOADED_PHOTOS_QUERY_KEY = ["course-uploaded-photos"] as const;

export function useCourseUploadedPhotoGallery(courseId: string | null | undefined) {
  const queryClient = useQueryClient();
  const normalizedCourseId = courseId?.trim() ?? "";
  const uploadsConfigured = hasCoursePhotoUploadConfig();

  const photoQuery = useQuery({
    queryKey: [...COURSE_UPLOADED_PHOTOS_QUERY_KEY, normalizedCourseId],
    queryFn: () => listCourseUploadedPhotos(normalizedCourseId),
    enabled: uploadsConfigured && normalizedCourseId.length > 0,
    staleTime: 30_000,
  });

  const uploadMutation = useMutation({
    mutationFn: (files: File[]) =>
      uploadCoursePhotos({
        courseId: normalizedCourseId,
        files,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [...COURSE_UPLOADED_PHOTOS_QUERY_KEY, normalizedCourseId],
      });
    },
  });

  const setCoverMutation = useMutation({
    mutationFn: (photoId: string) => setCourseUploadedPhotoAsCover(normalizedCourseId, photoId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [...COURSE_UPLOADED_PHOTOS_QUERY_KEY, normalizedCourseId],
      });
    },
  });

  const uploadedPhotos = photoQuery.data ?? [];

  return {
    uploadsConfigured,
    uploadedPhotos,
    uploadedCoverPhoto: getUploadedCourseCoverPhoto(uploadedPhotos),
    isLoading: photoQuery.isLoading,
    isFetching: photoQuery.isFetching,
    uploadError: uploadMutation.error,
    setCoverError: setCoverMutation.error,
    isUploading: uploadMutation.isPending,
    isSettingCover: setCoverMutation.isPending,
    uploadPhotos: uploadMutation.mutateAsync,
    setCoverPhoto: setCoverMutation.mutateAsync,
  };
}
