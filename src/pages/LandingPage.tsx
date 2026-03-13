import { motion } from "framer-motion";
import {
  ArrowRight,
  BookmarkPlus,
  Compass,
  Map,
  MapPinned,
  Search,
  Sparkles,
  Star,
} from "lucide-react";
import { Link } from "react-router-dom";

import FeaturedCourseCard from "@/components/marketing/FeaturedCourseCard";
import SectionHeading from "@/components/marketing/SectionHeading";
import { Button } from "@/components/ui/button";
import { demoStats, featuredV1Courses, formatDemoDate } from "@/lib/demo-v1";

const featuredCourses = featuredV1Courses;

const steps = [
  {
    title: "Rate the rounds that actually mattered",
    description:
      "Score conditioning, vibe, value, and replayability in a way that feels opinionated instead of spreadsheet-flat.",
  },
  {
    title: "Build a living wishlist with your crew",
    description:
      "Save dream tracks, future buddy-trip stops, and public-access gems before they disappear into screenshots and group chats.",
  },
  {
    title: "Use the map when the trip gets real",
    description:
      "Switch from aspiration to planning with place-based discovery, local context, and trusted recs from golfers you know.",
  },
];

const productHighlights = [
  {
    icon: Star,
    title: "Thoughtful ratings",
    description:
      "Go beyond a single score with a layered system for layout, value, vibe, scenery, and replayability.",
    detail: "Built for strong opinions, not generic averages.",
  },
  {
    icon: BookmarkPlus,
    title: "Smart wishlists",
    description:
      "Keep track of bucket-list courses, next-trip contenders, and the places your group keeps sending each other.",
    detail: "Organize by trip, region, or who you want to play it with.",
  },
  {
    icon: MapPinned,
    title: "Map-led discovery",
    description:
      "Pan around a region, compare nearby options, and uncover the course worth adding to the itinerary.",
    detail: "Find what is close, what is beloved, and what fits the day.",
  },
];

const heroStats = [
  { label: "New York courses in catalog", value: demoStats.totalCourses.toString() },
  { label: "Completed states", value: demoStats.completedStates.toString() },
  { label: "Next refresh", value: formatDemoDate(demoStats.nextRefreshDueAt) },
];

const fadeInUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0 },
};

