import { courseSummary } from "@/lib/course-data";

export const featuredCourses = courseSummary.featuredCourses;
export const curatedPreviewLists = courseSummary.starterLists;

export const primaryNavigationCards = [
  {
    title: "Discover",
    description: "Browse and search golf courses.",
    path: "/discover",
  },
  {
    title: "Map",
    description: "Find courses by city, state, or the map in front of you.",
    path: "/map",
  },
  {
    title: "Lists",
    description: "Explore curated course lists updated each week.",
    path: "/lists",
  },
  {
    title: "Settings",
    description: "Manage your account and app preferences.",
    path: "/settings",
  },
];

export const catalogStats = {
  ...courseSummary.stats,
};

export function formatDisplayDate(value: string | null) {
  if (!value) return "Not scheduled";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}
