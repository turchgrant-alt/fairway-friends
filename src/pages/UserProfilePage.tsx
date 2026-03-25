import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowUpRight, Star, Users } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";

import PageHeader from "@/components/dashboard/PageHeader";
import { getMyFriends } from "@/lib/friends";
import { getFriendRankings } from "@/lib/rankings";
import { formatDisplayDate } from "@/lib/app-content";

function formatFriendName(friend?: {
  display_name: string | null;
  username: string | null;
}) {
  if (!friend) return "Friend";
  return friend.display_name ?? friend.username ?? "Friend";
}

export default function UserProfilePage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const { data: friends = [], isLoading: isFriendsLoading } = useQuery({
    queryKey: ["friends", "accepted"],
    queryFn: getMyFriends,
    staleTime: 30_000,
  });
  const activeFriend = useMemo(
    () => friends.find((friend) => friend.friend_id === id) ?? null,
    [friends, id],
  );
  const {
    data: friendRankings = [],
    isLoading: isFriendRankingsLoading,
    isError: hasFriendRankingsError,
  } = useQuery({
    queryKey: ["friends", "rankings", id],
    queryFn: () => getFriendRankings(id ?? ""),
    enabled: Boolean(id),
    staleTime: 30_000,
  });
  const title = formatFriendName(activeFriend ?? friendRankings[0]?.profile);

  if (!id) {
    return (
      <div className="flex min-h-[16rem] items-center justify-center rounded-2xl border border-[hsl(var(--golfer-line))] bg-white text-sm text-[hsl(var(--golfer-deep-soft))]/[0.72]">
        No friend selected.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Friend rankings"
        title={title}
        description="See how a friend has ranked the courses they have played."
        actions={
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--golfer-line))] bg-white px-3 py-2 text-sm font-medium text-[hsl(var(--golfer-deep))]"
          >
            <ArrowLeft size={14} /> Back
          </button>
        }
      />

      <section className="grid gap-3 lg:grid-cols-3">
        <article className="rounded-xl border border-[hsl(var(--golfer-line))] bg-white p-3 shadow-[0_24px_60px_-48px_rgba(12,25,19,0.35)]">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[hsl(var(--golfer-deep-soft))]/[0.56]">
            Connected player
          </p>
          <p className="mt-2 text-lg text-[hsl(var(--golfer-deep))]">{title}</p>
          <p className="mt-1 text-xs text-[hsl(var(--golfer-deep-soft))]/[0.74]">
            {activeFriend?.username ? `@${activeFriend.username}` : "Profile username unavailable"}
          </p>
        </article>

        <article className="rounded-xl border border-[hsl(var(--golfer-line))] bg-white p-3 shadow-[0_24px_60px_-48px_rgba(12,25,19,0.35)]">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[hsl(var(--golfer-deep-soft))]/[0.56]">
            Rankings saved
          </p>
          <p className="mt-2 text-xl text-[hsl(var(--golfer-deep))]">{friendRankings.length}</p>
          <p className="mt-1 text-xs text-[hsl(var(--golfer-deep-soft))]/[0.74]">
            Ordered by current overall rating from Supabase.
          </p>
        </article>

        <article className="rounded-xl border border-[hsl(var(--golfer-line))] bg-white p-3 shadow-[0_24px_60px_-48px_rgba(12,25,19,0.35)]">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[hsl(var(--golfer-deep-soft))]/[0.56]">
            Access
          </p>
          <p className="mt-2 text-lg text-[hsl(var(--golfer-deep))]">Friend-only view</p>
          <p className="mt-1 text-xs text-[hsl(var(--golfer-deep-soft))]/[0.74]">
            Open this from your friends list to compare how someone else sees the courses they have played.
          </p>
        </article>
      </section>

      <section className="rounded-2xl border border-[hsl(var(--golfer-line))] bg-white p-4 shadow-[0_24px_70px_-48px_rgba(12,25,19,0.35)]">
        {isFriendsLoading || isFriendRankingsLoading ? (
          <div className="rounded-xl bg-[hsl(var(--golfer-cream))] p-4 text-sm text-[hsl(var(--golfer-deep-soft))]/[0.72]">
            Loading friend rankings...
          </div>
        ) : !activeFriend && friendRankings.length === 0 ? (
          <div className="rounded-xl bg-[hsl(var(--golfer-cream))] p-4 text-sm leading-6 text-[hsl(var(--golfer-deep-soft))]/[0.72]">
            This user is not in your accepted-friends list, or they have not saved any rankings yet.
          </div>
        ) : hasFriendRankingsError ? (
          <div className="rounded-xl bg-[hsl(var(--golfer-cream))] p-4 text-sm leading-6 text-[hsl(var(--golfer-deep-soft))]/[0.72]">
            Friend rankings could not be loaded from Supabase.
          </div>
        ) : friendRankings.length === 0 ? (
          <div className="rounded-xl bg-[hsl(var(--golfer-cream))] p-4 text-sm leading-6 text-[hsl(var(--golfer-deep-soft))]/[0.72]">
            This friend has not saved any course rankings yet.
          </div>
        ) : (
          <div className="space-y-2">
            {friendRankings.map((ranking, index) => (
              <article
                key={ranking.id}
                className="grid gap-3 rounded-xl border border-[hsl(var(--golfer-line))] bg-[hsl(var(--golfer-cream))] p-3 sm:grid-cols-[3.5rem_minmax(0,1fr)_auto]"
              >
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-full bg-[hsl(var(--golfer-deep))] px-2 text-sm font-semibold text-white">
                    {ranking.overall_rating != null ? ranking.overall_rating.toFixed(1) : "--"}
                  </span>
                  <div className="sm:hidden">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-[hsl(var(--golfer-deep-soft))]/[0.56]">
                      Rating
                    </p>
                  </div>
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold text-[hsl(var(--golfer-deep))]">
                      {ranking.course_name}
                    </h3>
                    <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-medium text-[hsl(var(--golfer-deep))]">
                      #{index + 1}
                    </span>
                    {ranking.overall_rating != null ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-gold/15 px-2.5 py-0.5 text-xs font-medium text-gold">
                        <Star size={10} />
                        Rated
                      </span>
                    ) : null}
                  </div>

                  <p className="mt-1 text-xs text-[hsl(var(--golfer-deep-soft))]/[0.72]">
                    {[ranking.course_city, ranking.course_state].filter(Boolean).join(", ") || "Location unavailable"}
                  </p>

                  <div className="mt-2 flex flex-wrap gap-1.5 text-xs text-[hsl(var(--golfer-deep-soft))]/[0.74]">
                    {ranking.date_played ? (
                      <span className="rounded-full bg-white px-2.5 py-1">
                        Played {formatDisplayDate(ranking.date_played)}
                      </span>
                    ) : null}
                    {ranking.updated_at ? (
                      <span className="rounded-full bg-white px-2.5 py-1">
                        Updated {formatDisplayDate(ranking.updated_at)}
                      </span>
                    ) : null}
                    {ranking.notes ? (
                      <span className="rounded-full bg-white px-2.5 py-1">Notes saved</span>
                    ) : null}
                    <span className="rounded-full bg-white px-2.5 py-1">
                      <Users className="mr-1 inline-block h-3 w-3" />
                      Friend ranking
                    </span>
                  </div>

                  {ranking.notes ? (
                    <p className="mt-2 text-sm leading-6 text-[hsl(var(--golfer-deep-soft))]/[0.74]">
                      {ranking.notes}
                    </p>
                  ) : null}
                </div>

                <div className="flex items-start justify-start sm:justify-end">
                  <Link
                    to={`/course/${ranking.course_id}`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--golfer-line))] bg-white px-3 py-1.5 text-xs font-medium text-[hsl(var(--golfer-deep))]"
                  >
                    Open course
                    <ArrowUpRight size={12} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
