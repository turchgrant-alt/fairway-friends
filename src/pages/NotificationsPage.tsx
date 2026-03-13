import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, UserPlus, Star, Bell as BellIcon } from 'lucide-react';
import { users } from '@/lib/social-data';
import PageHeader from '@/components/dashboard/PageHeader';

const notifications = [
  { id: '1', type: 'like', user: users[1], text: 'liked your review of Bethpage Black', time: '2h ago' },
  { id: '2', type: 'follow', user: users[2], text: 'started following you', time: '4h ago' },
  { id: '3', type: 'comment', user: users[3], text: 'commented on your review of Shinnecock Hills Golf Club', time: '6h ago' },
  { id: '4', type: 'like', user: users[4], text: 'liked your review of Van Cortlandt Golf Course', time: '1d ago' },
  { id: '5', type: 'follow', user: users[1], text: 'started following you', time: '2d ago' },
  { id: '6', type: 'comment', user: users[2], text: 'replied to your comment', time: '3d ago' },
];

const iconMap = {
  like: Heart,
  comment: MessageCircle,
  follow: UserPlus,
};

export default function NotificationsPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Notifications"
        title="Stay in sync with the people shaping your golf taste."
        description="Likes, follows, and comments all live here so the social side of discovery feels alive without being noisy."
      />

      <section className="rounded-[32px] border border-[hsl(var(--golfer-line))] bg-white p-4 shadow-[0_24px_70px_-48px_rgba(12,25,19,0.35)] sm:p-6">
      <div className="space-y-2">
        {notifications.map((n, i) => {
          const Icon = iconMap[n.type as keyof typeof iconMap] || BellIcon;
          return (
            <div
              key={n.id}
              className={`flex items-center gap-4 rounded-[24px] p-4 ${i < 2 ? 'bg-[hsl(var(--golfer-cream))]' : ''}`}
            >
              <div className="relative">
                <img src={n.user.avatar} alt={n.user.name} className="h-12 w-12 rounded-full object-cover" />
                <div className={`absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full ${
                  n.type === 'like' ? 'bg-destructive' : n.type === 'follow' ? 'bg-primary' : 'bg-gold'
                }`}>
                  <Icon size={10} className="text-primary-foreground" />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-7 text-card-foreground">
                  <button onClick={() => navigate(`/user/${n.user.id}`)} className="font-semibold">{n.user.name}</button>
                  {' '}{n.text}
                </p>
                <p className="text-xs text-muted-foreground">{n.time}</p>
              </div>
            </div>
          );
        })}
      </div>
      </section>
    </div>
  );
}
