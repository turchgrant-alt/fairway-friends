import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, ListChecks, Medal, Settings, Users } from 'lucide-react';

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
  const { rankedCourses, rankedCourseCount } = useCourseRankings();
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
    <div className="space-y-10">
      <PageHeader
        eyebrow="Profile"
        title={identityLabel}
        description="Your rankings, friends, and saved places to start the next search."
        actions={
          <button
            onClick={() => navigate('/settings')}
            className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-[hsl(var(--golfer-line))] bg-white text-[hsl(var(--golfer-deep))]"
          >
            <Settings size={18} />
          </button>
        }
      />

      <section className="grid gap-6 lg:grid-cols-4">
        {[
          { label: 'Courses ranked', value: rankedCourseCount, icon: Medal },
          { label: 'Friends', value: friends.length, icon: Users },
          { label: 'Curated lists', value: curatedPreviewLists.length, icon: ListChecks },
          { label: 'Last ranked', value: lastRankedAt ? formatDisplayDate(lastRankedAt) : 'Not yet', icon: Medal },
        ].map(({ label, value, icon: Icon }) => (
          <article
            key={label}
            className="rounded-[28px] border border-[hsl(var(--golfer-line))] bg-white p-6 shadow-[0_24px_70px_-48px_rgba(12,25,19,0.38)]"
          >
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[hsl(var(--golfer-mist))] text-[hsl(var(--golfer-deep))]">
              <Icon size={18} />
            </span>
            <p className="mt-5 text-2xl text-[hsl(var(--golfer-deep))]">{value}</p>
            <p className="mt-2 text-sm text-[hsl(var(--golfer-deep-soft))]/[0.72]">{label}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="rounded-[32px] border border-[hsl(var(--golfer-line))] bg-white p-7 shadow-[0_24px_70px_-48px_rgba(12,25,19,0.38)] sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[hsl(var(--golfer-deep-soft))]/[0.58]">Account</p>
          <h2 className="mt-4 text-3xl text-[hsl(var(--golfer-deep))]">{identityLabel}</h2>
          <p className="mt-4 text-sm leading-8 text-[hsl(var(--golfer-deep-soft))]/[0.74]">
            Keep your rankings moving, jump back into discovery, and see how your crew stacks the courses they have
            played.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {primaryNavigationCards.map((card) => (
              <button
                key={card.path}
                onClick={() => navigate(card.path)}
                className="rounded-[24px] bg-[hsl(var(--golfer-cream))] p-5 text-left transition hover:bg-[hsl(var(--golfer-mist))]"
              >
                <p className="text-lg font-semibold text-[hsl(var(--golfer-deep))]">{card.title}</p>
                <p className="mt-2 text-sm leading-7 text-[hsl(var(--golfer-deep-soft))]/[0.72]">{card.description}</p>
                <span className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[hsl(var(--golfer-deep))]">
                  Open <ArrowRight size={14} />
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-[32px] border border-[hsl(var(--golfer-line))] bg-white p-7 shadow-[0_24px_70px_-48px_rgba(12,25,19,0.35)] sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[hsl(var(--golfer-deep-soft))]/[0.58]">Curated lists</p>
          <div className="mt-6 space-y-4">
            {curatedPreviewLists.map((list) => (
              <div key={list.id} className="rounded-[24px] bg-[hsl(var(--golfer-cream))] p-5">
                <h3 className="text-lg text-[hsl(var(--golfer-deep))]">{list.title}</h3>
                <p className="mt-2 text-sm leading-7 text-[hsl(var(--golfer-deep-soft))]/[0.72]">{list.description}</p>
                <p className="mt-3 text-sm font-medium text-[hsl(var(--golfer-deep))]">{list.courses.length} courses</p>
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
