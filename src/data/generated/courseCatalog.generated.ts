import manifestData from "@/data/generated/courseCatalog.manifest.generated.json";
import summaryData from "@/data/generated/courseCatalog.summary.generated.json";
import type { CourseCatalogManifest, CourseCatalogSummary } from "@/lib/course-data-model";

export const generatedCourseManifest = manifestData as CourseCatalogManifest;
export const generatedCourseSummary = summaryData as CourseCatalogSummary;
