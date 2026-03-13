import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { courses } from '@/lib/course-data';
import { MapPin, Star, Bookmark, X, List } from 'lucide-react';
import PageHeader from '@/components/dashboard/PageHeader';
import { cn } from '@/lib/utils';

export default function MapPage() {
  const navigate = useNavigate();
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [showList, setShowList] = useState(false);
  const course = selectedCourse ? courses.find(c => c.id === selectedCourse) : null;

  // Simulated pin positions (in real app would use lat/lng with Mapbox/Google Maps)
  const pins = courses.map((c, i) => ({
    id: c.id,
    left: 10 + ((i * 37 + 13) % 80),
    top: 10 + ((i * 23 + 7) % 75),
  }));

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
              <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                placeholder="Search locations..."
                className="w-full rounded-full border border-white/25 bg-white/90 py-3 pl-11 pr-4 text-sm text-card-foreground shadow-lg backdrop-blur-sm outline-none"
              />
            </div>
          </div>

          <div className="absolute inset-0 overflow-hidden" style={{
            background: `
              linear-gradient(135deg, hsl(152 20% 85%) 0%, hsl(145 15% 80%) 30%, hsl(140 12% 78%) 60%, hsl(148 18% 82%) 100%)
            `
          }}>
            <div className="absolute inset-0 opacity-20" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }} />

            {pins.map(pin => (
              <button
                key={pin.id}
                onClick={() => setSelectedCourse(pin.id)}
                className={`absolute z-10 flex items-center justify-center transition-transform ${
                  selectedCourse === pin.id ? 'scale-125' : 'hover:scale-110'
                }`}
                style={{ left: `${pin.left}%`, top: `${pin.top}%` }}
              >
                <div className={`flex h-9 w-9 items-center justify-center rounded-full shadow-lg ${
                  selectedCourse === pin.id ? 'bg-gold' : 'bg-primary'
                }`}>
                  <MapPin size={14} className="text-primary-foreground" fill="currentColor" />
                </div>
              </button>
            ))}
          </div>

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
                      <span className="flex items-center gap-0.5 rounded-full bg-gold/15 px-3 py-1 text-xs font-bold text-gold">
                        <Star size={10} fill="currentColor" /> {course.overallRating != null ? course.overallRating : 'New'}
                      </span>
                      <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] capitalize text-secondary-foreground">{course.type}</span>
                      {course.priceRange ? <span className="text-sm text-muted-foreground">{course.priceRange}</span> : null}
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
                  <div className="w-px bg-border" />
                  <button className="flex flex-1 items-center justify-center gap-1 py-3 text-sm font-medium text-muted-foreground">
                    <Bookmark size={13} /> Save
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
              Choose a course from the list to highlight it on the map and jump straight into the details.
            </p>
          </div>

          {courses.map(c => (
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
                  <span className="text-xs font-bold text-gold">{c.overallRating != null ? c.overallRating : 'New'}</span>
                  <span className="text-xs capitalize text-muted-foreground">
                    {c.type}
                    {c.priceRange ? ` · ${c.priceRange}` : ''}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </aside>
      </section>
    </div>
  );
}
