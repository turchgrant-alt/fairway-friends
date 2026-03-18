import { supabase, type AppProfile, type FriendshipStatus } from "@/lib/supabase";

export interface FriendshipRecord {
  id: string;
  user_id: string;
  friend_id: string;
  status: FriendshipStatus;
  created_at: string | null;
}

export interface FriendListEntry {
  friendship_id: string;
  friend_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

export interface PendingFriendRequest extends FriendListEntry {
  sender_id: string;
  created_at: string | null;
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
    throw new Error("You must be signed in to manage friends.");
  }

  return user.id;
}

async function getProfilesByIds(userIds: string[]) {
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

export async function searchUsers(query: string) {
  const userId = await requireAuthenticatedUserId();
  const normalizedQuery = query.trim();
  if (!normalizedQuery) {
    return [];
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url")
    .ilike("username", `%${normalizedQuery}%`)
    .neq("id", userId)
    .limit(10);

  if (error) {
    throw error;
  }

  return (data ?? []) as AppProfile[];
}

export async function sendFriendRequest(friendId: string) {
  const userId = await requireAuthenticatedUserId();

  if (friendId === userId) {
    throw new Error("You cannot send a friend request to yourself.");
  }

  const { data: existingRows, error: existingError } = await supabase
    .from("friendships")
    .select("*")
    .or(`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`);

  if (existingError) {
    throw existingError;
  }

  const existingFriendship = (existingRows ?? [])[0] as FriendshipRecord | undefined;
  if (existingFriendship) {
    if (existingFriendship.status === "accepted") {
      throw new Error("You are already friends with this user.");
    }

    if (existingFriendship.user_id === friendId && existingFriendship.status === "pending") {
      throw new Error("This user has already sent you a friend request.");
    }

    if (existingFriendship.user_id === userId) {
      return existingFriendship;
    }
  }

  const { data, error } = await supabase
    .from("friendships")
    .insert({
      user_id: userId,
      friend_id: friendId,
      status: "pending",
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data as FriendshipRecord;
}

export async function acceptFriendRequest(friendshipId: string) {
  const userId = await requireAuthenticatedUserId();
  const { data, error } = await supabase
    .from("friendships")
    .update({
      status: "accepted",
    })
    .eq("id", friendshipId)
    .eq("friend_id", userId)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data as FriendshipRecord;
}

export async function rejectFriendRequest(friendshipId: string) {
  const userId = await requireAuthenticatedUserId();
  const { data, error } = await supabase
    .from("friendships")
    .update({
      status: "rejected",
    })
    .eq("id", friendshipId)
    .eq("friend_id", userId)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data as FriendshipRecord;
}

export async function removeFriend(friendshipId: string) {
  const userId = await requireAuthenticatedUserId();
  const { error } = await supabase
    .from("friendships")
    .delete()
    .eq("id", friendshipId)
    .or(`user_id.eq.${userId},friend_id.eq.${userId}`);

  if (error) {
    throw error;
  }
}

export async function getMyFriends() {
  const userId = await requireAuthenticatedUserId();
  const [initiatedResult, receivedResult] = await Promise.all([
    supabase
      .from("friendships")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "accepted"),
    supabase
      .from("friendships")
      .select("*")
      .eq("friend_id", userId)
      .eq("status", "accepted"),
  ]);

  if (initiatedResult.error) {
    throw initiatedResult.error;
  }
  if (receivedResult.error) {
    throw receivedResult.error;
  }

  const initiated = (initiatedResult.data ?? []) as FriendshipRecord[];
  const received = (receivedResult.data ?? []) as FriendshipRecord[];
  const friendIds = [
    ...initiated.map((friendship) => friendship.friend_id),
    ...received.map((friendship) => friendship.user_id),
  ];
  const profileMap = await getProfilesByIds(friendIds);

  return [...initiated, ...received].map((friendship) => {
    const friendId = friendship.user_id === userId ? friendship.friend_id : friendship.user_id;
    const profile = profileMap.get(friendId) ?? null;

    return {
      friendship_id: friendship.id,
      friend_id: friendId,
      username: profile?.username ?? null,
      display_name: profile?.display_name ?? null,
      avatar_url: profile?.avatar_url ?? null,
    };
  });
}

export async function getPendingRequests() {
  const userId = await requireAuthenticatedUserId();
  const { data, error } = await supabase
    .from("friendships")
    .select("*")
    .eq("friend_id", userId)
    .eq("status", "pending");

  if (error) {
    throw error;
  }

  const pendingRows = (data ?? []) as FriendshipRecord[];
  const profileMap = await getProfilesByIds(pendingRows.map((row) => row.user_id));

  return pendingRows.map((friendship) => {
    const profile = profileMap.get(friendship.user_id) ?? null;

    return {
      friendship_id: friendship.id,
      friend_id: friendship.user_id,
      sender_id: friendship.user_id,
      username: profile?.username ?? null,
      display_name: profile?.display_name ?? null,
      avatar_url: profile?.avatar_url ?? null,
      created_at: friendship.created_at,
    };
  });
}
