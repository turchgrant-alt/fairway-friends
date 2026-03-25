import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Medal, Settings, Users } from 'lucide-react';

import PageHeader from '@/components/dashboard/PageHeader';
import FriendsSection from '@/components/friends/FriendsSection';
import ProfileRankingSection from '@/components/rankings/ProfileRankingSection';
import { curatedPreviewLists, formatDisplayDate, primaryNavigationCards } from '@/lib/app-content';
import { useAuth } from '@/contexts/AuthContext';
import { useCourseRankings } from '@/hooks/use-course-rankings';
import { getMyFriends } from '@/lib/friends';

function getProfileTitle(value: string | null | undefined) {
  if (!value) return 'Your Profile';
  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : 'Your Profile';
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const { rankedCourses, rankedCourseCount, hasTrueRankingThreshold } = useCourseRankings();
  const { data: friends = [] } = useQuery({
    queryKey: ['friends', 'accepted'],
    queryFn: getMyFriends,
    staleTime: 30_000,
  });

  const identityLabel = getProfileTitle(profile?.display_name ?? profile?.username ?? user?.email?.split('@')[0]);
  const lastRankedAt = useMemo(
    () =>
      [...rankedCourses]
        .map((course) => course.lastPlayedAt ?? course.rankedAt)
        .filter((value): value is string => Boolean(value))
        .sort((a, b) => b.localeCompare(a))[0] ?? null,
    [rankedCourses],
  );

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Profile"
        title={identityLabel}
        description="Your rankings, friends, and saved places to start the next search."
        actions={
          <button
            onClick={() => navigate('/settings')}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[hsl(var(--golfer-line))] bg-white text-[hsl(var(--golfer-deep))]"
          >
            <Settings size={16} />
          </button>
        }
      />

      <section className="grid gap-3 lg:grid-cols-4">
        {[
          { label: 'Courses ranked', value: rankedCourseCount, icon: Medal },
          { label: 'Friends', value: friends.length, icon: Users },
          { label: 'Rating mode', value: hasTrueRankingThreshold ? 'Unlocked' : 'Building', icon: Medal },
          { label: 'Last ranked', value: lastRankedAt ? formatDisplayDate(lastRankedAt) : 'Not yet', icon: Medal },
        ].map(({ label, value, icon: Icon }) => (
          <article
            key={label}
            className="rounded-xl border border-[hsl(var(--golfer-line))] bg-white p-3 shadow-[0_24px_70px_-48px_rgba(12,25,19,0.38)]"
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[hsl(var(--golfer-mist))] text-[hsl(var(--golfer-deep))]">
              <Icon size={15} />
            </span>
            <p className="mt-2 text-xl text-[hsl(var(--golfer-deep))]">{value}</p>
            <p className="mt-0.5 text-xs text-[hsl(var(--golfer-deep-soft))]/[0.72]">{label}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-3 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="rounded-2xl border border-[hsl(var(--golfer-line))] bg-white p-4 shadow-[0_24px_70px_-48px_rgba(12,25,19,0.38)]">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[hsl(var(--golfer-deep-soft))]/[0.58]">Account</p>
          <h2 className="mt-2 text-lg text-[hsl(var(--golfer-deep))]">{identityLabel}</h2>
          <p className="mt-1 text-sm leading-6 text-[hsl(var(--golfer-deep-soft))]/[0.74]">
            Keep your rankings moving, jump back into discovery, and see how your crew stacks the courses they have
            played.
          </p>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {primaryNavigationCards.map((card) => (
              <button
                key={card.path}
                onClick={() => navigate(card.path)}
                className="rounded-xl bg-[hsl(var(--golfer-cream))] p-3 text-left transition hover:bg-[hsl(var(--golfer-mist))]"
              >
                <p className="text-sm font-semibold text-[hsl(var(--golfer-deep))]">{card.title}</p>
                <p className="mt-1 text-xs leading-5 text-[hsl(var(--golfer-deep-soft))]/[0.72]">{card.description}</p>
                <span className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-[hsl(var(--golfer-deep))]">
                  Open <ArrowRight size={12} />
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-[hsl(var(--golfer-line))] bg-white p-4 shadow-[0_24px_70px_-48px_rgba(12,25,19,0.35)]">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[hsl(var(--golfer-deep-soft))]/[0.58]">Curated lists</p>
          <div className="mt-3 space-y-2">
            {curatedPreviewLists.map((list) => (
              <div key={list.id} className="rounded-xl bg-[hsl(var(--golfer-cream))] p-3">
                <h3 className="text-sm text-[hsl(var(--golfer-deep))]">{list.title}</h3>
                <p className="mt-1 text-xs leading-5 text-[hsl(var(--golfer-deep-soft))]/[0.72]">{list.description}</p>
                <p className="mt-1.5 text-xs font-medium text-[hsl(var(--golfer-deep))]">{list.courses.length} courses</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <FriendsSection />

      <ProfileRankingSection />
    </div>
  );
}
