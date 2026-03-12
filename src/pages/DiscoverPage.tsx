import { useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { courses, collections } from '@/lib/mock-data';
import CourseCard from '@/components/CourseCard';
import SectionHeader from '@/components/SectionHeader';

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
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="px-4 pt-4">
        <h1 className="font-display text-2xl text-foreground">Discover</h1>
        <div className="mt-3 flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search courses or locations..."
              className="w-full rounded-lg border border-input bg-card py-2.5 pl-9 pr-4 text-sm text-card-foreground outline-none focus:border-primary"
            />
            {query && (
              <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <X size={14} />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex h-10 w-10 items-center justify-center rounded-lg border transition-colors ${showFilters ? 'border-primary bg-primary/5' : 'border-input bg-card'}`}
          >
            <SlidersHorizontal size={16} className={showFilters ? 'text-primary' : 'text-muted-foreground'} />
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="mt-3 space-y-3 px-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Course Type</p>
            <div className="mt-2 flex flex-wrap gap-2">
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
            <p className="text-xs font-medium text-muted-foreground">Tags</p>
            <div className="mt-2 flex flex-wrap gap-2">
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
      )}

      {/* Collections (when no search) */}
      {!query && selectedType === 'All' && selectedTags.length === 0 && (
        <div className="mt-6">
          <SectionHeader title="Collections" />
          <div className="mt-3 flex gap-3 overflow-x-auto px-4 hide-scrollbar">
            {collections.map(col => (
              <button key={col.id} className="relative shrink-0 overflow-hidden rounded-xl" style={{ width: 160, height: 100 }}>
                <img src={col.imageUrl} alt={col.title} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-2.5">
                  <p className="text-xs font-semibold text-primary-foreground">{col.title}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      <div className="mt-6 px-4">
        <p className="mb-3 text-xs text-muted-foreground">{filtered.length} courses</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {filtered.map(course => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      </div>
    </div>
  );
}
