import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Code2, Database, RefreshCcw, Route } from 'lucide-react';
import PageHeader from '@/components/dashboard/PageHeader';

const settingGroups = [
  {
    title: 'Demo mode',
    items: [
      { icon: Route, label: 'Open workspace', action: '/profile' },
      { icon: Database, label: 'Browse course catalog', action: '/discover' },
      { icon: RefreshCcw, label: 'Review sync status', action: '/home' },
    ],
  },
  {
    title: 'Builder notes',
    items: [
      { icon: Code2, label: 'Routes preserved for future features' },
      { icon: Database, label: 'Real data comes from the local NY dataset' },
    ],
  },
];

export default function SettingsPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Settings"
        title="Developer/demo settings"
        description="This page is a practical reference point for the current GolfeR shell and its Supabase-backed account state."
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
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/55">Current behavior</p>
          <p className="mt-4 text-2xl">Auth, saved rankings, and friendships now persist.</p>
          <p className="mt-3 text-sm leading-8 text-white/72">
            Supabase handles account sessions and ranking storage. The course catalog still ships locally, and the
            visible product remains focused on discovery, ranking, and friend comparison rather than broader social
            activity.
          </p>
        </div>
      </div>
    </div>
  );
}
