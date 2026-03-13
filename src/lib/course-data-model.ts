export type CourseSource = "csv_catalog" | "osm_overpass";

export type CourseCoordinateSource = "csv_catalog" | "osm_overpass" | null;

export type CourseAccessType =
  | "public"
  | "private"
  | "semi-private"
  | "municipal"
  | "resort"
  | "unknown"
  | null;

export type CourseStatus =
  | "open"
  | "seasonal"
  | "operating"
  | "disused"
  | "abandoned"
  | "closed"
  | "construction"
  | "proposed"
  | "unknown"
  | null;

export interface CourseRatings {
  [key: string]: number;
}

export interface NormalizedGolfCourseRecord {
  id: string;
  source: CourseSource;
  sourceId: string;
  stateCode: string;
  facilityName: string | null;
  courseName: string | null;
  name: string;
  fullAddress: string | null;
  streetAddress: string | null;
  city: string | null;
  state: string | null;
  postcode: string | null;
  county: string | null;
  country: string | null;
  addressLabel: string | null;
  latitude: number | null;
  longitude: number | null;
  hasVerifiedCoordinates: boolean;
  coordinateSource: CourseCoordinateSource;
  accessType: CourseAccessType;
  accessTypeRaw: string | null;
  status: CourseStatus;
  statusRaw: string | null;
  par: number | null;
  holes: number | null;
  website: string | null;
  phone: string | null;
  operator: string | null;
  openingHours: string | null;
  sourceName: string | null;
  sourceUrl: string | null;
  secondarySourceName: string | null;
  secondarySourceUrl: string | null;
  confidenceLevel: string | null;
  lastVerifiedDate: string | null;
  teeName: string | null;
  gender: string | null;
  courseRating: number | null;
  slopeRating: number | null;
  tags: string[];
  description: string | null;
  lastSyncedAt: string;
  rawSourceData: unknown;
}

export interface AppGolfCourseRecord extends Omit<NormalizedGolfCourseRecord, "rawSourceData"> {
  rawSourceData?: unknown;
  location: string;
  type: string;
  imageUrl: string;
  overallRating: number | null;
  reviewCount: number;
  playedCount: number;
  savedCount: number;
  priceRange: string | null;
  designer: string | null;
  yearBuilt: number | null;
  yardage: number | null;
  ratings: CourseRatings;
}

export interface CourseStateManifestEntry {
  completed: boolean;
  completedAt: string;
  lastSyncedAt: string;
  nextRefreshDueAt: string;
  recordCount: number;
  source: CourseSource;
}

export interface CourseStateManifest {
  refreshCadence: "monthly";
  refreshWindowDays: number;
  completedStates: string[];
  states: Record<string, CourseStateManifestEntry>;
}

export interface CourseCatalogManifest {
  source: CourseSource;
  sourceFile: string;
  importedAt: string;
  recordCount: number;
  stateCodes: string[];
  mappableRecordCount: number;
  coordinateCoverageRatio: number;
  enrichmentNotes: string[];
}
