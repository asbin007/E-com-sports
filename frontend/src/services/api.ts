import axios, { type InternalAxiosRequestConfig } from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:1000/api/v1';

/**
 * The access token is kept in memory only. Anything written to localStorage or
 * sessionStorage can be read by any script that gets injected into the page,
 * and a stolen token works until it expires. The refresh token never reaches
 * JavaScript at all: it is an httpOnly cookie the browser attaches to
 * /api/v1/auth by itself, which is what lets a reload restore the session.
 */
let accessToken: string | null = null;

export const getAccessToken = (): string | null => accessToken;

export const setAccessToken = (token: string | null): void => {
  accessToken = token;
};

const api = axios.create({
  baseURL,
  // Required for the refresh cookie: send it on /auth calls and keep the
  // Set-Cookie that comes back.
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

let refreshInFlight: Promise<string | null> | null = null;

/**
 * Trade the refresh cookie for a fresh access token. Resolves to null when
 * there is no valid cookie — the ordinary anonymous case, not an error, so it
 * never rejects. Every caller shares one request: a screen that fires five
 * calls and collects five 401s must still only refresh once.
 */
export const refreshAccessToken = (): Promise<string | null> => {
  if (!refreshInFlight) {
    refreshInFlight = axios
      // Plain axios, not `api`: a 401 here must not re-enter the interceptor
      // below and start refreshing all over again.
      .post<{ token?: string }>(`${baseURL}/auth/refresh`, undefined, {
        withCredentials: true,
      })
      .then((response) => {
        setAccessToken(response.data.token ?? null);
        return accessToken;
      })
      .catch(() => {
        setAccessToken(null);
        return null;
      })
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
};

type RetriableRequest = InternalAxiosRequestConfig & { _retry?: boolean };

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as RetriableRequest | undefined;

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      // Captured before the refresh clears it: it tells a dead session apart
      // from a visitor who was never signed in.
      const hadSession = accessToken !== null;

      const newToken = await refreshAccessToken();
      if (newToken) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      }

      // Only bounce someone whose session actually expired. On the anonymous
      // boot there was no token to begin with, and redirecting then would
      // throw browsing visitors off public pages.
      if (hadSession && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
