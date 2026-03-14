import type { CoursePreview } from "@/lib/course-data";
import { courses, getCourseById } from "@/lib/course-data";

export interface UserProfile {
  id: string;
  name: string;
  username: string;
  avatar: string;
  bio: string;
  homeCity: string;
  handicapRange: string;
  preferredTypes: string[];
  playedCount: number;
  savedCount: number;
  followersCount: number;
  followingCount: number;
  topCourses: string[];
}

export interface Review {
  id: string;
  userId: string;
  courseId: string;
  headline: string;
  body: string;
  pros: string[];
  cons: string[];
  bestForTags: string[];
  worthThePrice: boolean;
  wouldPlayAgain: boolean;
  overallRating: number;
  createdAt: string;
  likesCount: number;
  commentsCount: number;
}

export interface CourseList {
  id: string;
  userId: string;
  title: string;
  description: string;
  courseIds: string[];
  isPublic: boolean;
  createdAt: string;
}

const avatars = [
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&q=80",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&q=80",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&q=80",
];

const collectionImages = [
  "https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=800&q=80",
  "https://images.unsplash.com/photo-1592919505780-303950717480?w=800&q=80",
  "https://images.unsplash.com/photo-1600007370700-545eb0525a87?w=800&q=80",
  "https://images.unsplash.com/photo-1540539234-c14a20fb7c7b?w=800&q=80",
  "https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?w=800&q=80",
];

function requireCourseIdByNames(...candidateNames: string[]) {
  const lowerNames = candidateNames.map((name) => name.toLowerCase());
  const match = courses.find((course) => lowerNames.some((candidate) => course.name.toLowerCase() === candidate));

  if (!match) {
    throw new Error(`Unable to resolve a real course id for any of: ${candidateNames.join(", ")}`);
  }

  return match.id;
}

export const users: UserProfile[] = [
  {
    id: "u1",
    name: "Jake Morrison",
    username: "jakemgolf",
    avatar: avatars[0],
    bio: "Architecture nerd. Weekend buddy-trip planner. Loves public golf with some actual teeth.",
    homeCity: "Rochester, NY",
    handicapRange: "12-18",
    preferredTypes: ["public", "municipal"],
    playedCount: 87,
    savedCount: 45,
    followersCount: 234,
    followingCount: 189,
    topCourses: [
      requireCourseIdByNames("Oak Hill Country Club (East Course)", "Oak Hill Country Club"),
      requireCourseIdByNames("Bethpage Black"),
      requireCourseIdByNames("Leatherstocking Golf Course"),
    ],
  },
  {
    id: "u2",
    name: "Sarah Chen",
    username: "sarahplays18",
    avatar: avatars[1],
    bio: "Golf-travel obsessive with a weakness for classic New York private clubs and difficult walks.",
    homeCity: "New York, NY",
    handicapRange: "8-12",
    preferredTypes: ["private", "public"],
    playedCount: 124,
    savedCount: 67,
    followersCount: 456,
    followingCount: 312,
    topCourses: [
      requireCourseIdByNames("Shinnecock Hills Golf Club"),
      requireCourseIdByNames("National Golf Links of America"),
      requireCourseIdByNames("Friar's Head"),
    ],
  },
  {
    id: "u3",
    name: "Marcus Williams",
    username: "marcusonthegreen",
    avatar: avatars[2],
    bio: "Always looking for the municipal and state-park rounds that still feel like a find.",
    homeCity: "Bronx, NY",
    handicapRange: "18-25",
    preferredTypes: ["municipal", "public"],
    playedCount: 52,
    savedCount: 28,
    followersCount: 167,
    followingCount: 145,
    topCourses: [
      requireCourseIdByNames("Van Cortlandt Golf Course"),
      requireCourseIdByNames("Pelham Bay & Split Rock Golf Course"),
      requireCourseIdByNames("Bethpage Yellow Golf Course"),
    ],
  },
  {
    id: "u4",
    name: "Emily Park",
    username: "emilyparks",
    avatar: avatars[3],
    bio: "Mostly judging courses by routing, tree lines, and whether the walk feels cinematic.",
    homeCity: "Hudson Valley, NY",
    handicapRange: "15-20",
    preferredTypes: ["public", "private"],
    playedCount: 98,
    savedCount: 52,
    followersCount: 892,
    followingCount: 234,
    topCourses: [
      requireCourseIdByNames("Hudson National Golf Course"),
      requireCourseIdByNames("Sleepy Hollow Country Club"),
      requireCourseIdByNames("Sebonack Golf Course"),
    ],
  },
  {
    id: "u5",
    name: "Tom Bradley",
    username: "tombradleygolf",
    avatar: avatars[4],
    bio: "Strong believer that a New York golf trip should mix public access with one ridiculous splurge.",
    homeCity: "Saratoga Springs, NY",
    handicapRange: "0-5",
    preferredTypes: ["private", "resort", "public"],
    playedCount: 215,
    savedCount: 34,
    followersCount: 567,
    followingCount: 198,
    topCourses: [
      requireCourseIdByNames("Saratoga National Golf Course"),
      requireCourseIdByNames("Atunyote at Turning Stone"),
      requireCourseIdByNames("Fishers Island Club"),
    ],
  },
];

