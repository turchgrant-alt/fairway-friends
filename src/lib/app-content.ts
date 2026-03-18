import { courseSummary } from "@/lib/course-data";

const CURATED_LIST_DESCRIPTION_OVERRIDES: Record<string, string> = {
  "starter-public": "Public-access courses worth knowing when you want an easy starting point.",
  "starter-private": "Private clubs that help round out the dream-trip and best-in-class conversation.",
  "starter-featured": "Recognizable bucket-list names and standout courses golfers love to compare.",
};

export const featuredCourses = courseSummary.featuredCourses;
export const curatedPreviewLists = courseSummary.starterLists.map((list) => ({
  ...list,
  description: CURATED_LIST_DESCRIPTION_OVERRIDES[list.id] ?? list.description,
}));

export const primaryNavigationCards = [
  {
    title: "Discover",
    description: "Browse and search golf courses.",
    path: "/discover",
  },
  {
    title: "Map",
    description: "Find courses by city, state, region, or the map in front of you.",
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