export default function LandingPage() {
  const heroCourse = featuredCourses[0];

  return (
    <div className="relative overflow-hidden bg-[hsl(var(--golfer-cream))] text-[hsl(var(--golfer-deep))]">
      <div className="absolute inset-x-0 top-0 h-[42rem] bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.26),_transparent_34%),radial-gradient(circle_at_80%_18%,_rgba(108,168,131,0.20),_transparent_28%),linear-gradient(180deg,_hsl(var(--golfer-surface))_0%,_hsl(var(--golfer-deep))_60%,_transparent_100%)]" />

      <header className="sticky top-0 z-50 border-b border-white/10 bg-[rgba(10,27,20,0.72)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
          <Link to="/" className="flex items-center gap-3 text-white">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/10 text-lg font-semibold">
              G
            </span>
            <div>
              <p className="font-display text-2xl leading-none">GolfeR</p>
              <p className="text-[10px] uppercase tracking-[0.32em] text-white/[0.55]">Course discovery</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 text-sm text-white/[0.74] md:flex">
            <a href="#how-it-works" className="transition hover:text-white">
              How it works
            </a>
            <a href="#featured-courses" className="transition hover:text-white">
              Featured courses
            </a>
            <a href="#features" className="transition hover:text-white">
              Why GolfeR
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Button
              asChild
              variant="ghost"
              className="hidden rounded-full px-5 text-white hover:bg-white/10 hover:text-white sm:inline-flex"
            >
              <Link to="/home">Open workspace</Link>
            </Button>
            <Button
              asChild
              className="rounded-full bg-white px-5 text-[hsl(var(--golfer-deep))] shadow-[0_18px_50px_-30px_rgba(255,255,255,0.75)] hover:bg-white/90"
            >
              <Link to="/discover">Open demo</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="relative isolate">
          <div className="mx-auto grid max-w-7xl gap-14 px-6 pb-24 pt-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(28rem,0.95fr)] lg:px-10 lg:pb-32 lg:pt-20">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="relative z-10"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.08] px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-white/[0.78] backdrop-blur-md">
                <Sparkles size={14} className="text-white" />
                New York v1 developer demo
              </div>

              <h1 className="mt-8 max-w-3xl text-5xl leading-[0.95] text-white sm:text-6xl lg:text-7xl">
                Find the golf courses people actually talk about after the round.
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-white/[0.72] sm:text-xl">
                GolfeR is now a cleaner course-discovery workspace: real New York course data, a calmer product shell,
                and just enough structure to build explore, lists, and course pages without fake social noise.
              </p>

              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <Button
                  asChild
                  size="lg"
                  className="h-12 rounded-full bg-white px-7 text-[hsl(var(--golfer-deep))] hover:bg-white/90"
                >
                  <Link to="/discover">
                    Open the demo
                    <ArrowRight />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="h-12 rounded-full border-white/[0.15] bg-white/[0.04] px-7 text-white hover:bg-white/[0.08] hover:text-white"
                >
                  <a href="#featured-courses">Browse featured courses</a>
                </Button>
              </div>

              <div className="mt-12 grid gap-4 sm:grid-cols-3">
                {heroStats.map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial="hidden"
                    animate="visible"
                    variants={fadeInUp}
                    transition={{ duration: 0.6, delay: 0.18 + index * 0.1 }}
                    className="rounded-[24px] border border-white/10 bg-white/[0.06] p-5 backdrop-blur-md"
                  >
                    <p className="text-3xl text-white sm:text-4xl">{stat.value}</p>
                    <p className="mt-2 text-sm leading-6 text-white/[0.66]">{stat.label}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 38 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="relative mx-auto w-full max-w-2xl lg:mx-0"
            >
              <div className="relative overflow-hidden rounded-[34px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.03))] p-4 shadow-[0_48px_120px_-52px_rgba(0,0,0,0.8)] backdrop-blur-xl">
                <div className="relative overflow-hidden rounded-[28px] bg-[hsl(var(--golfer-cream))]">
                  <img
                    src={heroCourse.imageUrl}
                    alt={heroCourse.name}
                    className="h-[26rem] w-full object-cover sm:h-[32rem]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[rgba(8,24,18,0.92)] via-[rgba(8,24,18,0.28)] to-transparent" />

                  <div className="absolute left-6 top-6 rounded-full border border-white/10 bg-white/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-[hsl(var(--golfer-deep-soft))] shadow-lg">
                    Editor pick
                  </div>

                  <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
                    <div className="flex items-center gap-2 text-sm text-white/70">
                      <Compass size={16} />
                      Real course record
                    </div>
                    <h2 className="mt-3 max-w-md text-3xl leading-tight text-white sm:text-4xl">{heroCourse.name}</h2>
                    <p className="mt-3 max-w-lg text-sm leading-7 text-white/70 sm:text-base">
                      A real New York course record inside the v1 catalog, ready to test structure, metadata handling,
                      and detail-page behavior as the state-by-state dataset grows.
                    </p>

                    <div className="mt-6 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-[20px] border border-white/10 bg-black/20 p-4 text-white">
                        <p className="text-xs uppercase tracking-[0.22em] text-white/45">Access</p>
                        <p className="mt-2 text-2xl capitalize">{heroCourse.accessType ?? heroCourse.type}</p>
                      </div>
                      <div className="rounded-[20px] border border-white/10 bg-black/20 p-4 text-white">
                        <p className="text-xs uppercase tracking-[0.22em] text-white/45">Best for</p>
                        <p className="mt-2 text-sm leading-6">{heroCourse.tags.slice(0, 2).join(" • ") || "Course structure"}</p>
                      </div>
                      <div className="rounded-[20px] border border-white/10 bg-black/20 p-4 text-white">
                        <p className="text-xs uppercase tracking-[0.22em] text-white/45">Last synced</p>
                        <p className="mt-2 text-base">{formatDemoDate(heroCourse.lastSyncedAt)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute -left-4 top-8 hidden rounded-[24px] border border-[hsl(var(--golfer-line))] bg-white/90 p-5 shadow-[0_35px_70px_-45px_rgba(12,25,19,0.5)] backdrop-blur-sm sm:block">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[hsl(var(--golfer-deep-soft))]/[0.64]">
                  Your next move
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[hsl(var(--golfer-mist))] text-[hsl(var(--golfer-deep))]">
                    <Search size={18} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-[hsl(var(--golfer-deep))]">Current coverage</p>
                    <p className="text-sm text-[hsl(var(--golfer-deep-soft))]/[0.70]">New York statewide catalog</p>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-6 -right-3 max-w-[18rem] rounded-[26px] border border-white/10 bg-[hsl(var(--golfer-surface))] p-5 text-white shadow-[0_38px_80px_-52px_rgba(0,0,0,0.95)] sm:right-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Dataset status</p>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/[0.74]">Monthly refresh</span>
                </div>
                <div className="mt-4 space-y-3">
                  <div className="rounded-[18px] bg-white/[0.05] p-3">
                    <p className="text-xs uppercase tracking-[0.22em] text-white/[0.5]">Website coverage</p>
                    <p className="mt-2 text-2xl">{demoStats.withWebsiteCount}</p>
                    <p className="mt-1 text-xs text-white/[0.58]">courses with a source website</p>
                  </div>
                  <div className="rounded-[18px] bg-white/[0.05] p-3">
                    <p className="text-xs uppercase tracking-[0.22em] text-white/[0.5]">Phone coverage</p>
                    <p className="mt-2 text-2xl">{demoStats.withPhoneCount}</p>
                    <p className="mt-1 text-xs text-white/[0.58]">courses with a source phone number</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section id="how-it-works" className="relative z-10 bg-[hsl(var(--golfer-cream))] py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-10">
            <SectionHeading
              eyebrow="How it works"
              title="Everything people already do for golf discovery, finally in one beautiful flow."
              description="Start with the courses you love, capture the ones you are chasing, and use GolfeR when you need a clear answer for what to play next."
            />

            <div className="mt-14 grid gap-6 lg:grid-cols-3">
              {steps.map((step, index) => (
                <motion.article
                  key={step.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.45, delay: index * 0.1 }}
                  className="rounded-[30px] border border-[hsl(var(--golfer-line))] bg-white p-8 shadow-[0_25px_70px_-50px_rgba(12,25,19,0.35)]"
                >
                  <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[hsl(var(--golfer-deep-soft))]/[0.55]">
                    0{index + 1}
                  </p>
                  <h3 className="mt-5 text-2xl leading-tight text-[hsl(var(--golfer-deep))]">{step.title}</h3>
                  <p className="mt-4 text-base leading-7 text-[hsl(var(--golfer-deep-soft))]/[0.78]">{step.description}</p>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        <section id="featured-courses" className="bg-[hsl(var(--golfer-deep))] py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-10">
            <SectionHeading
              eyebrow="Featured courses"
              title="A preview of the kind of places GolfeR helps you discover, compare, and save."
              description="These cards now pull from the real New York course catalog so the homepage still feels polished while staying grounded in the actual v1 data foundation."
              inverted
            />

            <div className="mt-14 grid gap-6 lg:grid-cols-3">
              {featuredCourses.map((course, index) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.5, delay: index * 0.08 }}
                >
                  <FeaturedCourseCard course={course} />
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section id="features" className="bg-[linear-gradient(180deg,hsl(var(--golfer-mist))_0%,hsl(var(--golfer-cream))_100%)] py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-10">
            <SectionHeading
              eyebrow="Why GolfeR"
              title="A product built around the three habits every golf group already has."
              description="Rate the round with nuance, save the courses that keep coming up, and use the map to turn inspiration into a real tee time."
            />

            <div className="mt-14 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
              <motion.article
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                className="overflow-hidden rounded-[34px] bg-[hsl(var(--golfer-surface))] p-8 text-white shadow-[0_40px_100px_-55px_rgba(0,0,0,0.85)] sm:p-10"
              >
                <div className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.24em] text-white/[0.56]">
                  <Map size={16} />
                  Discovery stack
                </div>
                <h3 className="mt-5 max-w-xl text-3xl leading-tight sm:text-4xl">
                  Stop bouncing between notes, screenshots, maps, and texts just to decide where to play.
                </h3>
                <p className="mt-5 max-w-2xl text-base leading-8 text-white/[0.72]">
                  GolfeR gives golf discovery a proper home. The interface is designed to feel editorial and social at
                  the same time, so your saved places, trusted opinions, and nearby options work together instead of
                  competing for attention.
                </p>

                <div className="mt-10 grid gap-4 sm:grid-cols-3">
                  {productHighlights.map((highlight) => {
                    const Icon = highlight.icon;

                    return (
                      <div key={highlight.title} className="rounded-[24px] border border-white/10 bg-white/[0.05] p-5">
                        <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white">
                          <Icon size={20} />
                        </span>
                        <h4 className="mt-5 text-xl">{highlight.title}</h4>
                        <p className="mt-3 text-sm leading-7 text-white/70">{highlight.description}</p>
                        <p className="mt-4 text-sm text-white/[0.48]">{highlight.detail}</p>
                      </div>
                    );
                  })}
                </div>
              </motion.article>

              <div className="grid gap-6">
                <motion.article
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  className="rounded-[30px] border border-[hsl(var(--golfer-line))] bg-white p-7 shadow-[0_24px_60px_-45px_rgba(12,25,19,0.4)]"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[hsl(var(--golfer-deep-soft))]/[0.55]">
                    Rating snapshot
                  </p>
                  <div className="mt-6 space-y-4">
                    {[
                      ["Layout", "9.7"],
                      ["Replayability", "9.9"],
                      ["Scenery", "10.0"],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <div className="flex items-center justify-between text-sm font-medium text-[hsl(var(--golfer-deep))]">
                          <span>{label}</span>
                          <span>{value}</span>
                        </div>
                        <div className="mt-2 h-2 rounded-full bg-[hsl(var(--golfer-mist))]">
                          <div className="h-full rounded-full bg-[hsl(var(--golfer-deep))]" style={{ width: `${Number(value) * 10}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.article>

                <motion.article
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ delay: 0.08 }}
                  className="rounded-[30px] border border-[hsl(var(--golfer-line))] bg-[hsl(var(--golfer-cream))] p-7 shadow-[0_24px_60px_-45px_rgba(12,25,19,0.28)]"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[hsl(var(--golfer-deep-soft))]/[0.55]">
                    Wishlist + map
                  </p>
                  <div className="mt-5 flex items-center justify-between rounded-[22px] bg-white p-4">
                    <div>
                      <p className="text-sm font-semibold text-[hsl(var(--golfer-deep))]">California coast trip</p>
                      <p className="mt-1 text-sm text-[hsl(var(--golfer-deep-soft))]/[0.70]">6 courses saved nearby</p>
                    </div>
                    <span className="rounded-full bg-[hsl(var(--golfer-mist))] px-3 py-1 text-xs font-medium text-[hsl(var(--golfer-deep))]">
                      Route ready
                    </span>
                  </div>
                  <div className="mt-5 rounded-[24px] bg-[hsl(var(--golfer-deep))] p-5 text-white">
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        "Pebble Beach",
                        "Pasatiempo",
                        "Spyglass Hill",
                        "Half Moon Bay",
                      ].map((name) => (
                        <div key={name} className="rounded-[18px] bg-white/[0.07] px-3 py-4 text-sm">
                          {name}
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.article>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[hsl(var(--golfer-line))] bg-white/80">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-10 lg:flex-row lg:items-center lg:justify-between lg:px-10">
          <div>
            <p className="font-display text-3xl text-[hsl(var(--golfer-deep))]">GolfeR</p>
            <p className="mt-2 max-w-md text-sm leading-7 text-[hsl(var(--golfer-deep-soft))]/[0.74]">
              A cleaner v1 home for real course discovery, structured data, and steady product iteration.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-5 text-sm text-[hsl(var(--golfer-deep-soft))]/[0.78]">
            <a href="#how-it-works" className="transition hover:text-[hsl(var(--golfer-deep))]">
              How it works
            </a>
            <a href="#featured-courses" className="transition hover:text-[hsl(var(--golfer-deep))]">
              Featured courses
            </a>
            <a href="#features" className="transition hover:text-[hsl(var(--golfer-deep))]">
              Features
            </a>
            <Link to="/discover" className="transition hover:text-[hsl(var(--golfer-deep))]">
              Open demo
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
