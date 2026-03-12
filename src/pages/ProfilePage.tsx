import { useNavigate } from 'react-router-dom';
import { users, getReviewsByUser, getListsByUser, getCourseById } from '@/lib/mock-data';
import ReviewCard from '@/components/ReviewCard';
import { Settings, MapPin, Star, ChevronRight } from 'lucide-react';
import { useState } from 'react';

type Tab = 'reviews' | 'rankings' | 'lists';

export default function ProfilePage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('reviews');
  const user = users[0]; // Current user
  const userReviews = getReviewsByUser(user.id);
  const userLists = getListsByUser(user.id);
  const topCourses = user.topCourses.map(getCourseById).filter(Boolean);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4">
        <h1 className="font-display text-xl text-foreground">Profile</h1>
        <button onClick={() => navigate('/settings')} className="flex h-9 w-9 items-center justify-center rounded-full bg-card shadow-sm">
          <Settings size={16} className="text-foreground" />
        </button>
      </div>

      {/* Profile card */}
      <div className="mt-4 px-4">
        <div className="rounded-xl bg-card p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <img src={user.avatar} alt={user.name} className="h-18 w-18 rounded-full object-cover" style={{ width: 72, height: 72 }} />
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-card-foreground">{user.name}</h2>
              <p className="text-sm text-muted-foreground">@{user.username}</p>
              <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin size={11} /> {user.homeCity}
              </p>
            </div>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{user.bio}</p>

          {/* Stats */}
          <div className="mt-4 grid grid-cols-4 gap-2">
            {[
              { label: 'Played', value: user.playedCount },
              { label: 'Saved', value: user.savedCount },
              { label: 'Followers', value: user.followersCount },
              { label: 'Following', value: user.followingCount },
            ].map(stat => (
              <div key={stat.label} className="text-center">
                <p className="text-lg font-bold text-card-foreground">{stat.value}</p>
                <p className="text-[10px] text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Info chips */}
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground">Handicap: {user.handicapRange}</span>
            {user.preferredTypes.map(t => (
              <span key={t} className="rounded-full bg-forest-muted px-3 py-1 text-xs text-forest capitalize">{t}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Top courses */}
      {topCourses.length > 0 && (
        <div className="mt-5 px-4">
          <h3 className="text-xs font-medium text-muted-foreground">TOP COURSES</h3>
          <div className="mt-2 flex gap-2">
            {topCourses.map((c, i) => c && (
              <button key={c.id} onClick={() => navigate(`/course/${c.id}`)} className="relative flex-1 overflow-hidden rounded-lg">
                <img src={c.imageUrl} alt={c.name} className="h-24 w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gold text-[10px] font-bold text-gold-foreground">{i + 1}</span>
                  <p className="mt-0.5 truncate text-[10px] font-medium text-primary-foreground">{c.name}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="mt-5 flex border-b border-border px-4">
        {(['reviews', 'rankings', 'lists'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`border-b-2 px-4 pb-2.5 text-sm font-medium capitalize transition-colors ${
              tab === t ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-4 px-4">
        {tab === 'reviews' && (
          <div className="space-y-3">
            {userReviews.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No reviews yet</p>
            ) : (
              userReviews.map(r => <ReviewCard key={r.id} review={r} />)
            )}
          </div>
        )}

        {tab === 'rankings' && (
          <div className="space-y-2">
            {topCourses.map((c, i) => c && (
              <button key={c.id} onClick={() => navigate(`/course/${c.id}`)} className="flex w-full items-center gap-3 rounded-lg bg-card p-3 text-left shadow-sm">
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${i < 3 ? 'bg-gold text-gold-foreground' : 'bg-secondary text-secondary-foreground'}`}>{i + 1}</span>
                <img src={c.imageUrl} alt={c.name} className="h-10 w-10 rounded-md object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-card-foreground">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.location}</p>
                </div>
                <span className="text-xs font-bold text-gold">{c.overallRating}</span>
              </button>
            ))}
          </div>
        )}

        {tab === 'lists' && (
          <div className="space-y-3">
            {userLists.map(list => (
              <div key={list.id} className="rounded-xl bg-card p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-card-foreground">{list.title}</h3>
                <p className="text-xs text-muted-foreground">{list.description}</p>
                <p className="mt-2 flex items-center gap-1 text-xs text-primary">
                  {list.courseIds.length} courses <ChevronRight size={12} />
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
