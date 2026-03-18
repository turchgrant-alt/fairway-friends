import { Compass, LayoutGrid, ListChecks, LogOut, MapPinned, Settings, UserCircle2 } from "lucide-react";
import { Link, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/home", label: "Home", icon: LayoutGrid },
  { path: "/discover", label: "Discover", icon: Compass },
  { path: "/map", label: "Map", icon: MapPinned },
  { path: "/lists", label: "Lists", icon: ListChecks },
  { path: "/profile", label: "Profile", icon: UserCircle2 },
];

function isActivePath(currentPath: string, itemPath: string) {
  return currentPath === itemPath || currentPath.startsWith(`${itemPath}/`);
}

export default function AppShell() {
  const location = useLocation();
  const { profile, user, signOut } = useAuth();
  const activeItem = navItems.find((item) => isActivePath(location.pathname, item.path));
  const identityLabel =
    profile?.display_name ?? profile?.username ?? user?.email ?? "GolfeR";

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,hsl(var(--golfer-mist))_0%,hsl(var(--golfer-cream))_18rem,hsl(var(--background))_60rem)]">
      <div className="absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.45),_transparent_28%),linear-gradient(180deg,rgba(9,28,20,0.96)_0%,rgba(16,44,31,0.88)_55%,transparent_100%)]" />

      <header className="sticky top-0 z-40 border-b border-white/10 bg-[rgba(9,28,20,0.82)] backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
          <div className="flex min-h-16 items-center justify-between gap-4 py-3">
            <div className="flex items-center gap-4">
              <Link to="/" className="flex items-center gap-3 text-white">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/10 text-lg font-semibold">
                  G
                </span>
                <div>
                  <p className="font-display text-2xl leading-none">GolfeR</p>
                  <p className="text-[10px] uppercase tracking-[0.32em] text-white/[0.56]">Course discovery</p>
                </div>
              </Link>

              <div className="hidden items-center gap-2 lg:flex">
                <div className="rounded-full border border-white/10 bg-white/[0.08] px-3 py-1.5 text-xs text-white/[0.72]">
                  {activeItem?.label ?? "Profile"}
                </div>
              </div>
            </div>

            <nav className="hidden items-center gap-2 xl:flex">
              {navItems.map(({ path, label, icon: Icon }) => {
                const active = isActivePath(location.pathname, path);

                return (
                  <Link
                    key={path}
                    to={path}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition",
                      active
                        ? "bg-white text-[hsl(var(--golfer-deep))] shadow-[0_20px_45px_-30px_rgba(255,255,255,0.85)]"
                        : "text-white/[0.72] hover:bg-white/[0.08] hover:text-white",
                    )}
                  >
                    <Icon size={16} />
                    {label}
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-2">
              <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm text-white/[0.82] lg:inline-flex">
                <span className="max-w-48 truncate">{identityLabel}</span>
              </div>
              <button
                onClick={() => {
                  void signOut();
                }}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-medium text-white/[0.8] transition hover:bg-white/[0.12] hover:text-white"
              >
                <LogOut size={15} />
                <span className="hidden sm:inline">Sign out</span>
              </button>
              <Link
                to="/settings"
                className={cn(
                  "inline-flex h-11 w-11 items-center justify-center rounded-full border transition",
                  isActivePath(location.pathname, "/settings")
                    ? "border-white bg-white text-[hsl(var(--golfer-deep))]"
                    : "border-white/10 bg-white/[0.06] text-white/[0.8] hover:bg-white/[0.12] hover:text-white",
                )}
              >
                <Settings size={18} />
              </Link>
            </div>
          </div>

          <nav className="flex gap-2 overflow-x-auto pb-4 xl:hidden">
            {navItems.map(({ path, label, icon: Icon }) => {
              const active = isActivePath(location.pathname, path);

              return (
                <Link
                  key={path}
                  to={path}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition",
                    active
                      ? "border-white bg-white text-[hsl(var(--golfer-deep))]"
                      : "border-white/10 bg-white/[0.06] text-white/[0.72] hover:bg-white/[0.12] hover:text-white",
                  )}
                >
                  <Icon size={16} />
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="relative z-10">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
