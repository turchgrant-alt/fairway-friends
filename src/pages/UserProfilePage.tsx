import { useParams, useNavigate } from 'react-router-dom';
import { getCourseById } from '@/lib/course-data';
import { users, getReviewsByUser } from '@/lib/social-data';
import ReviewCard from '@/components/ReviewCard';
import PageHeader from '@/components/dashboard/PageHeader';
import { ArrowLeft, MapPin, UserPlus } from 'lucide-react';
import { useState } from 'react';

export default function UserProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [following, setFollowing] = useState(false);
  const user = users.find(u => u.id === id);
  const userReviews = getReviewsByUser(id || '');
  const topCourses = (user?.topCourses || []).map(getCourseById).filter(Boolean);

  if (!user) return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <p className="text-muted-foreground">User not found</p>
    </div>
  );

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Community profile"
        title={user.name}
        description={`@${user.username}`}
        actions={
          <>
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--golfer-line))] bg-white px-4 py-3 text-sm font-medium text-[hsl(var(--golfer-deep))]"
            >
              <ArrowLeft size={16} /> Back
            </button>
            <button
              onClick={() => setFollowing(!following)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold transition-colors ${
                following ? 'bg-secondary text-secondary-foreground' : 'bg-[hsl(var(--golfer-deep))] text-white'
              }`}
            >
              <UserPlus size={14} /> {following ? 'Following' : 'Follow'}
            </button>
          </>
        }
      />

      <section className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <div className="rounded-[32px] border border-[hsl(var(--golfer-line))] bg-white p-6 shadow-[0_24px_70px_-48px_rgba(12,25,19,0.38)] sm:p-8">
          <div className="flex items-center gap-4">
            <img src={user.avatar} alt={user.name} className="h-24 w-24 rounded-full object-cover" />
            <div className="flex-1">
              <h2 className="text-2xl font-semibold text-card-foreground">{user.name}</h2>
              <p className="mt-2 flex items-center gap-1 text-sm text-muted-foreground"><MapPin size={12} /> {user.homeCity}</p>
            </div>
          </div>
          <p className="mt-5 text-sm leading-7 text-muted-foreground">{user.bio}</p>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Played', value: user.playedCount },
              { label: 'Saved', value: user.savedCount },
              { label: 'Followers', value: user.followersCount },
              { label: 'Following', value: user.followingCount },
            ].map(s => (
              <div key={s.label} className="rounded-[22px] bg-[hsl(var(--golfer-cream))] p-4 text-center">
                <p className="text-2xl font-bold text-card-foreground">{s.value}</p>
                <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{s.label}</p>
              </div>
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

      <section className="space-y-5">
        <h3 className="font-display text-2xl text-[hsl(var(--golfer-deep))]">Recent reviews</h3>
        <div className="space-y-4">
          {userReviews.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No reviews yet</p>
          ) : (
            userReviews.map(r => <ReviewCard key={r.id} review={r} />)
          )}
        </div>
      </section>
    </div>
  );
}
