import axios, { AxiosError } from 'axios';

import { API_BASE_URL } from '@/lib/constants';
import { useAuthStore } from '@/store/auth-store';
import type { ApiErrorShape, TokenPair } from '@/types/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let pendingRefresh: Promise<string | null> | null = null;

function normalizeError(error: unknown): string {
  if (axios.isAxiosError<ApiErrorShape>(error)) {
    if (!error.response) {
      return 'Cannot reach the API server. Start the backend with: uvicorn app.main:app --reload';
    }
    const detail = error.response?.data?.detail;
    if (typeof detail === 'string') return detail;
    if (detail && typeof detail === 'object' && 'message' in detail && detail.message) return detail.message;
    if (Array.isArray(detail) && detail[0]?.msg) return detail[0].msg;
    return error.response?.data?.message ?? error.message;
  }

  return error instanceof Error ? error.message : 'Something went wrong';
}

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorShape & { message?: string }>) => {
    const originalRequest = error.config as typeof error.config & { _retry?: boolean };

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = useAuthStore.getState().refreshToken;

      if (!refreshToken) {
        useAuthStore.getState().clearSession();
        return Promise.reject(new Error(normalizeError(error)));
      }

      if (!pendingRefresh) {
        pendingRefresh = api
          .post<TokenPair>('/auth/refresh', { refresh_token: refreshToken })
          .then((response) => {
            useAuthStore.getState().setSession(response.data, useAuthStore.getState().user);
            return response.data.access_token;
          })
          .catch((refreshError) => {
            useAuthStore.getState().clearSession();
            throw refreshError;
          })
          .finally(() => {
            pendingRefresh = null;
          });
      }

      const accessToken = await pendingRefresh;
      if (accessToken) {
        originalRequest.headers = originalRequest.headers ?? {};
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api.request(originalRequest);
      }
    }

    return Promise.reject(new Error(normalizeError(error)));
  },
);

export function getApiErrorMessage(error: unknown) {
  return normalizeError(error);
}