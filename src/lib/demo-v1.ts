import { courseSummary } from "@/lib/course-data";

export const featuredV1Courses = courseSummary.featuredCourses;
export const starterLists = courseSummary.starterLists;

export const demoWorkspaceCards = [
  {
    title: "Discover",
    description: "Search, filter, and sanity-check the stored course catalog.",
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

export const demoStats = {
  ...courseSummary.stats,
};

export function formatDemoDate(value: string | null) {
  if (!value) return "Not scheduled";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}
