import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight, LogOut, User, Bell, Shield, Palette, HelpCircle } from 'lucide-react';
import PageHeader from '@/components/dashboard/PageHeader';

const settingGroups = [
  {
    title: 'Account',
    items: [
      { icon: User, label: 'Edit Profile', action: '/profile' },
      { icon: Bell, label: 'Notification Preferences' },
      { icon: Shield, label: 'Privacy & Security' },
    ],
  },
  {
    title: 'App',
    items: [
      { icon: Palette, label: 'Appearance' },
      { icon: HelpCircle, label: 'Help & Support' },
    ],
  },
];

export default function SettingsPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Settings"
        title="Tune the product around how you golf."
        description="Profile, notifications, privacy, and support now sit in a calmer desktop-friendly layout instead of a stacked app menu."
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

        <button
          onClick={() => navigate('/')}
          className="flex w-full items-center justify-center gap-2 rounded-[30px] border border-[hsl(var(--golfer-line))] bg-white py-4 text-sm font-medium text-destructive shadow-[0_24px_70px_-48px_rgba(12,25,19,0.35)] lg:col-span-2"
        >
          <LogOut size={16} /> Sign Out
        </button>
      </div>
    </div>
  );
}
