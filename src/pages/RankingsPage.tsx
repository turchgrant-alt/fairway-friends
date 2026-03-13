import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCourseById, sortCoursesByRatingOrName } from '@/lib/course-data';
import { sampleLists, users } from '@/lib/social-data';
import PageHeader from '@/components/dashboard/PageHeader';
import { Plus, Star, ChevronRight } from 'lucide-react';

type Tab = 'rankings' | 'lists';

export default function RankingsPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('rankings');
  // Mock user's ranked courses
  const rankedCourseIds = users[0].topCourses;
  const rankedCourses = rankedCourseIds.map(getCourseById).filter(Boolean);
  const fallbackRankedCourses = sortCoursesByRatingOrName(rankedCourses);

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Rankings"
        title="Organize your golf taste into lists that are actually useful."
        description="Keep your personal pecking order close, then turn saved ideas into trip-ready boards when you are planning with friends."
        actions={
          <button className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--golfer-line))] bg-white px-4 py-3 text-sm font-medium text-[hsl(var(--golfer-deep))]">
            <Plus size={16} /> New list
          </button>
        }
      />

      <section className="rounded-[32px] border border-[hsl(var(--golfer-line))] bg-white p-6 shadow-[0_24px_70px_-48px_rgba(12,25,19,0.35)] sm:p-8">
      <div className="flex flex-wrap gap-2">
        {(['rankings', 'lists'] as Tab[]).map(t => (
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
        {tab === 'rankings' && (
          <div className="grid gap-4 lg:grid-cols-2">
            {fallbackRankedCourses.map((course, i) => course && (
              <button
                key={course.id}
                onClick={() => navigate(`/course/${course.id}`)}
                className="flex w-full items-center gap-4 rounded-[24px] bg-[hsl(var(--golfer-cream))] p-4 text-left transition hover:-translate-y-0.5"
              >
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                  i < 3 ? 'bg-gold text-gold-foreground' : 'bg-secondary text-secondary-foreground'
                }`}>
                  {i + 1}
                </span>
                <img src={course.imageUrl} alt={course.name} className="h-16 w-16 rounded-[18px] object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-semibold text-card-foreground">{course.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{course.location}</p>
                </div>
                <span className="flex items-center gap-1 rounded-full bg-gold/15 px-3 py-1 text-sm font-bold text-gold">
                  <Star size={12} fill="currentColor" /> {course.overallRating != null ? course.overallRating : 'New'}
                </span>
              </button>
            ))}
          </div>
        )}

        {tab === 'lists' && (
          <div className="grid gap-4 lg:grid-cols-2">
            <button className="flex min-h-52 w-full items-center justify-center gap-2 rounded-[26px] border-2 border-dashed border-border bg-[hsl(var(--golfer-cream))] py-4 text-sm font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary">
              <Plus size={16} /> Create New List
            </button>
            {sampleLists.map(list => {
              const listCourses = list.courseIds.map(getCourseById).filter(Boolean);
              const owner = users.find(u => u.id === list.userId);
              return (
                <div key={list.id} className="rounded-[26px] bg-[hsl(var(--golfer-cream))] p-5">
                  <div className="flex items-center gap-2">
                    {owner && <img src={owner.avatar} alt={owner.name} className="h-6 w-6 rounded-full object-cover" />}
                    <span className="text-xs text-muted-foreground">{owner?.name}</span>
                  </div>
                  <h3 className="mt-3 text-base font-semibold text-card-foreground">{list.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{list.description}</p>
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
                  <button className="mt-4 flex items-center gap-1 text-sm font-medium text-primary">
                    View list <ChevronRight size={12} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
      </section>
    </div>
  );
}
