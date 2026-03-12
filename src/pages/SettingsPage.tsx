import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight, LogOut, User, Bell, Shield, Palette, HelpCircle } from 'lucide-react';

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
    <div className="min-h-screen bg-background pb-24">
      <div className="flex items-center gap-3 px-4 pt-4">
        <button onClick={() => navigate(-1)}><ArrowLeft size={20} className="text-foreground" /></button>
        <h1 className="font-display text-xl text-foreground">Settings</h1>
      </div>

      <div className="mt-6 space-y-6 px-4">
        {settingGroups.map(group => (
          <div key={group.title}>
            <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">{group.title}</p>
            <div className="overflow-hidden rounded-xl bg-card shadow-sm">
              {group.items.map((item, i) => (
                <button
                  key={item.label}
                  onClick={() => item.action && navigate(item.action)}
                  className={`flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-secondary/50 ${
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
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-card py-3.5 text-sm font-medium text-destructive shadow-sm"
        >
          <LogOut size={16} /> Sign Out
        </button>
      </div>
    </div>
  );
}
