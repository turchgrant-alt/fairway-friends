import catalogData from "@/data/generated/courseCatalog.generated.json";
import manifestData from "@/data/generated/courseCatalog.manifest.generated.json";
import type { AppGolfCourseRecord, CourseCatalogManifest } from "@/lib/course-data-model";

export const generatedCourses = catalogData as AppGolfCourseRecord[];
export const generatedCourseManifest = manifestData as CourseCatalogManifest;
