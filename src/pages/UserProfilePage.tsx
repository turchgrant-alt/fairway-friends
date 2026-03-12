import { useParams, useNavigate } from 'react-router-dom';
import { users, getReviewsByUser, getCourseById } from '@/lib/mock-data';
import ReviewCard from '@/components/ReviewCard';
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
    <div className="min-h-screen bg-background pb-24">
      <div className="flex items-center gap-3 px-4 pt-4">
        <button onClick={() => navigate(-1)}><ArrowLeft size={20} className="text-foreground" /></button>
        <h1 className="font-display text-lg text-foreground">@{user.username}</h1>
      </div>

      <div className="mt-4 px-4">
        <div className="rounded-xl bg-card p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <img src={user.avatar} alt={user.name} className="h-16 w-16 rounded-full object-cover" />
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-card-foreground">{user.name}</h2>
              <p className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin size={11} /> {user.homeCity}</p>
            </div>
            <button
              onClick={() => setFollowing(!following)}
              className={`flex items-center gap-1 rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
                following ? 'bg-secondary text-secondary-foreground' : 'bg-primary text-primary-foreground'
              }`}
            >
              <UserPlus size={12} /> {following ? 'Following' : 'Follow'}
            </button>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">{user.bio}</p>
          <div className="mt-4 grid grid-cols-4 gap-2">
            {[
              { label: 'Played', value: user.playedCount },
              { label: 'Saved', value: user.savedCount },
              { label: 'Followers', value: user.followersCount },
              { label: 'Following', value: user.followingCount },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className="text-lg font-bold text-card-foreground">{s.value}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </div>
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
                <img src={c.imageUrl} alt={c.name} className="h-20 w-full object-cover" />
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

      {/* Reviews */}
      <div className="mt-5 px-4">
        <h3 className="text-xs font-medium text-muted-foreground">RECENT REVIEWS</h3>
        <div className="mt-3 space-y-3">
          {userReviews.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No reviews yet</p>
          ) : (
            userReviews.map(r => <ReviewCard key={r.id} review={r} />)
          )}
        </div>
      </div>
    </div>
  );
}
