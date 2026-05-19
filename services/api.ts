import {
    clearSession,
    getAccessToken,
    getRefreshToken,
    saveAccessToken,
    saveRefreshToken,
} from '@/services/sessionStorage';
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:5000';

type RetryConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

const baseConfig = {
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
};

export const rawApi = axios.create(baseConfig);
const api = axios.create(baseConfig);

api.interceptors.request.use(async (config) => {
  const token = await getAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

let refreshingPromise: Promise<string | null> | null = null;

const refreshAccessToken = async (): Promise<string | null> => {
  const refreshToken = await getRefreshToken();

  if (!refreshToken) {
    return null;
  }

  try {
    const response = await rawApi.post('/auth/refresh', {
      refresh_token: refreshToken,
    });

    const newAccessToken = response.data?.access_token as string | undefined;
    const newRefreshToken = response.data?.refresh_token as string | undefined;

    if (!newAccessToken) {
      return null;
    }

    await saveAccessToken(newAccessToken);

    if (newRefreshToken) {
      await saveRefreshToken(newRefreshToken);
    }

    return newAccessToken;
  } catch (error) {
    await clearSession();
    return null;
  }
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryConfig | undefined;

    if (!originalRequest || originalRequest._retry) {
      throw error;
    }

    if (error.response?.status !== 401) {
      throw error;
    }

    originalRequest._retry = true;

    if (!refreshingPromise) {
      refreshingPromise = refreshAccessToken().finally(() => {
        refreshingPromise = null;
      });
    }

    const refreshedToken = await refreshingPromise;

    if (!refreshedToken) {
      throw error;
    }

    originalRequest.headers.Authorization = `Bearer ${refreshedToken}`;
    return api(originalRequest);
  }
);

export default api;
