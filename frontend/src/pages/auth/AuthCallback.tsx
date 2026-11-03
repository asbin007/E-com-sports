import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { authService } from "../../services/authService";
import { Loader } from "lucide-react";

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const code = searchParams.get("code");
  // The code is single-use; StrictMode runs effects twice in dev, so guard.
  const exchanged = useRef(false);

  useEffect(() => {
    if (!code) {
      navigate("/login?error=no_token");
      return;
    }
    if (exchanged.current) return;
    exchanged.current = true;

    const finishLogin = async () => {
      let token: string;
      let refreshToken: string;
      try {
        ({ token, refreshToken } = await authService.exchangeCode(code));
      } catch {
        navigate("/login?error=validation_failed");
        return;
      }

      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL || "http://localhost:1000/api/v1"}/auth/me`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (response.ok) {
          const data = await response.json();
          login(token, data.user, refreshToken);
          navigate("/");
        } else {
          navigate("/login?error=validation_failed");
        }
      } catch {
        navigate("/login?error=connection_failed");
      }
    };

    finishLogin();
  }, [code, navigate, login]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary px-4">
      <div className="w-full max-w-sm rounded-card border-2 border-inverse bg-card p-8 text-center">
        <Loader className="mx-auto mb-4 h-10 w-10 animate-spin text-accent" aria-hidden="true" />
        <p className="eyebrow mb-2 justify-center">Signing in</p>
        <h2 className="font-display text-[29px] font-semibold uppercase leading-none text-primary">
          Authenticating
        </h2>
        <p className="mt-2 text-sm text-tertiary">Please wait while we log you in.</p>
      </div>
    </div>
  );
};

export default AuthCallback;
