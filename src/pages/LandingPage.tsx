import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Star, MapPin, Users } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-primary">
      {/* Hero */}
      <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 text-center">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, hsl(var(--gold) / 0.3) 0%, transparent 50%), 
                             radial-gradient(circle at 75% 75%, hsl(var(--sage) / 0.2) 0%, transparent 50%)`
          }} />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10"
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 px-4 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-gold" />
            <span className="text-xs font-medium tracking-wider text-primary-foreground/70">DISCOVER BETTER GOLF</span>
          </div>
          
          <h1 className="font-display text-5xl leading-[1.1] text-primary-foreground sm:text-6xl">
            Your golf courses,<br />
            <span className="text-gold">ranked.</span>
          </h1>
          
          <p className="mx-auto mt-5 max-w-sm text-base leading-relaxed text-primary-foreground/70">
            Rate, review, and discover golf courses with friends. Build your rankings. Find your next round.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              onClick={() => navigate('/signup')}
              className="flex items-center justify-center gap-2 rounded-full bg-gold px-6 py-3.5 text-sm font-semibold text-gold-foreground shadow-lg transition-all hover:shadow-xl active:scale-[0.98]"
            >
              Get Started <ArrowRight size={16} />
            </button>
            <button
              onClick={() => navigate('/login')}
              className="flex items-center justify-center gap-2 rounded-full border border-primary-foreground/20 px-6 py-3.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-foreground/5"
            >
              Sign In
            </button>
          </div>
        </motion.div>

        {/* Feature pills */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="relative z-10 mt-16 flex flex-wrap justify-center gap-3"
        >
          {[
            { icon: Star, text: 'Rate & Review' },
            { icon: MapPin, text: 'Discover Courses' },
            { icon: Users, text: 'Follow Friends' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2 rounded-full bg-primary-foreground/10 px-4 py-2 backdrop-blur-sm">
              <Icon size={14} className="text-gold" />
              <span className="text-xs font-medium text-primary-foreground/80">{text}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
