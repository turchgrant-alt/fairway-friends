import { useNavigate } from 'react-router-dom';
import { getCourseById } from '@/lib/course-data';
import { users, getReviewsByUser, getListsByUser } from '@/lib/social-data';
import ReviewCard from '@/components/ReviewCard';
import PageHeader from '@/components/dashboard/PageHeader';
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
    <div className="space-y-10">
      <PageHeader
        eyebrow="Profile"
        title="Your GolfeR identity"
        description="Track your taste, keep your lists tidy, and make it obvious what kind of golf you want to chase next."
        actions={
          <button
            onClick={() => navigate('/settings')}
            className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-[hsl(var(--golfer-line))] bg-white text-[hsl(var(--golfer-deep))]"
          >
            <Settings size={18} />
          </button>
        }
      />

      <section className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <div className="rounded-[32px] border border-[hsl(var(--golfer-line))] bg-white p-6 shadow-[0_24px_70px_-48px_rgba(12,25,19,0.38)] sm:p-8">
          <div className="flex items-center gap-4">
            <img src={user.avatar} alt={user.name} className="h-24 w-24 rounded-full object-cover" />
            <div className="flex-1">
              <h2 className="text-2xl font-semibold text-card-foreground">{user.name}</h2>
              <p className="text-sm text-muted-foreground">@{user.username}</p>
              <p className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin size={11} /> {user.homeCity}
              </p>
            </div>
          </div>
          <p className="mt-5 text-sm leading-7 text-muted-foreground">{user.bio}</p>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Played', value: user.playedCount },
              { label: 'Saved', value: user.savedCount },
              { label: 'Followers', value: user.followersCount },
              { label: 'Following', value: user.followingCount },
            ].map(stat => (
              <div key={stat.label} className="rounded-[22px] bg-[hsl(var(--golfer-cream))] p-4 text-center">
                <p className="text-2xl font-bold text-card-foreground">{stat.value}</p>
                <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <span className="rounded-full bg-secondary px-3 py-1.5 text-xs text-secondary-foreground">Handicap: {user.handicapRange}</span>
            {user.preferredTypes.map(t => (
              <span key={t} className="rounded-full bg-forest-muted px-3 py-1.5 text-xs text-forest capitalize">{t}</span>
            ))}
          </div>
        </div>

        {topCourses.length > 0 && (
          <div className="rounded-[32px] border border-[hsl(var(--golfer-line))] bg-white p-6 shadow-[0_24px_70px_-48px_rgba(12,25,19,0.35)] sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[hsl(var(--golfer-deep-soft))]/[0.58]">Top courses</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {topCourses.map((c, i) => c && (
                <button key={c.id} onClick={() => navigate(`/course/${c.id}`)} className="relative overflow-hidden rounded-[24px] text-left">
                <img src={c.imageUrl} alt={c.name} className="h-48 w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gold text-[11px] font-bold text-gold-foreground">{i + 1}</span>
                  <p className="mt-2 truncate text-sm font-medium text-primary-foreground">{c.name}</p>
                </div>
              </button>
            ))}
          </div>
          </div>
        )}
      </section>

      <section className="rounded-[32px] border border-[hsl(var(--golfer-line))] bg-white p-6 shadow-[0_24px_70px_-48px_rgba(12,25,19,0.35)] sm:p-8">
      <div className="flex flex-wrap gap-2">
        {(['reviews', 'rankings', 'lists'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-2 text-sm font-medium capitalize transition-colors ${
              tab === t ? 'bg-[hsl(var(--golfer-deep))] text-white' : 'bg-secondary text-muted-foreground'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-6">
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
          <div className="grid gap-4 lg:grid-cols-2">
            {topCourses.map((c, i) => c && (
              <button key={c.id} onClick={() => navigate(`/course/${c.id}`)} className="flex w-full items-center gap-4 rounded-[24px] bg-[hsl(var(--golfer-cream))] p-4 text-left">
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${i < 3 ? 'bg-gold text-gold-foreground' : 'bg-secondary text-secondary-foreground'}`}>{i + 1}</span>
                <img src={c.imageUrl} alt={c.name} className="h-14 w-14 rounded-[16px] object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-card-foreground">{c.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{c.location}</p>
                </div>
                <span className="text-sm font-bold text-gold">{c.overallRating != null ? c.overallRating : 'New'}</span>
              </button>
            ))}
          </div>
        )}

        {tab === 'lists' && (
          <div className="grid gap-4 lg:grid-cols-2">
            {userLists.map(list => (
              <div key={list.id} className="rounded-[24px] bg-[hsl(var(--golfer-cream))] p-5">
                <h3 className="text-base font-semibold text-card-foreground">{list.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{list.description}</p>
                <p className="mt-3 flex items-center gap-1 text-sm text-primary">
                  {list.courseIds.length} courses <ChevronRight size={12} />
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
      </section>
    </div>
  );
}
