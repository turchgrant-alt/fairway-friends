/*
Run this in Supabase before using getCourseAverageRating():

create or replace function public.get_course_average(p_course_id text)
returns json as $$
  select json_build_object(
    'average', round(avg(overall_rating)::numeric, 1),
    'count', count(*)::int
  )
  from public.rankings
  where course_id = p_course_id;
$$ language sql security definer;
*/

import { supabase, type AppProfile } from "@/lib/supabase";
import { getMyFriends } from "@/lib/friends";

export interface RankingRecord {
  id: string;
  user_id: string;
  course_id: string;
  course_name: string;
  course_city: string | null;
  course_state: string | null;
  overall_rating: number | null;
  condition_rating: number | null;
  layout_rating: number | null;
  value_rating: number | null;
  difficulty_rating: number | null;
  notes: string | null;
  date_played: string | null;
  created_at: string | null;
  updated_at: string | null;
  profile?: AppProfile | null;
}

export interface UpsertRankingInput {
  id?: string;
  course_id: string;
  course_name: string;
  course_city?: string | null;
  course_state?: string | null;
  overall_rating?: number | null;
  condition_rating?: number | null;
  layout_rating?: number | null;
  value_rating?: number | null;
  difficulty_rating?: number | null;
  notes?: string | null;
  date_played?: string | null;
}

export interface CourseAverageRatingSummary {
  average: number | null;
  count: number;
}

async function requireAuthenticatedUserId() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  if (!user) {
    throw new Error("You must be signed in to access rankings.");
  }

  return user.id;
}

async function getProfilesForUserIds(userIds: string[]) {
  const uniqueUserIds = Array.from(new Set(userIds.filter(Boolean)));
  if (uniqueUserIds.length === 0) {
    return new Map<string, AppProfile>();
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url")
    .in("id", uniqueUserIds);

  if (error) {
    throw error;
  }

  return new Map((data ?? []).map((profile) => [profile.id, profile as AppProfile]));
}

function sortRankingsByRating(a: RankingRecord, b: RankingRecord) {
  const aRating = a.overall_rating ?? Number.NEGATIVE_INFINITY;
  const bRating = b.overall_rating ?? Number.NEGATIVE_INFINITY;
  if (bRating !== aRating) {
    return bRating - aRating;
  }

  return (b.updated_at ?? "").localeCompare(a.updated_at ?? "");
}

function normalizeAverageRatingSummary(value: unknown): CourseAverageRatingSummary {
  if (!value || typeof value !== "object") {
    return {
      average: null,
      count: 0,
    };
  }

  const averageValue = "average" in value ? value.average : null;
  const countValue = "count" in value ? value.count : 0;

  return {
    average:
      typeof averageValue === "number"
        ? averageValue
        : typeof averageValue === "string" && averageValue.trim().length > 0
          ? Number(averageValue)
          : null,
    count:
      typeof countValue === "number"
        ? countValue
        : typeof countValue === "string" && countValue.trim().length > 0
          ? Number.parseInt(countValue, 10)
          : 0,
  };
}

function summarizeAverageFromRankings(rankings: RankingRecord[]): CourseAverageRatingSummary {
  const ratingValues = rankings
    .map((ranking) => ranking.overall_rating)
    .filter((rating): rating is number => typeof rating === "number" && Number.isFinite(rating));

  if (ratingValues.length === 0) {
    return {
      average: null,
      count: 0,
    };
  }

  const average = ratingValues.reduce((sum, value) => sum + value, 0) / ratingValues.length;

  return {
    average: Math.round(average * 10) / 10,
    count: ratingValues.length,
  };
}

export async function getMyRankings() {
  const userId = await requireAuthenticatedUserId();
  const { data, error } = await supabase
    .from("rankings")
    .select("*")
    .eq("user_id", userId)
    .order("overall_rating", { ascending: false, nullsFirst: false })
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as RankingRecord[];
}

export async function getCourseAverageRating(courseId: string) {
  const { data, error } = await supabase.rpc("get_course_average", {
    p_course_id: courseId,
  });

  if (error) {
    throw error;
  }

  return normalizeAverageRatingSummary(data);
}

export async function upsertRanking(ranking: UpsertRankingInput) {
  const userId = await requireAuthenticatedUserId();
  const { data, error } = await supabase
    .from("rankings")
    .upsert(
      {
        id: ranking.id,
        user_id: userId,
        course_id: ranking.course_id,
        course_name: ranking.course_name,
        course_city: ranking.course_city ?? null,
        course_state: ranking.course_state ?? null,
        overall_rating: ranking.overall_rating ?? null,
        condition_rating: ranking.condition_rating ?? null,
        layout_rating: ranking.layout_rating ?? null,
        value_rating: ranking.value_rating ?? null,
        difficulty_rating: ranking.difficulty_rating ?? null,
        notes: ranking.notes ?? null,
        date_played: ranking.date_played ?? null,
      },
      {
        onConflict: "user_id,course_id",
      },
    )
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data as RankingRecord;
}

export async function deleteRanking(rankingId: string) {
  const userId = await requireAuthenticatedUserId();
  const { error } = await supabase
    .from("rankings")
    .delete()
    .eq("id", rankingId)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }
}

