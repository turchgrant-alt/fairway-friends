import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCourseById } from '@/lib/mock-data';
import { ArrowLeft, Star, Check, Camera } from 'lucide-react';

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
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <button onClick={() => navigate(-1)}><ArrowLeft size={20} className="text-foreground" /></button>
        <div className="flex-1">
          <h1 className="text-sm font-semibold text-foreground">Review</h1>
          <p className="text-xs text-muted-foreground">{course.name}</p>
        </div>
        <button onClick={handleSubmit} className="rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground">
          Submit
        </button>
      </div>

      <div className="space-y-6 px-4 pt-4">
        {/* Course ref */}
        <div className="flex items-center gap-3 rounded-lg bg-card p-3">
          <img src={course.imageUrl} alt={course.name} className="h-14 w-14 rounded-md object-cover" />
          <div>
            <p className="text-sm font-semibold text-card-foreground">{course.name}</p>
            <p className="text-xs text-muted-foreground">{course.location}</p>
          </div>
        </div>

        {/* Category ratings */}
        <div>
          <h2 className="font-display text-lg text-foreground">Rate this course</h2>
          <p className="text-xs text-muted-foreground">Tap to rate each category (1-10)</p>
          <div className="mt-3 space-y-3">
            {categories.map(cat => (
              <div key={cat} className="flex items-center gap-3">
                <span className="w-32 shrink-0 text-xs text-muted-foreground">{cat}</span>
                <div className="flex gap-1">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                    <button
                      key={n}
                      onClick={() => setRatings({ ...ratings, [cat]: n })}
                      className={`flex h-7 w-7 items-center justify-center rounded-md text-[10px] font-medium transition-colors ${
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

        {/* Written review */}
        <div>
          <h2 className="font-display text-lg text-foreground">Your take</h2>
          <input
            value={headline}
            onChange={e => setHeadline(e.target.value)}
            placeholder="Headline (e.g., 'Best public course I've ever played')"
            className="mt-3 w-full rounded-lg border border-input bg-card px-4 py-3 text-sm text-card-foreground outline-none focus:border-primary"
          />
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Share your experience..."
            rows={4}
            className="mt-3 w-full rounded-lg border border-input bg-card px-4 py-3 text-sm text-card-foreground outline-none focus:border-primary"
          />
        </div>

        {/* Pros & Cons */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Pros</label>
            <textarea value={pros} onChange={e => setPros(e.target.value)} placeholder="One per line" rows={3}
              className="mt-1 w-full rounded-lg border border-input bg-card px-3 py-2 text-xs text-card-foreground outline-none focus:border-primary" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Cons</label>
            <textarea value={cons} onChange={e => setCons(e.target.value)} placeholder="One per line" rows={3}
              className="mt-1 w-full rounded-lg border border-input bg-card px-3 py-2 text-xs text-card-foreground outline-none focus:border-primary" />
          </div>
        </div>

        {/* Best for tags */}
        <div>
          <label className="text-xs font-medium text-muted-foreground">Best for</label>
          <div className="mt-2 flex flex-wrap gap-2">
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

        {/* Quick questions */}
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-lg bg-card p-3">
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
          <div className="flex items-center justify-between rounded-lg bg-card p-3">
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

        {/* Photo upload */}
        <button className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border py-8 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary">
          <Camera size={18} /> Add Photos
        </button>
      </div>
    </div>
  );
}
