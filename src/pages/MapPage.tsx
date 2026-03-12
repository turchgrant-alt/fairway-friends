import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { courses } from '@/lib/mock-data';
import { MapPin, Star, Bookmark, X, List } from 'lucide-react';

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
    <div className="relative h-screen bg-forest-muted">
      {/* Header */}
      <div className="absolute left-0 right-0 top-0 z-20 px-4 pt-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              placeholder="Search locations..."
              className="w-full rounded-full border border-border bg-card/95 py-2.5 pl-9 pr-4 text-sm text-card-foreground shadow-lg backdrop-blur-sm outline-none"
            />
          </div>
          <button
            onClick={() => setShowList(!showList)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-lg"
          >
            <List size={16} className="text-foreground" />
          </button>
        </div>
      </div>

      {/* Simulated map area */}
      <div className="absolute inset-0 overflow-hidden" style={{
        background: `
          linear-gradient(135deg, hsl(152 20% 85%) 0%, hsl(145 15% 80%) 30%, hsl(140 12% 78%) 60%, hsl(148 18% 82%) 100%)
        `
      }}>
        {/* Simulated map texture */}
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }} />

        {/* Course pins */}
        {pins.map(pin => (
          <button
            key={pin.id}
            onClick={() => setSelectedCourse(pin.id)}
            className={`absolute z-10 flex items-center justify-center transition-transform ${
              selectedCourse === pin.id ? 'scale-125' : 'hover:scale-110'
            }`}
            style={{ left: `${pin.left}%`, top: `${pin.top}%` }}
          >
            <div className={`flex h-8 w-8 items-center justify-center rounded-full shadow-lg ${
              selectedCourse === pin.id ? 'bg-gold' : 'bg-primary'
            }`}>
              <MapPin size={14} className="text-primary-foreground" fill="currentColor" />
            </div>
          </button>
        ))}
      </div>

      {/* Course quick card */}
      {course && (
        <div className="absolute bottom-24 left-4 right-4 z-20 animate-slide-up">
          <div className="overflow-hidden rounded-xl bg-card shadow-xl">
            <button onClick={() => setSelectedCourse(null)} className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-card/80 backdrop-blur-sm">
              <X size={14} />
            </button>
            <button onClick={() => navigate(`/course/${course.id}`)} className="flex w-full text-left">
              <img src={course.imageUrl} alt={course.name} className="h-28 w-28 shrink-0 object-cover" />
              <div className="flex-1 p-3">
                <h3 className="text-sm font-semibold text-card-foreground">{course.name}</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">{course.location}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="flex items-center gap-0.5 text-xs font-bold text-gold">
                    <Star size={10} fill="currentColor" /> {course.overallRating}
                  </span>
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] text-secondary-foreground">{course.type}</span>
                  <span className="text-xs text-muted-foreground">{course.priceRange}</span>
                </div>
                <div className="mt-2 flex gap-1">
                  {course.tags.slice(0, 2).map(tag => (
                    <span key={tag} className="rounded-full bg-forest-muted px-2 py-0.5 text-[10px] text-forest">{tag}</span>
                  ))}
                </div>
              </div>
            </button>
            <div className="flex border-t border-border">
              <button
                onClick={() => navigate(`/course/${course.id}`)}
                className="flex-1 py-2.5 text-center text-xs font-medium text-primary"
              >
                View Details
              </button>
              <div className="w-px bg-border" />
              <button className="flex flex-1 items-center justify-center gap-1 py-2.5 text-xs font-medium text-muted-foreground">
                <Bookmark size={12} /> Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* List overlay */}
      {showList && (
        <div className="absolute inset-0 z-30 bg-background/95 backdrop-blur-sm">
          <div className="flex items-center justify-between px-4 pt-4">
            <h2 className="font-display text-xl text-foreground">All Courses</h2>
            <button onClick={() => setShowList(false)} className="text-muted-foreground"><X size={20} /></button>
          </div>
          <div className="mt-4 space-y-2 overflow-auto px-4 pb-24" style={{ maxHeight: 'calc(100vh - 80px)' }}>
            {courses.map(c => (
              <button
                key={c.id}
                onClick={() => { setSelectedCourse(c.id); setShowList(false); }}
                className="flex w-full items-center gap-3 rounded-lg bg-card p-3 text-left shadow-sm"
              >
                <img src={c.imageUrl} alt={c.name} className="h-14 w-14 rounded-md object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-card-foreground">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.location}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-xs font-bold text-gold">{c.overallRating}</span>
                    <span className="text-xs text-muted-foreground">{c.type} · {c.priceRange}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
