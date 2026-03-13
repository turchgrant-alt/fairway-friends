import { useNavigate } from 'react-router-dom';
import { ArrowRight, ListChecks } from 'lucide-react';

import PageHeader from '@/components/dashboard/PageHeader';
import { starterLists } from '@/lib/demo-v1';

export default function SavedListsPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Lists"
        title="Keep list structure, drop the fake social baggage."
        description="This page now shows lightweight starter lists powered by real course records, so the list UI stays useful without pretending there is a fully populated account system behind it."
        actions={
          <div className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--golfer-line))] bg-white px-4 py-3 text-sm font-medium text-[hsl(var(--golfer-deep))]">
            <ListChecks size={16} /> Demo starter lists
          </div>
        }
      />

      <section className="grid gap-5 lg:grid-cols-3">
        {starterLists.map((list) => (
          <article
            key={list.id}
            className="rounded-[30px] border border-[hsl(var(--golfer-line))] bg-white p-6 shadow-[0_24px_70px_-48px_rgba(12,25,19,0.35)]"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[hsl(var(--golfer-deep-soft))]/[0.56]">
              V1 list
            </p>
            <h2 className="mt-4 text-2xl text-[hsl(var(--golfer-deep))]">{list.title}</h2>
            <p className="mt-3 text-sm leading-7 text-[hsl(var(--golfer-deep-soft))]/[0.74]">{list.description}</p>
            <div className="mt-6 space-y-3">
              {list.courses.slice(0, 4).map((course) => (
                <button
                  key={course.id}
                  onClick={() => navigate(`/course/${course.id}`)}
                  className="flex w-full items-center gap-3 rounded-[20px] bg-[hsl(var(--golfer-cream))] p-3 text-left transition hover:bg-[hsl(var(--golfer-mist))]"
                >
                  <img src={course.imageUrl} alt={course.name} className="h-12 w-12 rounded-[14px] object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-card-foreground">{course.name}</p>
                    <p className="text-xs text-muted-foreground">{course.location}</p>
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={() => navigate('/discover')}
              className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-[hsl(var(--golfer-deep))]"
            >
              Continue exploring <ArrowRight size={14} />
            </button>
          </article>
        ))}
      </section>
    </div>
  );
}
