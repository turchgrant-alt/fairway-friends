import { useDeferredValue, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Check, Search, UserPlus, Users, X } from "lucide-react";
import { Link } from "react-router-dom";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import {
  acceptFriendRequest,
  getMyFriends,
  getPendingRequests,
  rejectFriendRequest,
  removeFriend,
  searchUsers,
  sendFriendRequest,
} from "@/lib/friends";
import type { AppProfile } from "@/lib/supabase";

const FRIENDS_QUERY_KEY = ["friends", "accepted"] as const;
const PENDING_FRIEND_REQUESTS_QUERY_KEY = ["friends", "pending"] as const;

function getProfileLabel(profile: {
  username: string | null;
  display_name: string | null;
}) {
  return profile.display_name ?? profile.username ?? "Fairway Friends user";
}

function getProfileInitials(profile: {
  username: string | null;
  display_name: string | null;
}) {
  return getProfileLabel(profile)
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function ProfileAvatar({
  profile,
}: {
  profile: { username: string | null; display_name: string | null; avatar_url: string | null };
}) {
  return (
    <Avatar className="h-12 w-12 border border-[hsl(var(--golfer-line))]">
      <AvatarImage src={profile.avatar_url ?? undefined} alt={getProfileLabel(profile)} />
      <AvatarFallback className="bg-[hsl(var(--golfer-mist))] text-[hsl(var(--golfer-deep))]">
        {getProfileInitials(profile)}
      </AvatarFallback>
    </Avatar>
  );
}

function SearchResultRow({
  profile,
  isFriend,
  onSendRequest,
  isSending,
}: {
  profile: AppProfile;
  isFriend: boolean;
  onSendRequest: (friendId: string) => void;
  isSending: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[20px] bg-[hsl(var(--golfer-cream))] p-4">
      <div className="flex min-w-0 items-center gap-3">
        <ProfileAvatar profile={profile} />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[hsl(var(--golfer-deep))]">
            {getProfileLabel(profile)}
          </p>
          {profile.username ? (
            <p className="truncate text-xs text-[hsl(var(--golfer-deep-soft))]/[0.72]">
              @{profile.username}
            </p>
          ) : null}
        </div>
      </div>
      <button
        onClick={() => onSendRequest(profile.id)}
        disabled={isFriend || isSending}
        className={`inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-xs font-medium transition ${
          isFriend
            ? "bg-white text-[hsl(var(--golfer-deep-soft))]/[0.68]"
            : "bg-[hsl(var(--golfer-deep))] text-white"
        }`}
      >
        {isFriend ? <Check size={13} /> : <UserPlus size={13} />}
        {isFriend ? "Friend" : isSending ? "Sending..." : "Add"}
      </button>
    </div>
  );
}

export default function FriendsSection() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const normalizedSearchTerm = deferredSearchTerm.trim();
  const canSearch = normalizedSearchTerm.length >= 2;

  const { data: friends = [], isLoading: isFriendsLoading } = useQuery({
    queryKey: FRIENDS_QUERY_KEY,
    queryFn: getMyFriends,
    staleTime: 30_000,
  });
  const { data: pendingRequests = [], isLoading: isPendingRequestsLoading } = useQuery({
    queryKey: PENDING_FRIEND_REQUESTS_QUERY_KEY,
    queryFn: getPendingRequests,
    staleTime: 30_000,
  });
  const { data: searchResults = [], isFetching: isSearching } = useQuery({
    queryKey: ["friends", "search", normalizedSearchTerm],
    queryFn: () => searchUsers(normalizedSearchTerm),
    enabled: canSearch,
    staleTime: 30_000,
  });

  const friendIds = useMemo(() => new Set(friends.map((friend) => friend.friend_id)), [friends]);

  function invalidateFriendQueries() {
    return Promise.all([
      queryClient.invalidateQueries({ queryKey: FRIENDS_QUERY_KEY }),
      queryClient.invalidateQueries({ queryKey: PENDING_FRIEND_REQUESTS_QUERY_KEY }),
    ]);
  }

  const sendRequestMutation = useMutation({
    mutationFn: sendFriendRequest,
    onSuccess: async () => {
      await invalidateFriendQueries();
      toast({
        title: "Friend request sent",
        description: "They can accept it from their own profile.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Could not send request",
        description: error instanceof Error ? error.message : "Try again.",
      });
    },
  });

  const acceptRequestMutation = useMutation({
    mutationFn: acceptFriendRequest,
    onSuccess: async () => {
      await invalidateFriendQueries();
      toast({
        title: "Friend request accepted",
        description: "Their rankings are now available in your network.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Could not accept request",
        description: error instanceof Error ? error.message : "Try again.",
      });
    },
  });

  const rejectRequestMutation = useMutation({
    mutationFn: rejectFriendRequest,
    onSuccess: async () => {
      await invalidateFriendQueries();
      toast({
        title: "Friend request removed",
        description: "The pending request has been cleared.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Could not reject request",
        description: error instanceof Error ? error.message : "Try again.",
      });
    },
  });

  const removeFriendMutation = useMutation({
    mutationFn: removeFriend,
    onSuccess: async () => {
      await invalidateFriendQueries();
      toast({
        title: "Friend removed",
        description: "That connection has been deleted.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Could not remove friend",
        description: error instanceof Error ? error.message : "Try again.",
      });
    },
  });

  return (
    <section className="rounded-[32px] border border-[hsl(var(--golfer-line))] bg-white p-7 shadow-[0_24px_70px_-48px_rgba(12,25,19,0.35)] sm:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[hsl(var(--golfer-deep-soft))]/[0.58]">
            Friends
          </p>
          <h2 className="mt-4 text-3xl text-[hsl(var(--golfer-deep))]">Compare with other players</h2>
          <p className="mt-3 max-w-3xl text-sm leading-8 text-[hsl(var(--golfer-deep-soft))]/[0.74]">
            Search profiles, manage incoming requests, and open a friend&apos;s saved rankings without leaving the
            current product shell.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-[hsl(var(--golfer-mist))] px-4 py-2 text-sm font-medium text-[hsl(var(--golfer-deep))]">
            {friends.length} friend{friends.length === 1 ? "" : "s"}
          </span>
          <span className="rounded-full bg-[hsl(var(--golfer-cream))] px-4 py-2 text-sm font-medium text-[hsl(var(--golfer-deep))]">
            {pendingRequests.length} pending
          </span>
        </div>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="rounded-[28px] bg-[hsl(var(--golfer-cream))] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[hsl(var(--golfer-deep-soft))]/[0.56]">
            Find players
          </p>
          <div className="relative mt-4">
            <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[hsl(var(--golfer-deep-soft))]/[0.5]" />
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search usernames..."
              className="rounded-full border-[hsl(var(--golfer-line))] bg-white pl-11"
            />
          </div>

          <div className="mt-4 space-y-3">
            {!canSearch ? (
              <div className="rounded-[20px] bg-white p-4 text-sm text-[hsl(var(--golfer-deep-soft))]/[0.72]">
                Enter at least 2 characters to search the profiles table.
              </div>
            ) : isSearching ? (
              <div className="rounded-[20px] bg-white p-4 text-sm text-[hsl(var(--golfer-deep-soft))]/[0.72]">
                Searching profiles...
              </div>
            ) : searchResults.length > 0 ? (
              searchResults.map((profile) => (
                <SearchResultRow
                  key={profile.id}
                  profile={profile}
                  isFriend={friendIds.has(profile.id)}
                  isSending={sendRequestMutation.isPending && sendRequestMutation.variables === profile.id}
                  onSendRequest={(friendId) => sendRequestMutation.mutate(friendId)}
                />
              ))
            ) : (
              <div className="rounded-[20px] bg-white p-4 text-sm text-[hsl(var(--golfer-deep-soft))]/[0.72]">
                No users matched this search.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[28px] bg-[hsl(var(--golfer-cream))] p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[hsl(var(--golfer-deep-soft))]/[0.56]">
                Pending requests
              </p>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-[hsl(var(--golfer-deep))]">
                {pendingRequests.length}
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {isPendingRequestsLoading ? (
                <div className="rounded-[20px] bg-white p-4 text-sm text-[hsl(var(--golfer-deep-soft))]/[0.72]">
                  Loading pending requests...
                </div>
              ) : pendingRequests.length > 0 ? (
                pendingRequests.map((request) => (
                  <div key={request.friendship_id} className="rounded-[20px] bg-white p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <ProfileAvatar profile={request} />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[hsl(var(--golfer-deep))]">
                            {getProfileLabel(request)}
                          </p>
                          {request.username ? (
                            <p className="truncate text-xs text-[hsl(var(--golfer-deep-soft))]/[0.72]">
                              @{request.username}
                            </p>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <button
                          onClick={() => acceptRequestMutation.mutate(request.friendship_id)}
                          className="inline-flex items-center gap-2 rounded-full bg-[hsl(var(--golfer-deep))] px-3 py-2 text-xs font-medium text-white"
                        >
                          <Check size={13} />
                          Accept
                        </button>
                        <button
                          onClick={() => rejectRequestMutation.mutate(request.friendship_id)}
                          className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--golfer-line))] bg-white px-3 py-2 text-xs font-medium text-[hsl(var(--golfer-deep))]"
                        >
                          <X size={13} />
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-[20px] bg-white p-4 text-sm text-[hsl(var(--golfer-deep-soft))]/[0.72]">
                  No incoming requests right now.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[28px] bg-[hsl(var(--golfer-cream))] p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[hsl(var(--golfer-deep-soft))]/[0.56]">
                My network
              </p>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-[hsl(var(--golfer-deep))]">
                {friends.length}
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {isFriendsLoading ? (
                <div className="rounded-[20px] bg-white p-4 text-sm text-[hsl(var(--golfer-deep-soft))]/[0.72]">
                  Loading friends...
                </div>
              ) : friends.length > 0 ? (
                friends.map((friend) => (
                  <div key={friend.friendship_id} className="rounded-[20px] bg-white p-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex min-w-0 items-center gap-3">
                        <ProfileAvatar profile={friend} />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[hsl(var(--golfer-deep))]">
                            {getProfileLabel(friend)}
                          </p>
                          {friend.username ? (
                            <p className="truncate text-xs text-[hsl(var(--golfer-deep-soft))]/[0.72]">
                              @{friend.username}
                            </p>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Link
                          to={`/user/${friend.friend_id}`}
                          className="inline-flex items-center gap-2 rounded-full bg-[hsl(var(--golfer-deep))] px-3 py-2 text-xs font-medium text-white"
                        >
                          View rankings
                          <ArrowRight size={13} />
                        </Link>
                        <button
                          onClick={() => removeFriendMutation.mutate(friend.friendship_id)}
                          className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--golfer-line))] bg-white px-3 py-2 text-xs font-medium text-[hsl(var(--golfer-deep))]"
                        >
                          <Users size={13} />
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-[20px] bg-white p-4 text-sm text-[hsl(var(--golfer-deep-soft))]/[0.72]">
                  No accepted friends yet. Search for a username above to start building a shared ranking network.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
