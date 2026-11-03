import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { Mail, Lock, User, ArrowRight, Loader, Eye, EyeOff } from "lucide-react";
import { authService } from "../services/authService";
import { getApiErrorMessage } from "../utils/apiError";

const LABEL = "mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-tertiary";
const INPUT =
  "w-full rounded-tag border-2 border-border-primary bg-card py-3 text-sm text-primary transition-all duration-snap ease-snap placeholder:text-muted focus:border-accent";
const BTN_PRIMARY =
  "flex w-full items-center justify-center gap-2 rounded-tag border-2 border-inverse bg-accent py-3 font-display text-xl uppercase leading-none tracking-[0.04em] text-inverse transition-all duration-snap ease-snap hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-accent-hover hover:shadow-hard active:translate-x-0 active:translate-y-0 active:shadow-none disabled:translate-x-0 disabled:translate-y-0 disabled:border-border-primary disabled:bg-secondary disabled:text-muted disabled:shadow-none";
const BTN_SECONDARY =
  "flex w-full items-center justify-center gap-3 rounded-tag border-2 border-inverse bg-transparent py-3 font-display text-lg uppercase leading-none tracking-[0.04em] text-primary transition-all duration-snap ease-snap hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard active:translate-x-0 active:translate-y-0 active:shadow-none";

const Register = () => {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const reduce = useReducedMotion();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await authService.register(formData);
      navigate("/verify-email", { state: { email: formData.email } });
    } catch (err) {
      setError(getApiErrorMessage(err, "Registration failed. Try again."));
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
          <h2 className="font-display text-[34px] font-semibold uppercase leading-none text-primary">Create Account</h2>
          <p className="mt-1 text-sm text-tertiary">
            Order boots, jerseys and team kit with COD, delivered all over Nepal.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-4 rounded-tag border-2 border-accent bg-card p-3 text-center text-sm font-bold text-accent"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-5">
          <div>
            <label htmlFor="register-username" className={LABEL}>Full Name</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
              <input
                id="register-username"
                type="text"
                className={`${INPUT} pl-11 pr-4`}
                placeholder="Your full name"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="register-email" className={LABEL}>Email</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
              <input
                id="register-email"
                type="email"
                className={`${INPUT} pl-11 pr-4`}
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="register-password" className={LABEL}>Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
              <input
                id="register-password"
                type={showPassword ? "text" : "password"}
                className={`${INPUT} pl-11 pr-12`}
                placeholder="Min 6 characters"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={6}
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

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="terms"
              className="h-5 w-5 rounded-tag accent-accent"
              required
            />
            <label htmlFor="terms" className="flex min-h-[44px] items-center text-sm text-tertiary">
              I agree to the Terms &amp; Conditions
            </label>
          </div>

          <button type="submit" disabled={loading} className={BTN_PRIMARY}>
            {loading ? <Loader className="h-5 w-5 animate-spin" /> : <>Create Account <ArrowRight className="h-4 w-4" /></>}
          </button>

          {/* Google */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="h-px w-full bg-border-primary" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-card px-3 text-[11px] font-bold uppercase tracking-[0.12em] text-tertiary">Or</span>
            </div>
          </div>

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
            Sign up with Google
          </button>

          <div className="mt-4 text-center text-sm text-tertiary">
            Already have an account?{" "}
            <Link to="/login" className="font-bold text-accent hover:underline">Sign In</Link>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default Register;
