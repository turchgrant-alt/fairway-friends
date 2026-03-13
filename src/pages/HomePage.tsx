import { useNavigate } from 'react-router-dom';
import { ArrowRight, CalendarClock, Database, MapPinned, RefreshCcw } from 'lucide-react';

import CourseCard from '@/components/CourseCard';
import SectionHeader from '@/components/SectionHeader';
import PageHeader from '@/components/dashboard/PageHeader';
import { demoStats, demoWorkspaceCards, featuredV1Courses, formatDemoDate, starterLists } from '@/lib/demo-v1';

export default function HomePage() {
  const navigate = useNavigate();
  const [leadCourse, ...secondaryCourses] = featuredV1Courses;

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Overview"
        title="A cleaner GolfeR v1, ready for product work."
        description="This internal shell is now focused on the real course dataset, core discovery surfaces, and builder-friendly checkpoints instead of fake users or social activity."
        actions={
          <>
            <button
              onClick={() => navigate('/discover')}
              className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--golfer-line))] bg-white px-4 py-3 text-sm font-medium text-[hsl(var(--golfer-deep))] shadow-[0_18px_50px_-36px_rgba(12,25,19,0.45)] transition hover:-translate-y-0.5"
            >
              Explore courses <ArrowRight size={16} />
            </button>
            <button
              onClick={() => navigate('/profile')}
              className="inline-flex items-center gap-2 rounded-full bg-[hsl(var(--golfer-deep))] px-4 py-3 text-sm font-medium text-white transition hover:opacity-95"
            >
              Open workspace
            </button>
          </>
        }
      />

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)]">
        <div className="rounded-[32px] border border-[hsl(var(--golfer-line))] bg-[hsl(var(--golfer-deep))] p-8 text-white shadow-[0_30px_80px_-48px_rgba(12,25,19,0.55)]">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/55">Current scope</p>
          <h2 className="mt-5 max-w-xl text-3xl leading-tight sm:text-4xl">
            A stored U.S. course catalog, a cleaner v1 shell, and a calmer surface for product work.
          </h2>
          <p className="mt-5 max-w-2xl text-sm leading-8 text-white/72 sm:text-base">
            Use this v1 shell to test discovery, list structure, map flow, and course pages without pretending the
            product is fuller than the source data really is. The social layer is still in code for later, but it is no
            longer driving the visible app.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {demoWorkspaceCards.map((card) => (
              <button
                key={card.path}
                onClick={() => navigate(card.path)}
                className="rounded-[24px] border border-white/10 bg-white/5 p-5 text-left transition hover:bg-white/10"
              >
                <p className="text-lg font-semibold">{card.title}</p>
                <p className="mt-2 text-sm leading-7 text-white/68">{card.description}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          {[
            { label: 'Courses in catalog', value: demoStats.totalCourses, icon: Database },
            { label: 'States represented', value: demoStats.statesRepresented, icon: MapPinned },
            { label: 'Verified map pins', value: demoStats.mappableCourses, icon: MapPinned },
            { label: 'Coordinate coverage', value: `${demoStats.coordinateCoveragePercent}%`, icon: CalendarClock },
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
          <div className="rounded-[28px] border border-[hsl(var(--golfer-line))] bg-white p-6 shadow-[0_24px_60px_-48px_rgba(12,25,19,0.35)]">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[hsl(var(--golfer-mist))] text-[hsl(var(--golfer-deep))]">
              <CalendarClock size={18} />
            </span>
            <p className="mt-5 text-xl text-[hsl(var(--golfer-deep))]">{formatDemoDate(demoStats.lastImportedAt)}</p>
            <p className="mt-2 text-sm text-[hsl(var(--golfer-deep-soft))]/[0.72]">Latest local catalog import</p>
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <SectionHeader
          title="Featured course structure"
          description="A few anchor records are enough to validate cards, detail pages, and layout decisions while the broader dataset continues to grow."
        />
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          {leadCourse ? <CourseCard course={leadCourse} variant="wide" /> : null}
          <div className="grid gap-4">
            {secondaryCourses.map((course) => (
              <CourseCard key={course.id} course={course} variant="compact" />
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <SectionHeader
          title="Starter list structure"
          description="These lightweight lists keep the list and grouping UI useful in demo mode without pretending there is a populated social graph behind it."
        />
        <div className="grid gap-5 lg:grid-cols-3">
          {starterLists.map((list) => (
            <article
              key={list.id}
              className="rounded-[28px] border border-[hsl(var(--golfer-line))] bg-white p-6 shadow-[0_24px_60px_-48px_rgba(12,25,19,0.38)]"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[hsl(var(--golfer-deep-soft))]/[0.58]">
                Demo list
              </p>
              <h3 className="mt-4 text-xl text-[hsl(var(--golfer-deep))]">{list.title}</h3>
              <p className="mt-3 text-sm leading-7 text-[hsl(var(--golfer-deep-soft))]/[0.74]">{list.description}</p>
              <div className="mt-5 space-y-3">
                {list.courses.slice(0, 3).map((course) => (
                  <button
                    key={course.id}
                    onClick={() => navigate(`/course/${course.id}`)}
                    className="flex w-full items-center gap-3 rounded-[20px] bg-[hsl(var(--golfer-cream))] p-3 text-left transition hover:bg-[hsl(var(--golfer-mist))]"
                  >
                    <img src={course.imageUrl} alt={course.name} className="h-12 w-12 rounded-[14px] object-cover" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-card-foreground">{course.name}</p>
                      <p className="text-xs text-muted-foreground">{course.location}</p>
                    </div>
                  </button>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-[30px] border border-[hsl(var(--golfer-line))] bg-white p-7 shadow-[0_24px_60px_-48px_rgba(12,25,19,0.35)]">
          <div className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.24em] text-[hsl(var(--golfer-deep-soft))]/[0.55]">
            <RefreshCcw size={16} />
            Refresh status
          </div>
          <p className="mt-5 text-2xl text-[hsl(var(--golfer-deep))]">{formatDemoDate(demoStats.lastImportedAt)}</p>
          <p className="mt-3 text-sm leading-7 text-[hsl(var(--golfer-deep-soft))]/[0.74]">
            The current app now reads from a stored CSV-backed course catalog. Map pins only appear where the dataset
            has verified coordinates.
          </p>
        </article>

        <article className="rounded-[30px] border border-[hsl(var(--golfer-line))] bg-white p-7 shadow-[0_24px_60px_-48px_rgba(12,25,19,0.35)]">
          <div className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.24em] text-[hsl(var(--golfer-deep-soft))]/[0.55]">
            <MapPinned size={16} />
            Working focus
          </div>
          <p className="mt-5 text-2xl text-[hsl(var(--golfer-deep))]">Discovery, course pages, and lists</p>
          <p className="mt-3 text-sm leading-7 text-[hsl(var(--golfer-deep-soft))]/[0.74]">
            Auth, public profiles, reviews, and notifications are temporarily stepped back so the core product surface
            is faster to test and easier to review.
          </p>
        </article>
      </section>
    </div>
  );
}
