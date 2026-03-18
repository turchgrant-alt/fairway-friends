import { useParams, useNavigate } from 'react-router-dom';
import { useCourseRecord } from '@/hooks/use-course-catalog';
import PageHeader from '@/components/dashboard/PageHeader';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export default function SubmitReviewPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { data: course, isLoading } = useCourseRecord(courseId);

  if (isLoading) return null;

  if (!course) return null;

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Reviews"
        title="Reviews are coming soon."
        description={`You can still rate and rank ${course.name} today. Written reviews will come back once the core GolfeR flow is in place.`}
        actions={
          <>
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--golfer-line))] bg-white px-4 py-3 text-sm font-medium text-[hsl(var(--golfer-deep))]"
            >
              <ArrowLeft size={16} /> Back
            </button>
            <button
              onClick={() => navigate(`/course/${course.id}`)}
              className="rounded-full bg-[hsl(var(--golfer-deep))] px-5 py-3 text-sm font-semibold text-white"
            >
              Return to course
            </button>
          </>
        }
      />

      <section className="rounded-[32px] border border-[hsl(var(--golfer-line))] bg-white p-8 shadow-[0_24px_70px_-48px_rgba(12,25,19,0.35)] sm:p-10">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <div>
            <h2 className="font-display text-3xl text-[hsl(var(--golfer-deep))]">What you can do right now</h2>
            <p className="mt-4 max-w-3xl text-sm leading-8 text-[hsl(var(--golfer-deep-soft))]/[0.74]">
              GolfeR is focused on helping you rate, rank, and save the courses that matter. Written reviews are
              planned, but the course page and ranking flow are the priority today.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                onClick={() => navigate(`/course/${course.id}`)}
                className="inline-flex items-center gap-2 rounded-full bg-[hsl(var(--golfer-deep))] px-5 py-3 text-sm font-semibold text-white"
              >
                Back to course <ArrowRight size={15} />
              </button>
              <button
                onClick={() => navigate('/discover')}
                className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--golfer-line))] bg-white px-5 py-3 text-sm font-medium text-[hsl(var(--golfer-deep))]"
              >
                Browse more courses
              </button>
            </div>
          </div>

          <div className="rounded-[24px] bg-[hsl(var(--golfer-cream))] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[hsl(var(--golfer-deep-soft))]/[0.56]">Course context</p>
            <img src={course.imageUrl} alt={course.name} className="mt-4 h-40 w-full rounded-[18px] object-cover" />
            <p className="mt-4 text-lg font-semibold text-card-foreground">{course.name}</p>
            <p className="mt-1 text-sm text-muted-foreground">{course.location}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
