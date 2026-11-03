import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { Mail, Lock, ArrowRight, Loader, Eye, EyeOff, ShieldAlert, MessageCircle } from "lucide-react";
import { authService } from "../services/authService";
import { useAuth } from "../context/AuthContext";
import { getApiErrorMessage, getApiErrorStatus } from "../utils/apiError";
import { whatsappUrl } from "../data/store";

const LABEL = "mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-tertiary";
const INPUT =
  "w-full rounded-tag border-2 border-border-primary bg-card py-3 text-sm text-primary transition-all duration-snap ease-snap placeholder:text-muted focus:border-accent";
const BTN_PRIMARY =
  "flex w-full items-center justify-center gap-2 rounded-tag border-2 border-inverse bg-accent py-3 font-display text-xl uppercase leading-none tracking-[0.04em] text-inverse transition-all duration-snap ease-snap hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-accent-hover hover:shadow-hard active:translate-x-0 active:translate-y-0 active:shadow-none disabled:translate-x-0 disabled:translate-y-0 disabled:border-border-primary disabled:bg-secondary disabled:text-muted disabled:shadow-none";
const BTN_SECONDARY =
  "flex w-full items-center justify-center gap-3 rounded-tag border-2 border-inverse bg-transparent py-3 font-display text-lg uppercase leading-none tracking-[0.04em] text-primary transition-all duration-snap ease-snap hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard active:translate-x-0 active:translate-y-0 active:shadow-none";

/** Only ever return to a path inside this site, never to an absolute URL. */
const safeRedirect = (value: string | null): string =>
  value && value.startsWith("/") && !value.startsWith("//") ? value : "/";

const Login = () => {
  const [searchParams] = useSearchParams();
  const redirectTo = safeRedirect(searchParams.get("redirect"));
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [locked, setLocked] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();
  const reduce = useReducedMotion();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setLocked(false);

    try {
      const data = await authService.login({ email, password });
      login(data.token, data.user, data.refreshToken);
      // Checkout sends people here with ?redirect=/checkout. Dropping them on
      // the home page with a full cart loses the sale.
      navigate(redirectTo, { replace: true });
    } catch (err) {
      const message = getApiErrorMessage(err, "Login failed. Please check your credentials.");
      if (message === "Please verify your email first") {
        navigate("/verify-email", { state: { email } });
        return;
      }
      if (getApiErrorStatus(err) === 423) {
        setLocked(true);
        return;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-4 flex items-center justify-center bg-primary px-4">
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.16, ease: [0.2, 0.7, 0.3, 1] }}
        className="w-full max-w-md rounded-card border-2 border-inverse bg-card p-8 sm:p-10"
      >
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-tag border-2 border-inverse bg-accent">
              <span className="font-display text-xl font-bold leading-none text-inverse">B</span>
            </div>
            <div>
              <span className="block font-display text-xl font-bold uppercase leading-none text-primary">Brothers</span>
              <span className="text-[11px] font-bold uppercase leading-none tracking-[0.12em] text-accent">Sports House</span>
            </div>
          </Link>
        </div>

        <div className="mb-8">
          <p className="eyebrow mb-2">Account</p>
          <h2 className="font-display text-[34px] font-semibold uppercase leading-none text-primary">Welcome Back</h2>
          <p className="mt-1 text-sm text-tertiary">Sign in to your account</p>
        </div>

        {locked && (
          <div className="mb-4 rounded-tag border-2 border-marigold bg-marigold-soft p-4 text-sm">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-marigold">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              Account temporarily locked
            </div>
            <p className="mt-1.5 leading-relaxed text-primary">
              Too many failed sign-in attempts. For your security this account is locked for
              {" "}<span className="font-bold tabular-nums">30 minutes</span>. Please try again after that.
            </p>
            <a
              href={whatsappUrl("Hi! I am locked out of my account and need help signing in.")}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-2 font-bold text-accent hover:underline"
            >
              <MessageCircle className="h-4 w-4" />
              Need help now? Message us on WhatsApp
            </a>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mb-4 rounded-tag border-2 border-accent bg-card p-3 text-center text-sm font-bold text-accent"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="login-email" className={LABEL}>Email</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
              <input
                id="login-email"
                type="email"
                className={`${INPUT} pl-11 pr-4`}
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="login-password" className={LABEL}>Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                className={`${INPUT} pl-11 pr-12`}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-0.5 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center text-muted transition-colors duration-snap ease-snap hover:text-primary"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className={BTN_PRIMARY}>
            {loading ? (
              <Loader className="h-5 w-5 animate-spin" />
            ) : (
              <>Sign In <ArrowRight className="h-4 w-4" /></>
            )}
          </button>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="h-px w-full bg-border-primary" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-card px-3 text-[11px] font-bold uppercase tracking-[0.12em] text-tertiary">
                Or continue with
              </span>
            </div>
          </div>

          {/* Google Login */}
          <button
            type="button"
            onClick={() => (window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`)}
            className={BTN_SECONDARY}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Sign in with Google
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-tertiary">
          Don't have an account?{" "}
          <Link to="/register" className="font-bold text-accent hover:underline">
            Create Account
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
