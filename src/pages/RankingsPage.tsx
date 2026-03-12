import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { courses, sampleLists, users, getCourseById } from '@/lib/mock-data';
import { Plus, Star, ChevronRight } from 'lucide-react';

type Tab = 'rankings' | 'lists';

export default function RankingsPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('rankings');
  const currentUser = users[0];

  // Mock user's ranked courses
  const rankedCourseIds = ['9', '11', '5', '3', '7', '1', '4', '8', '2', '10'];
  const rankedCourses = rankedCourseIds.map(getCourseById).filter(Boolean);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="px-4 pt-4">
        <h1 className="font-display text-2xl text-foreground">Lists & Rankings</h1>
      </div>

      {/* Tabs */}
      <div className="mt-4 flex border-b border-border px-4">
        {(['rankings', 'lists'] as Tab[]).map(t => (
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
        {tab === 'rankings' && (
          <div className="space-y-2">
            <p className="mb-3 text-xs text-muted-foreground">Your personal course rankings</p>
            {rankedCourses.map((course, i) => course && (
              <button
                key={course.id}
                onClick={() => navigate(`/course/${course.id}`)}
                className="flex w-full items-center gap-3 rounded-lg bg-card p-3 text-left shadow-sm transition-shadow hover:shadow-md"
              >
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  i < 3 ? 'bg-gold text-gold-foreground' : 'bg-secondary text-secondary-foreground'
                }`}>
                  {i + 1}
                </span>
                <img src={course.imageUrl} alt={course.name} className="h-12 w-12 rounded-md object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-card-foreground">{course.name}</p>
                  <p className="text-xs text-muted-foreground">{course.location}</p>
                </div>
                <span className="flex items-center gap-0.5 text-sm font-bold text-gold">
                  <Star size={12} fill="currentColor" /> {course.overallRating}
                </span>
              </button>
            ))}
          </div>
        )}

        {tab === 'lists' && (
          <div className="space-y-3">
            <button className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border py-4 text-sm font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary">
              <Plus size={16} /> Create New List
            </button>
            {sampleLists.map(list => {
              const listCourses = list.courseIds.map(getCourseById).filter(Boolean);
              const owner = users.find(u => u.id === list.userId);
              return (
                <div key={list.id} className="rounded-xl bg-card p-4 shadow-sm">
                  <div className="flex items-center gap-2">
                    {owner && <img src={owner.avatar} alt={owner.name} className="h-6 w-6 rounded-full object-cover" />}
                    <span className="text-xs text-muted-foreground">{owner?.name}</span>
                  </div>
                  <h3 className="mt-2 text-sm font-semibold text-card-foreground">{list.title}</h3>
                  <p className="text-xs text-muted-foreground">{list.description}</p>
                  <div className="mt-3 flex -space-x-2">
                    {listCourses.slice(0, 4).map(c => c && (
                      <img key={c.id} src={c.imageUrl} alt={c.name} className="h-10 w-10 rounded-md border-2 border-card object-cover" />
                    ))}
                    {list.courseIds.length > 4 && (
                      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary text-xs font-medium text-secondary-foreground">
                        +{list.courseIds.length - 4}
                      </div>
                    )}
                  </div>
                  <button className="mt-3 flex items-center gap-1 text-xs font-medium text-primary">
                    View list <ChevronRight size={12} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
