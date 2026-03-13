import { completedCourseStates, courseManifest, courses } from "@/lib/course-data";

function findCourseByName(name: string) {
  const normalized = name.toLowerCase();
  return courses.find((course) => course.name.toLowerCase() === normalized);
}

function fallbackCourses(limit: number, excludedIds: string[] = []) {
  return courses.filter((course) => !excludedIds.includes(course.id)).slice(0, limit);
}

const featuredNames = [
  "Bethpage Black",
  "Shinnecock Hills Golf Club",
  "Oak Hill Country Club (East Course)",
];

const resolvedFeatured = featuredNames
  .map(findCourseByName)
  .filter(Boolean);

export const featuredV1Courses = resolvedFeatured.length > 0 ? resolvedFeatured : fallbackCourses(3);

const publicAccessCourses = courses.filter((course) =>
  ["public", "municipal", "semi-private"].includes(course.accessType ?? ""),
);
const privateCourses = courses.filter((course) => course.accessType === "private");

export const starterLists = [
  {
    id: "starter-public",
    title: "Public access starter set",
    description: "A simple starting slice of public and municipal New York golf for discovery/testing.",
    courses: publicAccessCourses.slice(0, 6),
  },
  {
    id: "starter-private",
    title: "Private club references",
    description: "Useful structure for private-course pages and metadata review without fake member/social context.",
    courses: privateCourses.slice(0, 6),
  },
  {
    id: "starter-featured",
    title: "Core New York anchors",
    description: "A few recognizable courses to keep the v1 demo grounded while the data pipeline expands.",
    courses: featuredV1Courses,
  },
];

export const demoWorkspaceCards = [
  {
    title: "Discover",
    description: "Search, filter, and sanity-check the New York catalog.",
    path: "/discover",
  },
  {
    title: "Map",
    description: "Test location discovery and course selection flow.",
    path: "/map",
  },
  {
    title: "Lists",
    description: "Review lightweight starter list structure for v1.",
    path: "/lists",
  },
  {
    title: "Workspace",
    description: "See dataset status, cadence, and builder-facing notes.",
    path: "/profile",
  },
];

const nyStatus = courseManifest.states.NY;

export const demoStats = {
  totalCourses: courses.length,
  completedStates: completedCourseStates.length,
  completedStateCodes: completedCourseStates,
  nextRefreshDueAt: nyStatus?.nextRefreshDueAt ?? null,
  lastSyncedAt: nyStatus?.lastSyncedAt ?? null,
  withWebsiteCount: courses.filter((course) => Boolean(course.website)).length,
  withPhoneCount: courses.filter((course) => Boolean(course.phone)).length,
};

export function formatDemoDate(value: string | null) {
  if (!value) return "Not scheduled";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}
