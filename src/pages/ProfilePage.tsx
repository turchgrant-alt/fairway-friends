import { useNavigate } from 'react-router-dom';
import { ArrowRight, Database, Globe, RefreshCcw, Settings } from 'lucide-react';

import PageHeader from '@/components/dashboard/PageHeader';
import { demoStats, demoWorkspaceCards, formatDemoDate, starterLists } from '@/lib/demo-v1';

export default function ProfilePage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Workspace"
        title="Builder-facing product workspace"
        description="Use this page as the practical control surface for the v1 demo: what data is loaded, what is in scope, and which core pages are worth testing next."
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
          { label: 'Completed states', value: demoStats.completedStates, icon: RefreshCcw },
          { label: 'Website coverage', value: demoStats.withWebsiteCount, icon: Globe },
          { label: 'Next refresh', value: formatDemoDate(demoStats.nextRefreshDueAt), icon: RefreshCcw },
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
          <h2 className="mt-4 text-3xl text-[hsl(var(--golfer-deep))]">No-auth demo workspace</h2>
          <p className="mt-4 text-sm leading-8 text-[hsl(var(--golfer-deep-soft))]/[0.74]">
            The visible app is intentionally trimmed down. Fake profiles, followers, activity feeds, and authored
            reviews are hidden so the current product can focus on real course ingestion and the core browsing flow.
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
    </div>
  );
}