export async function getRankingForCourse(courseId: string) {
  const userId = await requireAuthenticatedUserId();
  const { data, error } = await supabase
    .from("rankings")
    .select("*")
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as RankingRecord | null) ?? null;
}

export async function getFriendRankings(friendId: string) {
  const { data, error } = await supabase
    .from("rankings")
    .select("*")
    .eq("user_id", friendId)
    .order("overall_rating", { ascending: false, nullsFirst: false })
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  const profileMap = await getProfilesForUserIds([friendId]);
  const profile = profileMap.get(friendId) ?? null;

  return ((data ?? []) as RankingRecord[]).map((ranking) => ({
    ...ranking,
    profile,
  }));
}

async function getAcceptedFriendIds() {
  const userId = await requireAuthenticatedUserId();
  const [initiatedResult, receivedResult] = await Promise.all([
    supabase
      .from("friendships")
      .select("friend_id")
      .eq("user_id", userId)
      .eq("status", "accepted"),
    supabase
      .from("friendships")
      .select("user_id")
      .eq("friend_id", userId)
      .eq("status", "accepted"),
  ]);

  if (initiatedResult.error) {
    throw initiatedResult.error;
  }
  if (receivedResult.error) {
    throw receivedResult.error;
  }

  return Array.from(
    new Set([
      ...(initiatedResult.data ?? []).map((row) => row.friend_id as string),
      ...(receivedResult.data ?? []).map((row) => row.user_id as string),
    ]),
  );
}

export async function getCourseRankingsFromFriends(courseId: string) {
  const friendIds = await getAcceptedFriendIds();
  if (friendIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("rankings")
    .select("*")
    .eq("course_id", courseId)
    .in("user_id", friendIds);

  if (error) {
    throw error;
  }

  const rankings = (data ?? []) as RankingRecord[];
  const profileMap = await getProfilesForUserIds(rankings.map((ranking) => ranking.user_id));

  return rankings
    .map((ranking) => ({
      ...ranking,
      profile: profileMap.get(ranking.user_id) ?? null,
    }))
    .sort(sortRankingsByRating);
}

export async function getCourseFriendsAverageRating(courseId: string) {
  const friends = await getMyFriends();
  const friendIds = friends.map((friend) => friend.friend_id);

  if (friendIds.length === 0) {
    return {
      average: null,
      count: 0,
    };
  }

  const { data, error } = await supabase
    .from("rankings")
    .select("*")
    .eq("course_id", courseId)
    .in("user_id", friendIds);

  if (error) {
    throw error;
  }

  return summarizeAverageFromRankings((data ?? []) as RankingRecord[]);
}
