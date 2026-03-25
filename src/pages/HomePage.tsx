import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Compass, ListChecks, MapPinned, Medal, Users } from 'lucide-react';

import CourseCard from '@/components/CourseCard';
import SectionHeader from '@/components/SectionHeader';
import PageHeader from '@/components/dashboard/PageHeader';
import { useAuth } from '@/contexts/AuthContext';
import { useCourseRankings } from '@/hooks/use-course-rankings';
import { useRankedCourseRecords } from '@/hooks/use-ranked-course-records';
import { curatedPreviewLists, featuredCourses } from '@/lib/app-content';
import { getMyFriends } from '@/lib/friends';

function getWelcomeName(value: string | null | undefined) {
  if (!value) return 'there';
  const trimmedValue = value.trim();
  if (!trimmedValue) return 'there';
  return trimmedValue.split(/\s+/)[0];
}

export default function HomePage() {
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const { rankedCourses, rankedCourseCount, hasTrueRankingThreshold, getCourseNumericRating } = useCourseRankings();
  const { data: friends = [] } = useQuery({
    queryKey: ['friends', 'accepted'],
    queryFn: getMyFriends,
    staleTime: 30_000,
  });

  const welcomeName = getWelcomeName(profile?.display_name ?? profile?.username ?? user?.email?.split('@')[0]);
  const [leadCourse, ...secondaryCourses] = featuredCourses;
  const recentRankings = useMemo(
    () =>
      [...rankedCourses]
        .sort((a, b) => (b.lastPlayedAt ?? b.rankedAt ?? '').localeCompare(a.lastPlayedAt ?? a.rankedAt ?? ''))
        .slice(0, 3),
    [rankedCourses],
  );
  const { records: recentRankingRecords, isLoading: isRecentRankingsLoading } =
    useRankedCourseRecords(recentRankings);

  const quickLinks = [
    { title: 'Discover', description: 'Browse and search courses.', path: '/discover', icon: Compass },
    { title: 'Map', description: 'Find courses near a city or road trip stop.', path: '/map', icon: MapPinned },
    { title: 'Rankings', description: 'See the courses you have ranked so far.', path: '/profile#rankings', icon: Medal },
    { title: 'Friends', description: 'Add your crew and compare lists.', path: '/profile#friends', icon: Users },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Home"
        title={`Welcome back, ${welcomeName}.`}
        description={
          rankedCourseCount > 0
            ? 'Keep your rankings moving, find your next round, and see what your crew is playing.'
            : 'Start with a course you know well, save the ones you want to play, and let GolfeR do the organizing.'
        }
        actions={
          <>
            <button
              onClick={() => navigate('/discover')}
              className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--golfer-line))] bg-white px-3 py-2 text-sm font-medium text-[hsl(var(--golfer-deep))] shadow-[0_18px_50px_-36px_rgba(12,25,19,0.45)] transition hover:-translate-y-0.5"
            >
              Explore courses <ArrowRight size={14} />
            </button>
            <button
              onClick={() => navigate('/map')}
              className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--golfer-deep))] px-3 py-2 text-sm font-medium text-white transition hover:opacity-95"
            >
              Open map
            </button>
          </>
        }
      />

      <section className="grid gap-3 xl:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)]">
        <div className="rounded-2xl border border-[hsl(var(--golfer-line))] bg-[hsl(var(--golfer-deep))] p-4 text-white shadow-[0_30px_80px_-48px_rgba(12,25,19,0.55)]">
          {rankedCourseCount > 0 ? (
            <>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/55">Recently ranked</p>
              <h2 className="mt-2 max-w-xl text-lg leading-tight">
                Your GolfeR list is starting to take shape.
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/72">
                Keep rating the rounds that mattered, tweak the order when your opinion changes, and use the map to
                find the next one worth adding.
              </p>
              <div className="mt-4 grid gap-2">
                {isRecentRankingsLoading ? (
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/68">
                    Loading your recent rankings...
                  </div>
                ) : (
                  recentRankingRecords.map(({ ranking, course, fallbackName, fallbackLocation }) => (
                    <button
                      key={ranking.courseId}
                      onClick={() => navigate(`/course/${ranking.courseId}`)}
                      className="rounded-xl border border-white/10 bg-white/5 p-3 text-left transition hover:bg-white/10"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold">{course?.name ?? fallbackName}</p>
                          <p className="mt-0.5 text-xs leading-5 text-white/68">
                            {course?.location ?? fallbackLocation}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs uppercase tracking-[0.22em] text-white/48">
                            {hasTrueRankingThreshold ? 'Rating' : 'Bucket'}
                          </p>
                          <p className="mt-0.5 text-base capitalize">
                            {hasTrueRankingThreshold
                              ? (getCourseNumericRating(ranking.courseId)?.toFixed(1) ?? '--')
                              : ranking.bucket}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </>
          ) : (
            <>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/55">Your first ranking</p>
              <h2 className="mt-2 max-w-xl text-lg leading-tight">
                Start with a course you already have an opinion on.
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/72">
                Open any course page, tap <span className="font-medium text-white">Played this course</span>, and drop
                it into Great, Fine, or Bad. GolfeR will handle the ordering from there.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={() => navigate('/discover')}
                  className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[hsl(var(--golfer-deep))]"
                >
                  Rate your first course
                </button>
                <button
                  onClick={() => navigate('/lists')}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white"
                >
                  Browse curated lists
                </button>
              </div>
            </>
          )}
        </div>

        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
          {[
            { label: 'Courses ranked', value: rankedCourseCount, icon: Medal },
            { label: 'Friends added', value: friends.length, icon: Users },
            { label: 'Curated lists', value: curatedPreviewLists.length, icon: ListChecks },
          ].map(({ label, value, icon: Icon }) => (
            <div
              key={label}
              className="rounded-xl border border-[hsl(var(--golfer-line))] bg-white p-3 shadow-[0_24px_60px_-48px_rgba(12,25,19,0.35)]"
            >
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[hsl(var(--golfer-mist))] text-[hsl(var(--golfer-deep))]">
                <Icon size={15} />
              </span>
              <p className="mt-2 text-xl text-[hsl(var(--golfer-deep))]">{value}</p>
              <p className="mt-0.5 text-xs text-[hsl(var(--golfer-deep-soft))]/[0.72]">{label}</p>
            </div>
          ))}
          <div className="rounded-xl border border-[hsl(var(--golfer-line))] bg-white p-3 shadow-[0_24px_60px_-48px_rgba(12,25,19,0.35)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[hsl(var(--golfer-deep-soft))]/[0.56]">
              Ranking mode
            </p>
            <p className="mt-2 text-base text-[hsl(var(--golfer-deep))]">
              {hasTrueRankingThreshold ? 'Full ratings unlocked' : 'Keep ranking to unlock ratings'}
            </p>
            <p className="mt-1 text-xs leading-5 text-[hsl(var(--golfer-deep-soft))]/[0.74]">
              {hasTrueRankingThreshold
                ? 'Your list now shows GolfeR ratings based on the order you have saved.'
                : 'Once you rank five courses, GolfeR turns that order into full numeric ratings.'}
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-2">
        <SectionHeader
          title="Jump back in"
          description="Everything you need to browse, rank, and compare without digging through menus."
        />
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          {quickLinks.map(({ title, description, path, icon: Icon }) => (
            <button
              key={title}
              onClick={() => navigate(path)}
              className="rounded-xl border border-[hsl(var(--golfer-line))] bg-white p-3 text-left shadow-[0_24px_60px_-48px_rgba(12,25,19,0.38)] transition hover:-translate-y-0.5"
            >
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[hsl(var(--golfer-mist))] text-[hsl(var(--golfer-deep))]">
                <Icon size={15} />
              </span>
              <h3 className="mt-2 text-sm font-semibold text-[hsl(var(--golfer-deep))]">{title}</h3>
              <p className="mt-1 text-xs leading-5 text-[hsl(var(--golfer-deep-soft))]/[0.74]">{description}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <SectionHeader
          title="Popular courses"
          description="A few of the places golfers keep coming back to, whether you are planning a trip or settling a group chat debate."
        />
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          {leadCourse ? <CourseCard course={leadCourse} variant="wide" /> : null}
          <div className="grid gap-2">
            {secondaryCourses.map((course) => (
              <CourseCard key={course.id} course={course} variant="compact" />
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-2">
        <SectionHeader
          title="Curated lists"
          description="Need a faster answer? Start with a hand-picked list and drill into the courses that fit the trip."
        />
        <div className="grid gap-3 lg:grid-cols-3">
          {curatedPreviewLists.map((list) => (
            <article
              key={list.id}
              className="rounded-xl border border-[hsl(var(--golfer-line))] bg-white p-3 shadow-[0_24px_60px_-48px_rgba(12,25,19,0.38)]"
            >
              <h3 className="text-base text-[hsl(var(--golfer-deep))]">{list.title}</h3>
              <p className="mt-1 text-xs leading-5 text-[hsl(var(--golfer-deep-soft))]/[0.74]">{list.description}</p>
              <div className="mt-3 space-y-2">
                {list.courses.slice(0, 3).map((course) => (
                  <button
                    key={course.id}
                    onClick={() => navigate(`/course/${course.id}`)}
                    className="flex w-full items-center gap-2 rounded-xl bg-[hsl(var(--golfer-cream))] p-2 text-left transition hover:bg-[hsl(var(--golfer-mist))]"
                  >
                    <img src={course.imageUrl} alt={course.name} className="h-9 w-9 rounded-lg object-cover" />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-card-foreground">{course.name}</p>
                      <p className="text-[10px] text-muted-foreground">{course.location}</p>
                    </div>
                  </button>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
