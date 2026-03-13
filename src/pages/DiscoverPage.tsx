import { useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { courses } from '@/lib/course-data';
import { collections } from '@/lib/social-data';
import CourseCard from '@/components/CourseCard';
import SectionHeader from '@/components/SectionHeader';
import PageHeader from '@/components/dashboard/PageHeader';

const courseTypes = ['All', 'Public', 'Resort', 'Private', 'Municipal', 'Semi-Private'];
const tags = ['bucket-list', 'hidden-gem', 'ocean-views', 'desert', 'links-style', 'value', 'challenging', 'walkable'];

export default function DiscoverPage() {
  const [query, setQuery] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const filtered = courses.filter(c => {
    if (query && !c.name.toLowerCase().includes(query.toLowerCase()) && !c.location.toLowerCase().includes(query.toLowerCase())) return false;
    if (selectedType !== 'All' && c.type.toLowerCase() !== selectedType.toLowerCase()) return false;
    if (selectedTags.length > 0 && !selectedTags.some(t => c.tags.includes(t))) return false;
    return true;
  });

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Discovery"
        title="Search, filter, and compare courses with more room to think."
        description="Explore by location, course type, and the tags golfers actually use when they recommend a place to friends."
        actions={
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-3 text-sm font-medium transition ${
              showFilters
                ? 'border-[hsl(var(--golfer-deep))] bg-[hsl(var(--golfer-deep))] text-white'
                : 'border-[hsl(var(--golfer-line))] bg-white text-[hsl(var(--golfer-deep))]'
            }`}
          >
            <SlidersHorizontal size={16} />
            Filters
          </button>
        }
      />

      <section className="rounded-[32px] border border-[hsl(var(--golfer-line))] bg-white p-6 shadow-[0_24px_70px_-48px_rgba(12,25,19,0.35)] sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search courses or locations..."
              className="w-full rounded-full border border-input bg-[hsl(var(--golfer-cream))] py-3 pl-11 pr-4 text-sm text-card-foreground outline-none focus:border-primary"
            />
            {query && (
              <button onClick={() => setQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        <div className={`mt-6 grid gap-5 ${showFilters ? 'block' : 'hidden'} lg:grid lg:grid-cols-2`}>
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">Course Type</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {courseTypes.map(type => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    selectedType === type ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">Tags</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {tags.map(tag => {
                const active = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => setSelectedTags(active ? selectedTags.filter(t => t !== tag) : [...selectedTags, tag])}
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
      </section>

      {!query && selectedType === 'All' && selectedTags.length === 0 && (
        <section className="space-y-5">
          <SectionHeader
            title="Collections"
            description="Start with a mood or trip type, then drill down when you are ready to book."
          />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {collections.map(col => (
              <button key={col.id} className="relative overflow-hidden rounded-[28px] text-left shadow-[0_24px_60px_-48px_rgba(12,25,19,0.35)]">
                <img src={col.imageUrl} alt={col.title} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <p className="text-sm font-semibold text-primary-foreground">{col.title}</p>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-5">
        <SectionHeader
          title={query ? `Results for "${query}"` : 'Browse courses'}
          description={`${filtered.length} courses matching your current filters.`}
        />
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map(course => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      </section>
    </div>
  );
}
