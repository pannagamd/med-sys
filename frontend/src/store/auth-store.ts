import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { TokenPair, User } from '@/types/api';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;

  /**
   * When true (default), tokens are stored in localStorage and survive
   * browser restarts. When false, tokens are still stored so the current tab
   * works across refreshes, but AuthBootstrap will NOT restore the session
   * on the next cold page load (simulating "session only" behaviour).
   */
  rememberMe: boolean;

  // authReady is NOT persisted — it resets to false on every page load and is
  // set to true once the AuthBootstrap hydration resolves (success or failure).
  authReady: boolean;

  setSession: (payload: TokenPair, user?: User | null) => void;
  setUser: (user: User | null) => void;
  clearSession: () => void;
  setAuthReady: (ready: boolean) => void;
  setRememberMe: (remember: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      rememberMe: true, // opt-in to persistence by default
      authReady: false,

      setSession: (payload, user = null) =>
        set({
          accessToken: payload.access_token,
          refreshToken: payload.refresh_token,
          user,
        }),

      setUser: (user) => set({ user }),

      // clearSession wipes tokens and marks auth as ready (so the spinner hides
      // and the router can redirect to login). Also resets rememberMe so the
      // next login starts with a clean preference.
      clearSession: () =>
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
          authReady: true,
          rememberMe: true, // reset to default for the next login
        }),

      setAuthReady: (ready) => set({ authReady: ready }),
      setRememberMe: (remember) => set({ rememberMe: remember }),
    }),
    {
      name: 'medipulse-auth',
      // Persist tokens, user identity, and remember-me preference.
      // authReady is intentionally excluded — it must always start as false
      // on a fresh page load so AuthBootstrap can run its validation flow.
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
        rememberMe: state.rememberMe,
      }),
    },
  ),
);

export const authSelectors = {
  isAuthenticated: () => Boolean(useAuthStore.getState().accessToken),
  getAccessToken: () => useAuthStore.getState().accessToken,
  getRefreshToken: () => useAuthStore.getState().refreshToken,
};