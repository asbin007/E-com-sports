import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { isAxiosError } from 'axios';
import api, { SESSION_EXPIRED_EVENT, refreshAccessToken, setAccessToken } from '@/services/api';
import type { User } from '@/types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      // The httpOnly refresh cookie is the only thing that survives a reload.
      // No valid cookie means the operator is simply signed out, which is a
      // normal state and not an error worth surfacing.
      const freshToken = await refreshAccessToken();
      if (freshToken) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data.user);
          setToken(freshToken);
        } catch (err) {
          // Only a 401 proves the token is bad. A 500, a timeout or a network
          // blip says nothing about it, so keep the token and let the operator
          // retry instead of silently signing them out.
          if (isAxiosError(err) && err.response?.status === 401) {
            setAccessToken(null);
            setToken(null);
            setUser(null);
          }
        }
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);

  useEffect(() => {
    // The api interceptor has already cleared the in-memory token; mirror that
    // into state so the router can send the operator to /login without a page
    // reload.
    const handleSessionExpired = () => {
      setToken(null);
      setUser(null);
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    const { token: newToken, user: userData } = res.data;
    // Memory only. The server already put the refresh token in an httpOnly
    // cookie, which is the part that has to survive a reload.
    setAccessToken(newToken);
    setToken(newToken);
    setUser(userData);
  };

  const logout = () => {
    // Clear the cookie server-side too, or the next reload would quietly sign
    // the operator back in. Not awaited: the local session ends either way.
    api.post('/auth/logout').catch(() => {
      /* already signed out as far as this browser is concerned */
    });
    setAccessToken(null);
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isAuthenticated: !!user,
        // Signed in is not the same as allowed in: customer and delivery
        // accounts authenticate fine but must never reach the admin shell.
        isAdmin: user?.role === 'admin',
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
