import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { courses } from '@/lib/course-data';
import { MapPin, Star, X, List, Search } from 'lucide-react';
import PageHeader from '@/components/dashboard/PageHeader';
import { cn } from '@/lib/utils';
import NewYorkCourseMap from '@/components/maps/NewYorkCourseMap';

function hasCoordinates(course: typeof courses[number]) {
  return course.latitude != null && course.longitude != null;
}

export default function MapPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [showList, setShowList] = useState(false);
  const filteredCourses = courses.filter((course) => {
    if (!hasCoordinates(course)) return false;
    if (!query) return true;

    const normalizedQuery = query.toLowerCase();
    return (
      course.name.toLowerCase().includes(normalizedQuery) ||
      course.location.toLowerCase().includes(normalizedQuery) ||
      (course.addressLabel ?? '').toLowerCase().includes(normalizedQuery)
    );
  });
  const course = filteredCourses.find((entry) => entry.id === selectedCourse) ?? null;

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Map Discovery"
        title="See the course landscape before you commit the weekend."
        description="Use map-first browsing when location matters most, then jump into details for the place that looks worth the detour."
        actions={
          <button
            onClick={() => setShowList(!showList)}
            className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--golfer-line))] bg-white px-4 py-3 text-sm font-medium text-[hsl(var(--golfer-deep))] xl:hidden"
          >
            <List size={16} />
            {showList ? 'Hide list' : 'Show list'}
          </button>
        }
      />

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_22rem]">
        <div className="relative min-h-[40rem] overflow-hidden rounded-[34px] border border-[hsl(var(--golfer-line))] shadow-[0_32px_90px_-55px_rgba(12,25,19,0.45)]">
          <div className="absolute left-6 right-6 top-6 z-20">
            <div className="relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search New York courses or locations..."
                className="w-full rounded-full border border-white/25 bg-white/90 py-3 pl-11 pr-4 text-sm text-card-foreground shadow-lg backdrop-blur-sm outline-none"
              />
            </div>
          </div>

          <NewYorkCourseMap
            courses={filteredCourses}
            selectedCourseId={selectedCourse}
            onSelectCourse={setSelectedCourse}
          />

          {course && (
            <div className="absolute bottom-6 left-6 right-6 z-20 animate-slide-up">
              <div className="overflow-hidden rounded-[28px] bg-white shadow-[0_24px_70px_-45px_rgba(12,25,19,0.45)]">
                <button onClick={() => setSelectedCourse(null)} className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-card/80 backdrop-blur-sm">
                  <X size={14} />
                </button>
                <button onClick={() => navigate(`/course/${course.id}`)} className="flex w-full flex-col text-left sm:flex-row">
                  <img src={course.imageUrl} alt={course.name} className="h-40 w-full shrink-0 object-cover sm:h-auto sm:w-40" />
                  <div className="flex-1 p-5">
                    <h3 className="text-xl font-semibold text-card-foreground">{course.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{course.location}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {course.overallRating != null ? (
                        <span className="flex items-center gap-0.5 rounded-full bg-gold/15 px-3 py-1 text-xs font-bold text-gold">
                          <Star size={10} fill="currentColor" /> {course.overallRating}
                        </span>
                      ) : (
                        <span className="rounded-full bg-[hsl(var(--golfer-mist))] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[hsl(var(--golfer-deep))]">
                          Source
                        </span>
                      )}
                      <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] capitalize text-secondary-foreground">{course.type}</span>
                      {course.holes != null ? <span className="text-sm text-muted-foreground">{course.holes} holes</span> : null}
                    </div>
                    <div className="mt-3 flex gap-2">
                      {course.tags.slice(0, 2).map(tag => (
                        <span key={tag} className="rounded-full bg-forest-muted px-3 py-1 text-[11px] text-forest">{tag}</span>
                      ))}
                    </div>
                  </div>
                </button>
                <div className="flex border-t border-border">
                  <button
                    onClick={() => navigate(`/course/${course.id}`)}
                    className="flex-1 py-3 text-center text-sm font-medium text-primary"
                  >
                    View details
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <aside className={cn('space-y-3', showList ? 'block' : 'hidden xl:block')}>
          <div className="rounded-[30px] border border-[hsl(var(--golfer-line))] bg-white p-5 shadow-[0_24px_60px_-48px_rgba(12,25,19,0.38)]">
            <h2 className="font-display text-2xl text-[hsl(var(--golfer-deep))]">Nearby picks</h2>
            <p className="mt-2 text-sm leading-7 text-[hsl(var(--golfer-deep-soft))]/[0.74]">
              Choose a course from the list to highlight its real New York coordinates on the map and jump straight into the details.
            </p>
          </div>

          {filteredCourses.map(c => (
            <button
              key={c.id}
              onClick={() => { setSelectedCourse(c.id); setShowList(false); }}
              className="flex w-full items-center gap-3 rounded-[24px] border border-[hsl(var(--golfer-line))] bg-white p-4 text-left shadow-[0_20px_50px_-42px_rgba(12,25,19,0.35)] transition hover:-translate-y-0.5"
            >
              <img src={c.imageUrl} alt={c.name} className="h-16 w-16 rounded-[18px] object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-card-foreground">{c.name}</p>
                <p className="text-xs text-muted-foreground">{c.location}</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-xs font-bold text-gold">{c.overallRating != null ? c.overallRating : 'Source'}</span>
                  <span className="text-xs capitalize text-muted-foreground">
                    {c.type}
                    {c.holes != null ? ` · ${c.holes} holes` : ''}
                  </span>
                </div>
              </div>
            </button>
          ))}

          {filteredCourses.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-[hsl(var(--golfer-line))] bg-white p-5 text-sm leading-7 text-[hsl(var(--golfer-deep-soft))]/[0.74]">
              No mappable New York courses match the current search.
            </div>
          ) : null}
        </aside>
      </section>
    </div>
  );
}