export const reviews: Review[] = [
  {
    id: "r1",
    userId: "u1",
    courseId: requireCourseIdByNames("Bethpage Black"),
    headline: "Hard in the right ways",
    body: "The scale is huge, the walk is real, and every good shot feels like it earned something.",
    pros: ["Tough routing", "Public access", "Tournament feel"],
    cons: ["Slow rounds", "Mentally exhausting"],
    bestForTags: ["Championship", "Buddy trip"],
    worthThePrice: true,
    wouldPlayAgain: true,
    overallRating: 9.1,
    createdAt: "2 days ago",
    likesCount: 34,
    commentsCount: 6,
  },
  {
    id: "r2",
    userId: "u2",
    courseId: requireCourseIdByNames("Shinnecock Hills Golf Club"),
    headline: "Severe, elegant, unforgettable",
    body: "It somehow feels both ancient and sharp. Wind changes the whole conversation hole to hole.",
    pros: ["World-class routing", "History", "Pure walk"],
    cons: ["Access is a fantasy", "You feel every miss"],
    bestForTags: ["Bucket list", "Architecture"],
    worthThePrice: true,
    wouldPlayAgain: true,
    overallRating: 9.8,
    createdAt: "4 days ago",
    likesCount: 41,
    commentsCount: 9,
  },
  {
    id: "r3",
    userId: "u3",
    courseId: requireCourseIdByNames("Van Cortlandt Golf Course"),
    headline: "Exactly the kind of city golf that should exist",
    body: "Historic, accessible, and surprisingly fun once you stop trying to overpower it.",
    pros: ["History", "Value", "Transit-friendly"],
    cons: ["Can get crowded"],
    bestForTags: ["Municipal", "Value"],
    worthThePrice: true,
    wouldPlayAgain: true,
    overallRating: 8.0,
    createdAt: "1 week ago",
    likesCount: 19,
    commentsCount: 4,
  },
];

export const sampleLists: CourseList[] = [
  {
    id: "l1",
    userId: "u1",
    title: "Long Island private dreams",
    description: "Courses I would say yes to in under five seconds.",
    courseIds: [
      requireCourseIdByNames("Shinnecock Hills Golf Club"),
      requireCourseIdByNames("National Golf Links of America"),
      requireCourseIdByNames("Sebonack Golf Course"),
      requireCourseIdByNames("Piping Rock Club"),
    ],
    isPublic: true,
    createdAt: "2026-02-01",
  },
  {
    id: "l2",
    userId: "u3",
    title: "Best New York munis",
    description: "Reliable public golf when the plan needs to stay realistic.",
    courseIds: [
      requireCourseIdByNames("Van Cortlandt Golf Course"),
      requireCourseIdByNames("Pelham Bay & Split Rock Golf Course"),
      requireCourseIdByNames("Bethpage Yellow Golf Course"),
      requireCourseIdByNames("Saratoga Spa State Park Golf Course"),
    ],
    isPublic: true,
    createdAt: "2026-02-10",
  },
  {
    id: "l3",
    userId: "u5",
    title: "Upstate weekend route",
    description: "The kind of two-day driveable trip I would actually book.",
    courseIds: [
      requireCourseIdByNames("Oak Hill Country Club (East Course)", "Oak Hill Country Club"),
      requireCourseIdByNames("Leatherstocking Golf Course"),
      requireCourseIdByNames("Saratoga National Golf Course"),
      requireCourseIdByNames("Atunyote at Turning Stone"),
    ],
    isPublic: true,
    createdAt: "2026-02-24",
  },
];

export const collections = [
  {
    id: "c1",
    title: "Best Public New York",
    subtitle: "Public and municipal standouts",
    imageUrl: collectionImages[0],
    courseIds: [
      requireCourseIdByNames("Bethpage Black"),
      requireCourseIdByNames("Van Cortlandt Golf Course"),
      requireCourseIdByNames("Leatherstocking Golf Course"),
      requireCourseIdByNames("Saratoga National Golf Course"),
    ],
  },
  {
    id: "c2",
    title: "Private Club Icons",
    subtitle: "Classic names worth tracking",
    imageUrl: collectionImages[1],
    courseIds: [
      requireCourseIdByNames("Shinnecock Hills Golf Club"),
      requireCourseIdByNames("National Golf Links of America"),
      requireCourseIdByNames("Sleepy Hollow Country Club"),
      requireCourseIdByNames("Fishers Island Club"),
    ],
  },
  {
    id: "c3",
    title: "Long Island Bucket List",
    subtitle: "Heavy hitters on the coast",
    imageUrl: collectionImages[2],
    courseIds: [
      requireCourseIdByNames("Shinnecock Hills Golf Club"),
      requireCourseIdByNames("Sebonack Golf Course"),
      requireCourseIdByNames("Friar's Head"),
      requireCourseIdByNames("Piping Rock Club"),
    ],
  },
  {
    id: "c4",
    title: "Upstate Weekenders",
    subtitle: "Courses worth a road trip",
    imageUrl: collectionImages[3],
    courseIds: [
      requireCourseIdByNames("Oak Hill Country Club (East Course)", "Oak Hill Country Club"),
      requireCourseIdByNames("Saratoga National Golf Course"),
      requireCourseIdByNames("Atunyote at Turning Stone"),
      requireCourseIdByNames("Leatherstocking Golf Course"),
    ],
  },
];

export function getUserById(id: string): UserProfile | undefined {
  return users.find((user) => user.id === id);
}

export function getReviewsForCourse(courseId: string): Review[] {
  return reviews.filter((review) => review.courseId === courseId);
}

export function getReviewsByUser(userId: string): Review[] {
  return reviews.filter((review) => review.userId === userId);
}

export function getListsByUser(userId: string): CourseList[] {
  return sampleLists.filter((list) => list.userId === userId);
}

export function getCourseIdsForCollection(collectionId: string): string[] {
  return collections.find((collection) => collection.id === collectionId)?.courseIds ?? [];
}

export function getCourseByIdSafe(id: string): CoursePreview | undefined {
  return getCourseById(id);
}
