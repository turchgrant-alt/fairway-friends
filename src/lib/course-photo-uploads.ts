const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL?.replace(/\/+$/, "") ?? "";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";
const SUPABASE_COURSE_PHOTO_BUCKET =
  import.meta.env.VITE_SUPABASE_COURSE_PHOTO_BUCKET ?? "course-photos";
const SUPABASE_COURSE_PHOTOS_TABLE =
  import.meta.env.VITE_SUPABASE_COURSE_PHOTOS_TABLE ?? "course_photos";

const LOCAL_COURSE_PHOTO_UPLOADER_ID_KEY = "golfer:v1-course-photo-uploader-id";

interface SupabaseCoursePhotoRow {
  id: string;
  course_id: string;
  image_url: string;
  thumbnail_url: string | null;
  storage_path: string;
  uploaded_at: string;
  uploaded_by: string | null;
  is_cover: boolean;
  caption: string | null;
  status: string | null;
}

export interface UploadedCoursePhotoRecord {
  id: string;
  courseId: string;
  imageUrl: string;
  thumbnailUrl: string;
  storagePath: string;
  uploadedAt: string;
  uploadedBy: string;
  isCover: boolean;
  caption: string | null;
  status: string | null;
}

interface UploadCoursePhotosInput {
  courseId: string;
  files: File[];
  caption?: string | null;
}

function createCoursePhotoError(message: string) {
  return new Error(message);
}

function hasWindow() {
  return typeof window !== "undefined";
}

export function hasCoursePhotoUploadConfig() {
  return SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0;
}

export function getCoursePhotoUploadConfigSummary() {
  return {
    supabaseUrl: SUPABASE_URL,
    bucket: SUPABASE_COURSE_PHOTO_BUCKET,
    table: SUPABASE_COURSE_PHOTOS_TABLE,
    configured: hasCoursePhotoUploadConfig(),
  };
}

export function getLocalCoursePhotoUploaderId() {
  if (!hasWindow()) {
    return "local-user";
  }

  const existingId = window.localStorage.getItem(LOCAL_COURSE_PHOTO_UPLOADER_ID_KEY);
  if (existingId) {
    return existingId;
  }

  const nextId = `local-${crypto.randomUUID()}`;
  window.localStorage.setItem(LOCAL_COURSE_PHOTO_UPLOADER_ID_KEY, nextId);
  return nextId;
}

function normalizeCaption(caption: string | null | undefined) {
  const nextCaption = caption?.trim() ?? "";
  return nextCaption.length > 0 ? nextCaption.slice(0, 140) : null;
}

function createSupabaseHeaders(headers: HeadersInit = {}) {
  return {
    ...headers,
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  };
}

function mapCoursePhotoRow(row: SupabaseCoursePhotoRow): UploadedCoursePhotoRecord {
  return {
    id: row.id,
    courseId: row.course_id,
    imageUrl: row.image_url,
    thumbnailUrl: row.thumbnail_url ?? row.image_url,
    storagePath: row.storage_path,
    uploadedAt: row.uploaded_at,
    uploadedBy: row.uploaded_by ?? "local-user",
    isCover: row.is_cover,
    caption: row.caption,
    status: row.status,
  };
}

function createStorageObjectUrl(storagePath: string) {
  const encodedPath = storagePath
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return `${SUPABASE_URL}/storage/v1/object/public/${encodeURIComponent(SUPABASE_COURSE_PHOTO_BUCKET)}/${encodedPath}`;
}

function sanitizeFileName(fileName: string) {
  const lastDotIndex = fileName.lastIndexOf(".");
  const extension =
    lastDotIndex > 0 ? fileName.slice(lastDotIndex).toLowerCase().replace(/[^a-z0-9.]/g, "") : "";
  const baseName = (lastDotIndex > 0 ? fileName.slice(0, lastDotIndex) : fileName)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);

  return `${baseName || "course-photo"}${extension}`;
}

function createStorageObjectPath(courseId: string, fileName: string) {
  return `${courseId}/${crypto.randomUUID()}-${sanitizeFileName(fileName)}`;
}

async function readJson<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return [] as T;
  }

  return (await response.json()) as T;
}

async function requestSupabaseJson<T>(url: string | URL, init: RequestInit): Promise<T> {
  if (!hasCoursePhotoUploadConfig()) {
    throw createCoursePhotoError("Course photo uploads are not configured.");
  }

  const response = await fetch(url, init);
  if (!response.ok) {
    const errorText = await response.text();
    throw createCoursePhotoError(errorText || `Course photo request failed (${response.status}).`);
  }

  return readJson<T>(response);
}

async function uploadStorageObject(storagePath: string, file: File) {
  const encodedPath = storagePath
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  await requestSupabaseJson(
    `${SUPABASE_URL}/storage/v1/object/${encodeURIComponent(SUPABASE_COURSE_PHOTO_BUCKET)}/${encodedPath}`,
    {
      method: "POST",
      headers: createSupabaseHeaders({
        "Content-Type": file.type || "application/octet-stream",
        "x-upsert": "false",
      }),
      body: file,
    },
  );
}

