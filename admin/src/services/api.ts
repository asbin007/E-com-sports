import axios, { type InternalAxiosRequestConfig } from 'axios';
import toast from 'react-hot-toast';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:1000/api/v1';

/**
 * Fired when a 401 comes back from a normal API call and the refresh cookie
 * cannot save it, meaning the session is really gone. AuthProvider listens for
 * it and clears the session, which lets the router move the operator to /login
 * without a page reload — a hard `window.location` redirect here would kill
 * the toast before it ever painted.
 */
export const SESSION_EXPIRED_EVENT = 'auth:session-expired';

/**
 * A 401 from these endpoints is a rejected credential, not a dead session, so
 * it must never trigger the logout/redirect path — the caller renders its own
 * message and the login form has to survive long enough to show it.
 */
const CREDENTIAL_ENDPOINTS = ['/auth/login'];

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

export const api = axios.create({
  baseURL,
  // Without this an API that accepts the connection but never answers leaves
  // requests pending forever, and the app hangs on its loading spinner.
  timeout: 30000,
  // Required for the refresh cookie: send it on /auth calls and keep the
  // Set-Cookie that comes back.
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
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
 * there is no valid cookie — the ordinary signed-out case, not an error, so it
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
        timeout: 30000,
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
    const status = error.response?.status;
    const originalRequest = error.config as RetriableRequest | undefined;
    const requestUrl: string = originalRequest?.url || '';
    const isCredentialCheck = CREDENTIAL_ENDPOINTS.some((path) => requestUrl.includes(path));
    const onLoginPage = window.location.pathname === '/login';

    // Only treat a 401 as an expired session when it is neither the login call
    // itself nor a request made from the login page. Everything else (a 500, a
    // timeout, a dropped connection, a 403) says nothing about the token and is
    // passed straight through to the caller.
    if (status === 401 && !isCredentialCheck && !onLoginPage) {
      // The access token is short-lived, so a 401 is usually just expiry. Try
      // the refresh cookie once and replay the request before declaring the
      // session dead.
      if (originalRequest && !originalRequest._retry) {
        originalRequest._retry = true;
        const newToken = await refreshAccessToken();
        if (newToken) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      }

      setAccessToken(null);
      // Shared id so a screen firing several requests at once shows one toast.
      toast.error('Session expired, please sign in again', { id: 'session-expired' });
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    }

    return Promise.reject(error);
  }
);

export default api;
