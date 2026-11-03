import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import api, { refreshAccessToken, setAccessToken } from "../services/api";
import { authService } from "../services/authService";

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const login = (newToken: string, newUser: User) => {
    // Memory only. The server already put the refresh token in an httpOnly
    // cookie, which is the part that has to survive a reload.
    setAccessToken(newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    // Clear the cookie server-side too, or the next reload would quietly sign
    // the user back in. Not awaited: the local session ends either way.
    api.post("/auth/logout").catch(() => {
      /* already signed out as far as this browser is concerned */
    });
    setAccessToken(null);
    setToken(null);
    setUser(null);
  };

  useEffect(() => {
    const initAuth = async () => {
      // The refresh cookie is the only thing that survives a reload. No valid
      // cookie means the visitor is anonymous — a normal state, not an error,
      // so nothing is logged and nothing is shown.
      const freshToken = await refreshAccessToken();
      if (freshToken) {
        try {
          const userData = await authService.getMe();
          setUser(userData);
          setToken(freshToken);
        } catch (error) {
          console.error("Failed to fetch user profile", error);
          setAccessToken(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, token, login, logout, isAuthenticated: !!user, isLoading }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
