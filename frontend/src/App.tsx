import { useEffect, useRef, useMemo, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import { ShieldCheck, WifiOff, RefreshCw } from 'lucide-react';

import { getCurrentUser } from '@/services/api/auth';
import { getProfile } from '@/services/api/profile';
import { useAuthStore } from '@/store/auth-store';
import { useProfileStore } from '@/store/profile-store';
import { ProfileCompletionGuard } from '@/components/layout/ProfileCompletionGuard';

import { AuthPage } from './pages/auth-page';
import { DashboardLayout } from './pages/dashboard-layout';
import { HistoryPage } from './pages/history-page';
import { LandingPage } from './pages/landing-page';
import { InteractionsPage } from './pages/interactions-page';
import { MedicineSearchPage } from './pages/medicine-search-page';
import { OverviewPage } from './pages/overview-page';
import { ProfilePage } from './pages/profile-page';
import { SymptomsPage } from './pages/symptoms-page';
import { AdminPage } from './pages/admin-page';

// ── Module-level hydration flag ───────────────────────────────────────────────
// Using a module-level variable (not a React ref) guarantees hydration runs
// exactly ONCE per page load, even under React 18 Strict Mode's double-invoke
// behaviour. A ref inside the component resets when React remounts the tree
// during Strict Mode's simulate-unmount-remount cycle, which was the original
// cause of the infinite spinner.
let _hydrationStarted = false;

// ── Status labels shown progressively during session restore ─────────────────
const STATUS_LABELS = [
  { after: 0,     text: 'Restoring your secure session…' },
  { after: 4_000, text: 'Connecting to server…' },
  { after: 9_000, text: 'Server is waking up, this may take a moment…' },
  { after: 14_000, text: 'Still connecting — almost there…' },
];

// ── AuthBootstrap ─────────────────────────────────────────────────────────────
function AuthBootstrap() {
  const { accessToken, refreshToken, authReady, setUser, clearSession, setAuthReady } = useAuthStore();
  const { setProfile, setProfileLoaded } = useProfileStore();

  // Status text shown while the spinner is visible
  const [statusText, setStatusText] = useState(STATUS_LABELS[0].text);
  // Whether the safety-timeout fired (backend unreachable)
  const [timedOut, setTimedOut] = useState(false);

  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    // ── Guard: only hydrate once per page load ────────────────────────────────
    if (_hydrationStarted) return;
    _hydrationStarted = true;

    // ── Fast-path: no tokens stored → ready immediately ───────────────────────
    // We read from the store AFTER Zustand-persist has rehydrated from
    // localStorage. By the time the first useEffect fires, the persist
    // middleware has already synchronously restored state, so this read is safe.
    const { accessToken: storedAccess, refreshToken: storedRefresh } =
      useAuthStore.getState();

    if (!storedAccess && !storedRefresh) {
      setAuthReady(true);
      setProfileLoaded(true);
      return;
    }

    // ── Progressive status messages ───────────────────────────────────────────
    STATUS_LABELS.slice(1).forEach(({ after, text }) => {
      const id = window.setTimeout(() => setStatusText(text), after);
      timersRef.current.push(id);
    });

    // ── Hard safety timeout ───────────────────────────────────────────────────
    // If the backend never responds (Render cold-boot > 30 s, network down,
    // etc.) unblock the UI so the user isn't stuck forever.
    const safetyId = window.setTimeout(() => {
      const state = useAuthStore.getState();
      if (!state.authReady) {
        setTimedOut(true);
        state.clearSession();
        setAuthReady(true);
        setProfileLoaded(true);
      }
    }, 20_000);
    timersRef.current.push(safetyId);

    function clearAllTimers() {
      timersRef.current.forEach(window.clearTimeout);
      timersRef.current = [];
    }

    // ── Hydration ─────────────────────────────────────────────────────────────
    async function hydrate() {
      // Step 1 — Restore user. setAuthReady fires in finally so the spinner
      //          hides as soon as we know whether the session is valid or not,
      //          without waiting for the profile fetch.
      try {
        const user = await getCurrentUser();
        setUser(user);
      } catch {
        // Token expired / server error → clear and show login
        clearSession();
        toast.info('Your session expired. Please sign in again.');
      } finally {
        // Always unblock the main UI here.
        clearAllTimers();
        setAuthReady(true);
      }

      // Step 2 — Fetch profile (non-blocking for auth-ready signal).
      try {
        const profile = await getProfile();
        setProfile(profile);
      } catch {
        setProfile(null);
      } finally {
        setProfileLoaded(true);
      }
    }

    hydrate();

    // Cleanup: cancel timers if the component ever unmounts (e.g. HMR).
    return clearAllTimers;

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────
  if (authReady) return null;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground gap-6 px-4">
      {timedOut ? (
        /* Timed-out state — shown briefly before clearSession triggers authReady */
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-rose-200 bg-rose-50">
            <WifiOff className="h-6 w-6 text-rose-500" />
          </div>
          <p className="text-sm font-medium text-slate-700">Could not reach the server.</p>
          <p className="text-xs text-slate-500">Redirecting to login…</p>
        </div>
      ) : (
        /* Normal loading state with progressive messages */
        <div className="flex flex-col items-center gap-5 text-center">
          {/* Animated spinner */}
          <div className="relative flex h-14 w-14 items-center justify-center">
            <div className="absolute inset-0 rounded-full border-2 border-teal-100" />
            <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-teal-500" />
            <ShieldCheck className="h-6 w-6 text-teal-600" />
          </div>

          {/* Status text — animates between messages */}
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-700 transition-all duration-500">
              {statusText}
            </p>
            <p className="text-xs text-slate-400">
              Validating your credentials securely
            </p>
          </div>

          {/* Slow-connection hint */}
          <div className="mt-2 flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs text-slate-500 shadow-sm">
            <RefreshCw className="h-3 w-3 animate-spin" style={{ animationDuration: '3s' }} />
            Encrypted session handshake in progress
          </div>
        </div>
      )}
    </div>
  );
}

// ── ProtectedRoute ─────────────────────────────────────────────────────────────
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const authReady = useAuthStore((state) => state.authReady);

  // Still hydrating — render nothing (AuthBootstrap shows the spinner)
  if (!authReady) return null;

  // Auth done but no valid token → redirect to login
  if (!accessToken) return <Navigate to="/auth/login" replace />;

  return <>{children}</>;
}

// ── AdminOnlyRoute ─────────────────────────────────────────────────────────────
function AdminOnlyRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((state) => state.user);
  const authReady = useAuthStore((state) => state.authReady);

  if (!authReady) return null;
  if (!user?.is_admin) return <Navigate to="/app" replace />;

  return <>{children}</>;
}

// ── Page transition config ─────────────────────────────────────────────────────
const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -6 },
};
const pageTransition = { duration: 0.22, ease: 'easeOut' as const };

// ── RouteTransitions ───────────────────────────────────────────────────────────
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
            <Route
              path="medicines"
              element={
                <ProfileCompletionGuard>
                  <MedicineSearchPage />
                </ProfileCompletionGuard>
              }
            />
            <Route
              path="symptoms"
              element={
                <ProfileCompletionGuard>
                  <SymptomsPage />
                </ProfileCompletionGuard>
              }
            />
            <Route
              path="interactions"
              element={
                <ProfileCompletionGuard>
                  <InteractionsPage />
                </ProfileCompletionGuard>
              }
            />
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

// ── App root ───────────────────────────────────────────────────────────────────
export function App() {
  return (
    <>
      <AuthBootstrap />
      <RouteTransitions />
    </>
  );
}