async function removeStorageObject(storagePath: string) {
  const encodedPath = storagePath
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  await requestSupabaseJson(
    `${SUPABASE_URL}/storage/v1/object/${encodeURIComponent(SUPABASE_COURSE_PHOTO_BUCKET)}/${encodedPath}`,
    {
      method: "DELETE",
      headers: createSupabaseHeaders(),
    },
  );
}

async function insertCoursePhotoRow(row: SupabaseCoursePhotoRow) {
  const insertedRows = await requestSupabaseJson<SupabaseCoursePhotoRow[]>(
    `${SUPABASE_URL}/rest/v1/${SUPABASE_COURSE_PHOTOS_TABLE}`,
    {
      method: "POST",
      headers: createSupabaseHeaders({
        "Content-Type": "application/json",
        Prefer: "return=representation",
      }),
      body: JSON.stringify(row),
    },
  );

  return mapCoursePhotoRow(insertedRows[0]);
}

export async function listCourseUploadedPhotos(courseId: string) {
  if (!hasCoursePhotoUploadConfig()) {
    return [];
  }

  const requestUrl = new URL(`${SUPABASE_URL}/rest/v1/${SUPABASE_COURSE_PHOTOS_TABLE}`);
  requestUrl.searchParams.set(
    "select",
    "id,course_id,image_url,thumbnail_url,storage_path,uploaded_at,uploaded_by,is_cover,caption,status",
  );
  requestUrl.searchParams.set("course_id", `eq.${courseId}`);
  requestUrl.searchParams.set("order", "is_cover.desc,uploaded_at.asc");

  const rows = await requestSupabaseJson<SupabaseCoursePhotoRow[]>(requestUrl, {
    method: "GET",
    headers: createSupabaseHeaders(),
  });

  return rows.map(mapCoursePhotoRow);
}

export function getUploadedCourseCoverPhoto(photos: UploadedCoursePhotoRecord[]) {
  return photos.find((photo) => photo.isCover) ?? photos[0] ?? null;
}

export async function uploadCoursePhotos({ courseId, files, caption }: UploadCoursePhotosInput) {
  if (files.length === 0) {
    return [];
  }

  const existingPhotos = await listCourseUploadedPhotos(courseId);
  let hasExistingCover = existingPhotos.some((photo) => photo.isCover);
  const uploadedBy = getLocalCoursePhotoUploaderId();
  const normalizedCaption = normalizeCaption(caption);
  const createdPhotos: UploadedCoursePhotoRecord[] = [];

  for (const file of files) {
    if (!file.type.startsWith("image/")) {
      throw createCoursePhotoError(`"${file.name}" is not an image file.`);
    }

    const storagePath = createStorageObjectPath(courseId, file.name);
    const uploadedAt = new Date().toISOString();
    const imageUrl = createStorageObjectUrl(storagePath);
    const isCover = !hasExistingCover && createdPhotos.length === 0;
    const nextRow: SupabaseCoursePhotoRow = {
      id: crypto.randomUUID(),
      course_id: courseId,
      image_url: imageUrl,
      thumbnail_url: imageUrl,
      storage_path: storagePath,
      uploaded_at: uploadedAt,
      uploaded_by: uploadedBy,
      is_cover: isCover,
      caption: normalizedCaption,
      status: "published",
    };

    await uploadStorageObject(storagePath, file);

    try {
      const insertedPhoto = await insertCoursePhotoRow(nextRow);
      createdPhotos.push(insertedPhoto);
      if (insertedPhoto.isCover) {
        hasExistingCover = true;
      }
    } catch (error) {
      await removeStorageObject(storagePath).catch(() => undefined);
      throw error;
    }
  }

  return createdPhotos;
}

export async function setCourseUploadedPhotoAsCover(courseId: string, photoId: string) {
  if (!hasCoursePhotoUploadConfig()) {
    throw createCoursePhotoError("Course photo uploads are not configured.");
  }

  const clearCoverUrl = new URL(`${SUPABASE_URL}/rest/v1/${SUPABASE_COURSE_PHOTOS_TABLE}`);
  clearCoverUrl.searchParams.set("course_id", `eq.${courseId}`);
  clearCoverUrl.searchParams.set("is_cover", "eq.true");

  await requestSupabaseJson(clearCoverUrl, {
    method: "PATCH",
    headers: createSupabaseHeaders({
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    }),
    body: JSON.stringify({
      is_cover: false,
    }),
  });

  const setCoverUrl = new URL(`${SUPABASE_URL}/rest/v1/${SUPABASE_COURSE_PHOTOS_TABLE}`);
  setCoverUrl.searchParams.set("id", `eq.${photoId}`);
  setCoverUrl.searchParams.set("course_id", `eq.${courseId}`);

  const updatedRows = await requestSupabaseJson<SupabaseCoursePhotoRow[]>(setCoverUrl, {
    method: "PATCH",
    headers: createSupabaseHeaders({
      "Content-Type": "application/json",
      Prefer: "return=representation",
    }),
    body: JSON.stringify({
      is_cover: true,
    }),
  });

  return updatedRows[0] ? mapCoursePhotoRow(updatedRows[0]) : null;
}
