export type CourseSource = "osm_overpass";

export type CourseAccessType =
  | "public"
  | "private"
  | "semi-private"
  | "municipal"
  | "resort"
  | null;

export type CourseStatus =
  | "operating"
  | "disused"
  | "abandoned"
  | "closed"
  | "construction"
  | "proposed"
  | null;

export interface CourseRatings {
  [key: string]: number;
}

export interface NormalizedGolfCourseRecord {
  id: string;
  source: CourseSource;
  sourceId: string;
  stateCode: string;
  name: string;
  streetAddress: string | null;
  city: string | null;
  state: string | null;
  postcode: string | null;
  country: string | null;
  addressLabel: string | null;
  latitude: number | null;
  longitude: number | null;
  accessType: CourseAccessType;
  status: CourseStatus;
  par: number | null;
  holes: number | null;
  website: string | null;
  phone: string | null;
  operator: string | null;
  openingHours: string | null;
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
