import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, Check } from 'lucide-react';

const steps = [
  {
    title: 'Where do you play?',
    subtitle: 'We\'ll find courses near you',
    type: 'input' as const,
    field: 'location',
    placeholder: 'City, State',
  },
  {
    title: 'How often do you play?',
    subtitle: 'No judgment here',
    type: 'select' as const,
    field: 'frequency',
    options: ['A few times a year', '1-2 times a month', 'Weekly', 'Multiple times a week'],
  },
  {
    title: 'What\'s your handicap range?',
    subtitle: 'Helps us recommend the right courses',
    type: 'select' as const,
    field: 'handicap',
    options: ['Scratch or better (0-5)', 'Single digit (6-9)', 'Mid handicap (10-18)', 'High handicap (19-30)', 'I don\'t keep one'],
  },
  {
    title: 'What matters most to you?',
    subtitle: 'Pick your top 3',
    type: 'multi' as const,
    field: 'priorities',
    options: ['Course design', 'Conditioning', 'Scenery', 'Value', 'Difficulty', 'Pace of play', 'Practice facilities', 'Food & drinks', 'Walkability', 'Social vibe'],
  },
  {
    title: 'What\'s your budget per round?',
    subtitle: 'For a typical weekend round',
    type: 'select' as const,
    field: 'budget',
    options: ['Under $50', '$50-100', '$100-200', '$200+', 'Price doesn\'t matter'],
  },
  {
    title: 'What types of courses do you prefer?',
    subtitle: 'Pick all that apply',
    type: 'multi' as const,
    field: 'courseTypes',
    options: ['Public', 'Resort', 'Semi-private', 'Municipal', 'Links-style', 'Desert', 'Mountain', 'Coastal'],
  },
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});

  const current = steps[step];
  const progress = ((step + 1) / steps.length) * 100;

  const handleSelect = (value: string) => {
    if (current.type === 'multi') {
      const existing = (answers[current.field] as string[]) || [];
      const updated = existing.includes(value) ? existing.filter(v => v !== value) : [...existing, value];
      setAnswers({ ...answers, [current.field]: updated });
    } else {
      setAnswers({ ...answers, [current.field]: value });
      if (step < steps.length - 1) {
        setTimeout(() => setStep(step + 1), 200);
      }
    }
  };

  const canProceed = () => {
    const val = answers[current.field];
    if (!val) return false;
    if (Array.isArray(val) && val.length === 0) return false;
    return true;
  };

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      navigate('/home');
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background px-6 pb-8 pt-4">
      {/* Progress bar */}
      <div className="flex items-center gap-4">
        {step > 0 && (
          <button onClick={() => setStep(step - 1)} className="text-muted-foreground">
            <ArrowLeft size={20} />
          </button>
        )}
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-secondary">
          <motion.div className="h-full rounded-full bg-primary" animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
        </div>
        <span className="text-xs text-muted-foreground">{step + 1}/{steps.length}</span>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
          className="mt-10 flex-1"
        >
          <h1 className="font-display text-2xl text-foreground">{current.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{current.subtitle}</p>

          <div className="mt-8 space-y-3">
            {current.type === 'input' ? (
              <input
                value={(answers[current.field] as string) || ''}
                onChange={e => setAnswers({ ...answers, [current.field]: e.target.value })}
                placeholder={current.placeholder}
                className="w-full rounded-lg border border-input bg-card px-4 py-3.5 text-sm text-card-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            ) : (
              current.options?.map(option => {
                const isSelected = current.type === 'multi'
                  ? ((answers[current.field] as string[]) || []).includes(option)
                  : answers[current.field] === option;
                return (
                  <button
                    key={option}
                    onClick={() => handleSelect(option)}
                    className={`flex w-full items-center justify-between rounded-lg border px-4 py-3.5 text-left text-sm transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/5 font-medium text-foreground'
                        : 'border-border bg-card text-card-foreground hover:border-primary/30'
                    }`}
                  >
                    {option}
                    {isSelected && <Check size={16} className="text-primary" />}
                  </button>
                );
              })
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Continue button */}
      {(current.type === 'multi' || current.type === 'input') && (
        <button
          onClick={handleNext}
          disabled={!canProceed()}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3.5 text-sm font-semibold text-primary-foreground transition-opacity disabled:opacity-40"
        >
          {step === steps.length - 1 ? 'Get Started' : 'Continue'} <ArrowRight size={16} />
        </button>
      )}
    </div>
  );
}
