import { useEffect, useRef, useMemo } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';

import { getCurrentUser } from '@/services/api/auth';
import { useAuthStore } from '@/store/auth-store';

import { AuthPage } from './pages/auth-page';
import { DashboardLayout } from './pages/dashboard-layout';
import { HistoryPage } from './pages/history-page';
import { LandingPage } from './pages/landing-page';
import { InteractionsPage } from './pages/interactions-page';
import { MedicineSearchPage } from './pages/medicine-search-page';
import { OverviewPage } from './pages/overview-page';
import { PregnancySafetyPage } from './pages/pregnancy-safety-page';
import { ProfilePage } from './pages/profile-page';
import { SymptomsPage } from './pages/symptoms-page';
import { AdminPage } from './pages/admin-page';

function AuthBootstrap() {
  // Run hydration only once on mount — not on every token change.
  // Depending on accessToken would cause a re-run whenever clearSession fires.
  const { accessToken, refreshToken, authReady, setUser, clearSession, setAuthReady } = useAuthStore();
  const didHydrate = useRef(false);

  useEffect(() => {
    if (didHydrate.current) return;
    didHydrate.current = true;

    if (!accessToken && !refreshToken) {
      setAuthReady(true);
      return;
    }

    let mounted = true;

    async function hydrate() {
      try {
        const user = await getCurrentUser();
        if (mounted) setUser(user);
      } catch {
        if (mounted) {
          clearSession();
          toast.info('Your session expired. Please sign in again.');
        }
      } finally {
        if (mounted) setAuthReady(true);
      }
    }

    hydrate();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return authReady ? null : (
    <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
      <div className="space-y-4 text-center">
        <div className="mx-auto h-12 w-12 rounded-full border border-teal-200 bg-teal-50 p-2">
          <div className="h-full w-full animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
        </div>
        <p className="text-sm text-muted-foreground">Restoring your secure session...</p>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const authReady = useAuthStore((state) => state.authReady);

  if (!authReady) {
    return null;
  }

  if (!accessToken) {
    return <Navigate to="/auth/login" replace />;
  }

  return <>{children}</>;
}

function AdminOnlyRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((state) => state.user);
  const authReady = useAuthStore((state) => state.authReady);

  if (!authReady) {
    return null;
  }

  if (!user?.is_admin) {
    return <Navigate to="/app" replace />;
  }

  return <>{children}</>;
}

const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
};

const pageTransition = { duration: 0.22, ease: 'easeOut' as const };


function RouteTransitions() {
  const location = useLocation();
  const pageKey = useMemo(() => location.pathname, [location.pathname]);

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pageKey}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={pageTransition}
        style={{ minHeight: '100dvh' }}
      >
        <Routes location={location}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth/:mode?" element={<AuthPage />} />
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<OverviewPage />} />
            <Route path="medicines" element={<MedicineSearchPage />} />
            <Route path="symptoms" element={<SymptomsPage />} />
            <Route path="interactions" element={<InteractionsPage />} />
            <Route path="pregnancy" element={<PregnancySafetyPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="history" element={<HistoryPage />} />
            <Route
              path="admin"
              element={
                <AdminOnlyRoute>
                  <AdminPage />
                </AdminOnlyRoute>
              }
            />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

export function App() {
  return (
    <>
      <AuthBootstrap />
      <RouteTransitions />
    </>
  );
}