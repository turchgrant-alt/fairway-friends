import { useNavigate } from 'react-router-dom';
import { sampleLists, getCourseById, users } from '@/lib/mock-data';
import { Plus, Bookmark, ChevronRight } from 'lucide-react';

export default function SavedListsPage() {
  const navigate = useNavigate();

  // Combine saved courses + trip boards
  const savedCourseIds = ['2', '5', '7', '9', '11', '15'];
  const savedCourses = savedCourseIds.map(getCourseById).filter(Boolean);

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-4 pt-4">
        <h1 className="font-display text-2xl text-foreground">Lists & Rankings</h1>
      </div>

      {/* Quick saved */}
      <div className="mt-4 px-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Saved Courses</h2>
          <span className="text-xs text-muted-foreground">{savedCourses.length} courses</span>
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto hide-scrollbar">
          {savedCourses.map(c => c && (
            <button key={c.id} onClick={() => navigate(`/course/${c.id}`)} className="relative shrink-0 overflow-hidden rounded-lg" style={{ width: 120, height: 150 }}>
              <img src={c.imageUrl} alt={c.name} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
              <div className="absolute right-2 top-2">
                <Bookmark size={14} className="text-gold" fill="currentColor" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-2">
                <p className="line-clamp-2 text-[10px] font-medium leading-tight text-primary-foreground">{c.name}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Trip boards / Lists */}
      <div className="mt-6 px-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Your Lists</h2>
          <button className="flex items-center gap-1 text-xs font-medium text-primary">
            <Plus size={12} /> New
          </button>
        </div>
        <div className="mt-3 space-y-3">
          {sampleLists.map(list => {
            const listCourses = list.courseIds.map(getCourseById).filter(Boolean);
            return (
              <div key={list.id} className="rounded-xl bg-card p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-card-foreground">{list.title}</h3>
                <p className="text-xs text-muted-foreground">{list.description}</p>
                <div className="mt-3 flex -space-x-1.5">
                  {listCourses.slice(0, 5).map(c => c && (
                    <img key={c.id} src={c.imageUrl} alt={c.name} className="h-9 w-9 rounded-md border-2 border-card object-cover" />
                  ))}
                </div>
                <button className="mt-3 flex items-center gap-1 text-xs font-medium text-primary">
                  {list.courseIds.length} courses <ChevronRight size={12} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
