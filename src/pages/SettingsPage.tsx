import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Compass, ListChecks, Route, Settings2 } from 'lucide-react';
import PageHeader from '@/components/dashboard/PageHeader';

const settingGroups = [
  {
    title: 'Go to',
    items: [
      { icon: Route, label: 'View profile', action: '/profile' },
      { icon: Compass, label: 'Browse courses', action: '/discover' },
      { icon: ListChecks, label: 'Open curated lists', action: '/lists' },
    ],
  },
  {
    title: 'Account',
    items: [
      { icon: Settings2, label: 'Signed in with GolfeR account' },
      { icon: Route, label: 'Friends and rankings sync automatically' },
    ],
  },
];

export default function SettingsPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Settings"
        title="Account settings"
        description="Quick links for your profile, course browsing, and the parts of GolfeR you are most likely to revisit."
        actions={
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--golfer-line))] bg-white px-4 py-3 text-sm font-medium text-[hsl(var(--golfer-deep))]"
          >
            <ArrowLeft size={16} /> Back
          </button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {settingGroups.map(group => (
          <div key={group.title} className="rounded-[30px] border border-[hsl(var(--golfer-line))] bg-white p-5 shadow-[0_24px_70px_-48px_rgba(12,25,19,0.35)]">
            <p className="mb-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">{group.title}</p>
            <div className="overflow-hidden rounded-[22px] bg-[hsl(var(--golfer-cream))]">
              {group.items.map((item, i) => (
                <button
                  key={item.label}
                  onClick={() => item.action && navigate(item.action)}
                  className={`flex w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-secondary/50 ${
                    i < group.items.length - 1 ? 'border-b border-border' : ''
                  }`}
                >
                  <item.icon size={18} className="text-muted-foreground" />
                  <span className="flex-1 text-sm text-card-foreground">{item.label}</span>
                  <ChevronRight size={16} className="text-muted-foreground" />
                </button>
              ))}
            </div>
          </div>
        ))}

        <div className="rounded-[30px] border border-[hsl(var(--golfer-line))] bg-[hsl(var(--golfer-deep))] p-6 text-white shadow-[0_24px_70px_-48px_rgba(12,25,19,0.35)] lg:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/55">GolfeR account</p>
          <p className="mt-4 text-2xl">Your rankings, friends, and sign-in stay with you.</p>
          <p className="mt-3 text-sm leading-8 text-white/72">
            Use this page as a clean starting point when you want to jump back into discovery, compare lists with your
            crew, or manage the account you are signed in with.
          </p>
        </div>
      </div>
    </div>
  );
}
