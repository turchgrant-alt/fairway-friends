import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCourseById } from '@/lib/course-data';
import PageHeader from '@/components/dashboard/PageHeader';
import { ArrowLeft, Check, Camera } from 'lucide-react';

const categories = [
  'Layout', 'Conditioning', 'Greens', 'Scenery', 'Difficulty', 'Pace of Play',
  'Value', 'Replayability', 'Practice Facilities', 'Clubhouse', 'Food & Drinks', 'Overall Vibe',
];

const bestForOptions = ['Bucket list', 'Buddy trip', 'Date round', 'Walking', 'Scenic', 'Value', 'Architecture lover', 'Challenging', 'Relaxing'];

export default function SubmitReviewPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const course = getCourseById(courseId || '');
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [headline, setHeadline] = useState('');
  const [body, setBody] = useState('');
  const [pros, setPros] = useState('');
  const [cons, setCons] = useState('');
  const [bestFor, setBestFor] = useState<string[]>([]);
  const [worthPrice, setWorthPrice] = useState<boolean | null>(null);
  const [playAgain, setPlayAgain] = useState<boolean | null>(null);

  if (!course) return null;

  const handleSubmit = () => {
    // Mock submit
    navigate(`/course/${courseId}`);
  };

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Write a review"
        title={`Share your take on ${course.name}`}
        description="Capture what mattered in the round so your future self and your friends can trust the recommendation later."
        actions={
          <>
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--golfer-line))] bg-white px-4 py-3 text-sm font-medium text-[hsl(var(--golfer-deep))]"
            >
              <ArrowLeft size={16} /> Back
            </button>
            <button onClick={handleSubmit} className="rounded-full bg-[hsl(var(--golfer-deep))] px-5 py-3 text-sm font-semibold text-white">
              Submit review
            </button>
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_22rem]">
        <div className="space-y-6">
        <div className="flex items-center gap-4 rounded-[28px] border border-[hsl(var(--golfer-line))] bg-white p-5 shadow-[0_24px_70px_-48px_rgba(12,25,19,0.35)]">
          <img src={course.imageUrl} alt={course.name} className="h-14 w-14 rounded-md object-cover" />
          <div>
            <p className="text-base font-semibold text-card-foreground">{course.name}</p>
            <p className="text-sm text-muted-foreground">{course.location}</p>
          </div>
        </div>

        <div className="rounded-[30px] border border-[hsl(var(--golfer-line))] bg-white p-6 shadow-[0_24px_70px_-48px_rgba(12,25,19,0.35)] sm:p-8">
          <h2 className="font-display text-2xl text-foreground">Rate this course</h2>
          <p className="mt-2 text-sm text-muted-foreground">Choose a score from 1 to 10 for the parts of the round you care about.</p>
          <div className="mt-6 space-y-4">
            {categories.map(cat => (
              <div key={cat} className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <span className="w-40 shrink-0 text-sm text-muted-foreground">{cat}</span>
                <div className="flex flex-wrap gap-1.5">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                    <button
                      key={n}
                      onClick={() => setRatings({ ...ratings, [cat]: n })}
                      className={`flex h-8 w-8 items-center justify-center rounded-lg text-[11px] font-medium transition-colors ${
                        (ratings[cat] || 0) >= n ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[30px] border border-[hsl(var(--golfer-line))] bg-white p-6 shadow-[0_24px_70px_-48px_rgba(12,25,19,0.35)] sm:p-8">
          <h2 className="font-display text-2xl text-foreground">Your take</h2>
          <input
            value={headline}
            onChange={e => setHeadline(e.target.value)}
            placeholder="Headline (e.g., 'Best public course I've ever played')"
            className="mt-5 w-full rounded-[18px] border border-input bg-card px-4 py-3 text-sm text-card-foreground outline-none focus:border-primary"
          />
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Share your experience..."
            rows={4}
            className="mt-3 w-full rounded-[18px] border border-input bg-card px-4 py-3 text-sm text-card-foreground outline-none focus:border-primary"
          />

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-[20px] bg-[hsl(var(--golfer-cream))] p-4">
            <label className="text-xs font-medium text-muted-foreground">Pros</label>
            <textarea value={pros} onChange={e => setPros(e.target.value)} placeholder="One per line" rows={3}
              className="mt-2 w-full rounded-[16px] border border-input bg-card px-3 py-2 text-xs text-card-foreground outline-none focus:border-primary" />
          </div>
          <div className="rounded-[20px] bg-[hsl(var(--golfer-cream))] p-4">
            <label className="text-xs font-medium text-muted-foreground">Cons</label>
            <textarea value={cons} onChange={e => setCons(e.target.value)} placeholder="One per line" rows={3}
              className="mt-2 w-full rounded-[16px] border border-input bg-card px-3 py-2 text-xs text-card-foreground outline-none focus:border-primary" />
          </div>
        </div>
        </div>

        <div className="rounded-[30px] border border-[hsl(var(--golfer-line))] bg-white p-6 shadow-[0_24px_70px_-48px_rgba(12,25,19,0.35)] sm:p-8">
          <label className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">Best for</label>
          <div className="mt-4 flex flex-wrap gap-2">
            {bestForOptions.map(tag => {
              const active = bestFor.includes(tag);
              return (
                <button
                  key={tag}
                  onClick={() => setBestFor(active ? bestFor.filter(t => t !== tag) : [...bestFor, tag])}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    active ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>
        </div>

        <aside className="space-y-6">
          <div className="space-y-3 rounded-[30px] border border-[hsl(var(--golfer-line))] bg-white p-6 shadow-[0_24px_70px_-48px_rgba(12,25,19,0.35)]">
          <div className="flex items-center justify-between rounded-[20px] bg-[hsl(var(--golfer-cream))] p-4">
            <span className="text-sm text-card-foreground">Worth the price?</span>
            <div className="flex gap-2">
              {[true, false].map(val => (
                <button key={String(val)} onClick={() => setWorthPrice(val)}
                  className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium ${
                    worthPrice === val ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
                  }`}>
                  {val ? <Check size={12} /> : null} {val ? 'Yes' : 'No'}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between rounded-[20px] bg-[hsl(var(--golfer-cream))] p-4">
            <span className="text-sm text-card-foreground">Would play again?</span>
            <div className="flex gap-2">
              {[true, false].map(val => (
                <button key={String(val)} onClick={() => setPlayAgain(val)}
                  className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium ${
                    playAgain === val ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
                  }`}>
                  {val ? <Check size={12} /> : null} {val ? 'Yes' : 'No'}
                </button>
              ))}
            </div>
          </div>
          </div>

          <button className="flex w-full items-center justify-center gap-2 rounded-[30px] border-2 border-dashed border-border bg-white py-16 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary">
            <Camera size={18} /> Add Photos
          </button>
        </aside>
      </div>
    </div>
  );
}
