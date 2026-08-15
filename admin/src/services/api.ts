import axios from 'axios';
import toast from 'react-hot-toast';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:1000/api/v1';

/**
 * Fired when a 401 comes back from a normal API call, meaning the stored token
 * is no longer good. AuthProvider listens for it and clears the session, which
 * lets the router move the operator to /login without a page reload — a hard
 * `window.location` redirect here would kill the toast before it ever painted.
 */
export const SESSION_EXPIRED_EVENT = 'auth:session-expired';

/**
 * A 401 from these endpoints is a rejected credential, not a dead session, so
 * it must never trigger the logout/redirect path — the caller renders its own
 * message and the login form has to survive long enough to show it.
 */
const CREDENTIAL_ENDPOINTS = ['/auth/login'];

export const api = axios.create({
  baseURL,
  // Without this an API that accepts the connection but never answers leaves
  // requests pending forever, and the app hangs on its loading spinner.
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const requestUrl: string = error.config?.url || '';
    const isCredentialCheck = CREDENTIAL_ENDPOINTS.some((path) => requestUrl.includes(path));
    const onLoginPage = window.location.pathname === '/login';

    // Only treat a 401 as an expired session when it is neither the login call
    // itself nor a request made from the login page. Everything else (a 500, a
    // timeout, a dropped connection, a 403) says nothing about the token and is
    // passed straight through to the caller.
    if (status === 401 && !isCredentialCheck && !onLoginPage) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Shared id so a screen firing several requests at once shows one toast.
      toast.error('Session expired, please sign in again', { id: 'session-expired' });
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    }

    return Promise.reject(error);
  }
);

export default api;
