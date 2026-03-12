import { Home, Search, MapPin, List, User } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const tabs = [
  { path: '/home', icon: Home, label: 'Home' },
  { path: '/discover', icon: Search, label: 'Discover' },
  { path: '/map', icon: MapPin, label: 'Map' },
  { path: '/lists', icon: List, label: 'Lists' },
  { path: '/profile', icon: User, label: 'Profile' },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-lg safe-bottom">
      <div className="mx-auto flex max-w-lg items-center justify-around px-2 py-1">
        {tabs.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname.startsWith(path);
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className="relative flex flex-col items-center gap-0.5 px-3 py-2"
            >
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute -top-1 h-0.5 w-6 rounded-full bg-primary"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <Icon
                size={22}
                className={isActive ? 'text-primary' : 'text-muted-foreground'}
                strokeWidth={isActive ? 2.5 : 1.8}
              />
              <span
                className={`text-[10px] font-medium ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
