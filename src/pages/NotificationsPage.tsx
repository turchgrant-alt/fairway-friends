import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, UserPlus, Star, Bell as BellIcon } from 'lucide-react';
import { users } from '@/lib/mock-data';

const notifications = [
  { id: '1', type: 'like', user: users[1], text: 'liked your review of TPC Scottsdale', time: '2h ago' },
  { id: '2', type: 'follow', user: users[2], text: 'started following you', time: '4h ago' },
  { id: '3', type: 'comment', user: users[3], text: 'commented on your review of Bandon Dunes', time: '6h ago' },
  { id: '4', type: 'like', user: users[4], text: 'liked your review of We-Ko-Pa Saguaro', time: '1d ago' },
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
    <div className="min-h-screen bg-background pb-24">
      <div className="px-4 pt-4">
        <h1 className="font-display text-2xl text-foreground">Notifications</h1>
      </div>

      <div className="mt-4 space-y-1 px-4">
        {notifications.map((n, i) => {
          const Icon = iconMap[n.type as keyof typeof iconMap] || BellIcon;
          return (
            <div
              key={n.id}
              className={`flex items-center gap-3 rounded-lg p-3 ${i < 2 ? 'bg-card shadow-sm' : ''}`}
            >
              <div className="relative">
                <img src={n.user.avatar} alt={n.user.name} className="h-10 w-10 rounded-full object-cover" />
                <div className={`absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full ${
                  n.type === 'like' ? 'bg-destructive' : n.type === 'follow' ? 'bg-primary' : 'bg-gold'
                }`}>
                  <Icon size={10} className="text-primary-foreground" />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-card-foreground">
                  <button onClick={() => navigate(`/user/${n.user.id}`)} className="font-semibold">{n.user.name}</button>
                  {' '}{n.text}
                </p>
                <p className="text-[11px] text-muted-foreground">{n.time}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
