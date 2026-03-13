import { courses, sortCoursesByRatingOrName } from '@/lib/course-data';
import { reviews, collections, users } from '@/lib/social-data';
import CourseCard from '@/components/CourseCard';
import ReviewCard from '@/components/ReviewCard';
import SectionHeader from '@/components/SectionHeader';
import PageHeader from '@/components/dashboard/PageHeader';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Bell, Bookmark, Star } from 'lucide-react';

export default function HomePage() {
  const navigate = useNavigate();
  const currentUser = users[0];
  const firstName = currentUser.name.split(' ')[0];
  const featuredCourse = courses.find((course) => course.name === 'Bethpage Black') ?? courses[0];
  const orderedCourses = sortCoursesByRatingOrName(courses);

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Dashboard"
        title={`Welcome back, ${firstName}.`}
        description="Keep up with the courses people are rating highly, the lists worth stealing from your friends, and the next place worth planning around."
        actions={
          <button
            onClick={() => navigate('/notifications')}
            className="relative inline-flex h-12 w-12 items-center justify-center rounded-full border border-[hsl(var(--golfer-line))] bg-white text-[hsl(var(--golfer-deep))] shadow-[0_18px_50px_-36px_rgba(12,25,19,0.45)] transition hover:-translate-y-0.5"
          >
            <Bell size={18} />
            <span className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-destructive" />
          </button>
        }
      />

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(18rem,0.7fr)]">
        {featuredCourse ? <CourseCard course={featuredCourse} variant="wide" /> : null}

        <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
          {[
            { label: 'Courses played', value: currentUser.playedCount, icon: Star },
            { label: 'Saved for later', value: currentUser.savedCount, icon: Bookmark },
            { label: 'Followers', value: currentUser.followersCount, icon: Bell },
          ].map(({ label, value, icon: Icon }) => (
            <div
              key={label}
              className="rounded-[28px] border border-[hsl(var(--golfer-line))] bg-white p-6 shadow-[0_24px_60px_-48px_rgba(12,25,19,0.35)]"
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[hsl(var(--golfer-mist))] text-[hsl(var(--golfer-deep))]">
                <Icon size={18} />
              </span>
              <p className="mt-5 text-3xl text-[hsl(var(--golfer-deep))]">{value}</p>
              <p className="mt-2 text-sm text-[hsl(var(--golfer-deep-soft))]/[0.72]">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-8 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <div className="space-y-5">
          <SectionHeader
            title="Curated Collections"
            description="Editorially framed course groupings that help the next trip come together faster."
            action="See all"
          />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {collections.map(col => (
              <button key={col.id} className="relative overflow-hidden rounded-[28px] text-left shadow-[0_28px_80px_-48px_rgba(12,25,19,0.4)]">
                <img src={col.imageUrl} alt={col.title} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-foreground/70">Collection</p>
                  <p className="mt-2 text-lg font-semibold text-primary-foreground">{col.title}</p>
                  <p className="mt-1 text-sm text-primary-foreground/70">{col.subtitle}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-5">
          <SectionHeader
            title="Friend Activity"
            description="Trusted reviews and reactions from golfers whose taste you actually recognize."
            action="See all"
          />
          <div className="space-y-4">
            {reviews.slice(0, 3).map(review => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <SectionHeader
          title="Popular Near You"
          description="Public favorites, desert standouts, and weekend-worthy rounds that fit the season."
          action="See all"
        />
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {courses.slice(0, 6).map(course => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      </section>

      <section className="space-y-5">
        <SectionHeader
          title="Highest Rated"
          description="The courses the GolfeR community keeps putting back at the top of the list."
          action="See rankings"
        />
        <div className="grid gap-4 lg:grid-cols-2">
          {orderedCourses.slice(0, 6).map((course, i) => (
            <button
              key={course.id}
              onClick={() => navigate(`/course/${course.id}`)}
              className="flex w-full items-center gap-4 rounded-[26px] border border-[hsl(var(--golfer-line))] bg-white p-4 text-left shadow-[0_24px_60px_-48px_rgba(12,25,19,0.38)] transition hover:-translate-y-0.5"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--golfer-deep))] text-sm font-bold text-white">
                {i + 1}
              </span>
              <img src={course.imageUrl} alt={course.name} className="h-16 w-16 rounded-[18px] object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-semibold text-card-foreground">{course.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">{course.location}</p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-gold/15 px-3 py-1 text-sm font-bold text-gold">
                <Star size={13} fill="currentColor" /> {course.overallRating != null ? course.overallRating : 'New'}
              </span>
            </button>
          ))}
        </div>

        <button
          onClick={() => navigate('/rankings')}
          className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--golfer-line))] bg-white px-5 py-3 text-sm font-medium text-[hsl(var(--golfer-deep))] transition hover:-translate-y-0.5"
        >
          View full rankings <ArrowRight size={16} />
        </button>
      </section>
    </div>
  );
}
