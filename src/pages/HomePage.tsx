import { courses, reviews, collections, users } from '@/lib/mock-data';
import CourseCard from '@/components/CourseCard';
import ReviewCard from '@/components/ReviewCard';
import SectionHeader from '@/components/SectionHeader';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';

export default function HomePage() {
  const navigate = useNavigate();
  const currentUser = users[0];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pb-2 pt-4">
        <div>
          <p className="text-xs text-muted-foreground">Good morning,</p>
          <h1 className="font-display text-xl text-foreground">{currentUser.name.split(' ')[0]}</h1>
        </div>
        <button onClick={() => navigate('/notifications')} className="relative flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-sm">
          <Bell size={18} className="text-foreground" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
        </button>
      </div>

      <div className="mt-4 space-y-6">
        {/* Trending course */}
        <div className="px-4">
          <CourseCard course={courses[4]} variant="wide" />
        </div>

        {/* Collections */}
        <div>
          <SectionHeader title="Curated Collections" action="See All" />
          <div className="mt-3 flex gap-3 overflow-x-auto px-4 hide-scrollbar">
            {collections.map(col => (
              <button key={col.id} className="relative shrink-0 overflow-hidden rounded-xl" style={{ width: 140, height: 180 }}>
                <img src={col.imageUrl} alt={col.title} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="text-xs font-semibold text-primary-foreground">{col.title}</p>
                  <p className="text-[10px] text-primary-foreground/70">{col.subtitle}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Friend activity */}
        <div>
          <SectionHeader title="Friend Activity" action="See All" />
          <div className="mt-3 space-y-3 px-4">
            {reviews.slice(0, 3).map(review => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        </div>

        {/* Nearby courses */}
        <div>
          <SectionHeader title="Popular Near You" action="See All" />
          <div className="mt-3 flex gap-3 overflow-x-auto px-4 hide-scrollbar">
            {courses.slice(0, 5).map(course => (
              <div key={course.id} className="w-64 shrink-0">
                <CourseCard course={course} />
              </div>
            ))}
          </div>
        </div>

        {/* Top rated */}
        <div>
          <SectionHeader title="Highest Rated" action="See All" />
          <div className="mt-3 space-y-2 px-4">
            {[...courses].sort((a, b) => b.overallRating - a.overallRating).slice(0, 5).map((course, i) => (
              <button
                key={course.id}
                onClick={() => navigate(`/course/${course.id}`)}
                className="flex w-full items-center gap-3 rounded-lg bg-card p-3 text-left shadow-sm"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{i + 1}</span>
                <img src={course.imageUrl} alt={course.name} className="h-12 w-12 rounded-md object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-card-foreground">{course.name}</p>
                  <p className="text-xs text-muted-foreground">{course.location}</p>
                </div>
                <span className="text-sm font-bold text-gold">{course.overallRating}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
