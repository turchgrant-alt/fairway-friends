import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';

export default function SignupPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/onboarding');
  };

  return (
    <div className="min-h-screen bg-background px-6 pb-8 pt-4">
      <button onClick={() => navigate('/')} className="flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft size={18} /> Back
      </button>

      <div className="mt-12">
        <h1 className="font-display text-3xl text-foreground">Create your account</h1>
        <p className="mt-2 text-sm text-muted-foreground">Join the community of golfers who care about course quality.</p>
      </div>

      <form onSubmit={handleSignup} className="mt-8 space-y-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground">Full Name</label>
          <input
            type="text" value={name} onChange={e => setName(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-input bg-card px-4 py-3 text-sm text-card-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            placeholder="Your name"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Email</label>
          <input
            type="email" value={email} onChange={e => setEmail(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-input bg-card px-4 py-3 text-sm text-card-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            placeholder="you@email.com"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Password</label>
          <div className="relative mt-1.5">
            <input
              type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
              className="w-full rounded-lg border border-input bg-card px-4 py-3 pr-10 text-sm text-card-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="8+ characters"
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <button type="submit" className="w-full rounded-lg bg-primary py-3.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 active:scale-[0.99]">
          Create Account
        </button>
      </form>

      <div className="relative mt-8 flex items-center">
        <div className="flex-1 border-t border-border" />
        <span className="px-4 text-xs text-muted-foreground">or</span>
        <div className="flex-1 border-t border-border" />
      </div>

      <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-card py-3.5 text-sm font-medium text-card-foreground transition-colors hover:bg-secondary">
        <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
        Continue with Google
      </button>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <button onClick={() => navigate('/login')} className="font-semibold text-primary">Sign in</button>
      </p>
    </div>
  );
}
