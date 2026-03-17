export const COURSE_TAGS = [
  "cheap",
  "expensive",
  "links",
  "hilly",
  "scenic",
  "tough",
  "easy",
  "walkable",
  "cart-friendly",
  "public feel",
  "private feel",
  "fast round",
  "slow round",
] as const;

export type CourseExperienceTag = (typeof COURSE_TAGS)[number];
