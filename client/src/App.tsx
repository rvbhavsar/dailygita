import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import Landing from "./pages/Landing";
import Onboarding from "./pages/Onboarding";
import Home from "./pages/Home";
import VerseDetail from "./pages/VerseDetail";
import Browse from "./pages/Browse";
import Challenges from "./pages/Challenges";
import ChallengeDetail from "./pages/ChallengeDetail";
import Favorites from "./pages/Favorites";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Auth loading wrapper
const AuthLoadingWrapper = ({ children }: { children: React.ReactNode }) => {
  const { isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return <>{children}</>;
};

// Protected route wrapper - requires auth AND onboarding
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isOnboarded } = useAuth();
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  if (!isOnboarded) {
    return <Navigate to="/onboarding" replace />;
  }
  
  return <>{children}</>;
};

// Auth route - redirect if already logged in
const AuthRoute = () => {
  const { user, isOnboarded } = useAuth();
  
  if (user) {
    return <Navigate to={isOnboarded ? "/home" : "/onboarding"} replace />;
  }
  
  return <Auth />;
};

// Landing route - redirect if already logged in
const LandingRoute = () => {
  const { user, isOnboarded } = useAuth();
  
  if (user) {
    return <Navigate to={isOnboarded ? "/home" : "/onboarding"} replace />;
  }
  
  return <Landing />;
};

// Onboarding route - requires auth, redirect if already onboarded
const OnboardingRoute = () => {
  const { user, isOnboarded } = useAuth();
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  if (isOnboarded) {
    return <Navigate to="/home" replace />;
  }
  
  return <Onboarding />;
};

const AppRoutes = () => {
  return (
    <AuthLoadingWrapper>
      <Routes>
        <Route path="/" element={<LandingRoute />} />
        <Route path="/auth" element={<AuthRoute />} />
        <Route path="/onboarding" element={<OnboardingRoute />} />
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/verse/:id"
          element={
            <ProtectedRoute>
              <VerseDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/browse"
          element={
            <ProtectedRoute>
              <Browse />
            </ProtectedRoute>
          }
        />
        <Route
          path="/challenges"
          element={
            <ProtectedRoute>
              <Challenges />
            </ProtectedRoute>
          }
        />
        <Route
          path="/challenges/:id"
          element={
            <ProtectedRoute>
              <ChallengeDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/favorites"
          element={
            <ProtectedRoute>
              <Favorites />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthLoadingWrapper>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>

            <AppRoutes />

        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
