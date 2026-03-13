import { useParams, useNavigate } from 'react-router-dom';
import { getCourseById } from '@/lib/course-data';
import PageHeader from '@/components/dashboard/PageHeader';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export default function SubmitReviewPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const course = getCourseById(courseId || '');

  if (!course) return null;

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Reviews"
        title="Review capture is paused in demo mode."
        description={`The route for ${course.name} still exists, but fake authors and mock submissions are turned off while the product focuses on real course ingestion and structure.`}
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
            <h2 className="font-display text-3xl text-[hsl(var(--golfer-deep))]">Why this is disabled for now</h2>
            <p className="mt-4 max-w-3xl text-sm leading-8 text-[hsl(var(--golfer-deep-soft))]/[0.74]">
              The previous version used pretend authors and mock review content to make the app feel busy. In this v1
              cleanup pass, review capture is deliberately out of the visible workflow so course data, discovery, and
              list structure stay easier to build and evaluate.
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
