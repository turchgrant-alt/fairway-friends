import { useNavigate } from 'react-router-dom';
import { ArrowRight, Database, MapPinned, RefreshCcw, Settings } from 'lucide-react';

import PageHeader from '@/components/dashboard/PageHeader';
import FriendsSection from '@/components/friends/FriendsSection';
import ProfileRankingSection from '@/components/rankings/ProfileRankingSection';
import { useAuth } from '@/contexts/AuthContext';
import { demoStats, demoWorkspaceCards, formatDemoDate, starterLists } from '@/lib/demo-v1';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const identityLabel = profile?.display_name ?? profile?.username ?? user?.email ?? 'Your account';

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Workspace"
        title="Your GolfeR workspace"
        description="This page now combines the builder-facing product controls with your signed-in ranking state and friend network."
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
          { label: 'Courses loaded', value: demoStats.totalCourses, icon: Database },
          { label: 'States represented', value: demoStats.statesRepresented, icon: MapPinned },
          { label: 'Verified map pins', value: demoStats.mappableCourses, icon: MapPinned },
          { label: 'Latest import', value: formatDemoDate(demoStats.lastImportedAt), icon: RefreshCcw },
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
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[hsl(var(--golfer-deep-soft))]/[0.58]">Current mode</p>
          <h2 className="mt-4 text-3xl text-[hsl(var(--golfer-deep))]">{identityLabel}</h2>
          <p className="mt-4 text-sm leading-8 text-[hsl(var(--golfer-deep-soft))]/[0.74]">
            Supabase now persists your account, friendships, and saved rankings while the course catalog remains local
            and fast. The visible product is still intentionally trimmed so browsing and ranking flows stay practical
            to test.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {demoWorkspaceCards.map((card) => (
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
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[hsl(var(--golfer-deep-soft))]/[0.58]">Starter lists</p>
          <div className="mt-6 space-y-4">
            {starterLists.map((list) => (
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
