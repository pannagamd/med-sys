import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { TokenPair, User } from '@/types/api';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  authReady: boolean;
  setSession: (payload: TokenPair, user?: User | null) => void;
  setUser: (user: User | null) => void;
  clearSession: () => void;
  setAuthReady: (ready: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      authReady: false,
      setSession: (payload, user = null) =>
        set({
          accessToken: payload.access_token,
          refreshToken: payload.refresh_token,
          user,
        }),
      setUser: (user) => set({ user }),
      clearSession: () => set({ accessToken: null, refreshToken: null, user: null, authReady: true }),
      setAuthReady: (ready) => set({ authReady: ready }),
    }),
    {
      name: 'medipulse-auth',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
      }),
    },
  ),
);

export const authSelectors = {
  isAuthenticated: () => Boolean(useAuthStore.getState().accessToken),
  getAccessToken: () => useAuthStore.getState().accessToken,
  getRefreshToken: () => useAuthStore.getState().refreshToken,
};