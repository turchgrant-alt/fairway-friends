import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppShell from "@/components/dashboard/AppShell";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { CourseRankingProvider } from "@/hooks/use-course-rankings";
import AuthPage from "./pages/AuthPage";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import OnboardingPage from "./pages/OnboardingPage";
import HomePage from "./pages/HomePage";
import DiscoverPage from "./pages/DiscoverPage";
import MapPage from "./pages/MapPage";
import CourseDetailPage from "./pages/CourseDetailPage";
import SubmitReviewPage from "./pages/SubmitReviewPage";
import RankingsPage from "./pages/RankingsPage";
import ProfilePage from "./pages/ProfilePage";
import UserProfilePage from "./pages/UserProfilePage";
import SavedListsPage from "./pages/SavedListsPage";
import NotificationsPage from "./pages/NotificationsPage";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AuthenticatedRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/auth" element={<Navigate to="/home" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route element={<AppShell />}>
        <Route path="/home" element={<HomePage />} />
        <Route path="/discover" element={<DiscoverPage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/course/:id" element={<CourseDetailPage />} />
        <Route path="/review/:courseId" element={<SubmitReviewPage />} />
        <Route path="/lists" element={<SavedListsPage />} />
        <Route path="/rankings" element={<RankingsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/user/:id" element={<UserProfilePage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,hsl(var(--golfer-mist))_0%,hsl(var(--golfer-cream))_18rem,hsl(var(--background))_60rem)]">
        <div className="rounded-[28px] border border-[hsl(var(--golfer-line))] bg-white px-8 py-6 text-center shadow-[0_24px_70px_-48px_rgba(12,25,19,0.35)]">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[hsl(var(--golfer-deep-soft))]/[0.58]">
            GolfeR
          </p>
          <p className="mt-3 text-lg text-[hsl(var(--golfer-deep))]">Resolving your session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="*" element={<AuthPage />} />
      </Routes>
    );
  }

  return <AuthenticatedRoutes />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CourseRankingProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </TooltipProvider>
      </CourseRankingProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
