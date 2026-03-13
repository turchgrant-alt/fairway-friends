import { useNavigate } from 'react-router-dom';
import { getCourseById } from '@/lib/course-data';
import { sampleLists } from '@/lib/social-data';
import PageHeader from '@/components/dashboard/PageHeader';
import { Plus, Bookmark, ChevronRight } from 'lucide-react';

export default function SavedListsPage() {
  const navigate = useNavigate();

  // Combine saved courses + trip boards
  const savedCourseIds = ['2', '5', '7', '9', '11', '15'];
  const savedCourses = savedCourseIds.map(getCourseById).filter(Boolean);

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Saved"
        title="Keep bucket-list courses and trip boards in one place."
        description="This is your planning layer: the places worth remembering now, and the groups of courses that eventually turn into itineraries."
        actions={
          <button className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--golfer-line))] bg-white px-4 py-3 text-sm font-medium text-[hsl(var(--golfer-deep))]">
            <Plus size={16} /> New list
          </button>
        }
      />

      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl text-[hsl(var(--golfer-deep))]">Saved courses</h2>
          <span className="text-sm text-muted-foreground">{savedCourses.length} courses</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {savedCourses.map(c => c && (
            <button key={c.id} onClick={() => navigate(`/course/${c.id}`)} className="relative overflow-hidden rounded-[28px] text-left shadow-[0_24px_60px_-48px_rgba(12,25,19,0.35)]">
              <img src={c.imageUrl} alt={c.name} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
              <div className="absolute right-2 top-2">
                <Bookmark size={14} className="text-gold" fill="currentColor" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <p className="line-clamp-2 text-sm font-medium leading-tight text-primary-foreground">{c.name}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-[32px] border border-[hsl(var(--golfer-line))] bg-white p-6 shadow-[0_24px_70px_-48px_rgba(12,25,19,0.35)] sm:p-8">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl text-[hsl(var(--golfer-deep))]">Your lists</h2>
          <button className="flex items-center gap-1 text-sm font-medium text-primary">
            <Plus size={12} /> New
          </button>
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {sampleLists.map(list => {
            const listCourses = list.courseIds.map(getCourseById).filter(Boolean);
            return (
              <div key={list.id} className="rounded-[24px] bg-[hsl(var(--golfer-cream))] p-5">
                <h3 className="text-base font-semibold text-card-foreground">{list.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{list.description}</p>
                <div className="mt-3 flex -space-x-1.5">
                  {listCourses.slice(0, 5).map(c => c && (
                    <img key={c.id} src={c.imageUrl} alt={c.name} className="h-9 w-9 rounded-md border-2 border-card object-cover" />
                  ))}
                </div>
                <button className="mt-4 flex items-center gap-1 text-sm font-medium text-primary">
                  {list.courseIds.length} courses <ChevronRight size={12} />
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
