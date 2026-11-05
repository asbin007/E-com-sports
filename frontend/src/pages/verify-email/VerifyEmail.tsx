import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { CheckCircle, Loader, Mail } from "lucide-react";
import { authService } from "../../services/authService";
import { useAuth } from "../../context/AuthContext";
import { getApiErrorMessage } from "../../utils/apiError";

const LABEL = "mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-tertiary";
const INPUT =
  "w-full rounded-tag border-2 border-border-primary bg-card px-4 py-3 text-sm text-primary transition-all duration-snap ease-snap placeholder:text-muted focus:border-accent";
const BTN_PRIMARY =
  "flex w-full items-center justify-center gap-2 rounded-tag border-2 border-inverse bg-accent py-3 font-display text-xl uppercase leading-none tracking-[0.04em] text-inverse transition-all duration-snap ease-snap hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-accent-hover hover:shadow-hard active:translate-x-0 active:translate-y-0 active:shadow-none disabled:translate-x-0 disabled:translate-y-0 disabled:border-border-primary disabled:bg-secondary disabled:text-muted disabled:shadow-none";

const VerifyEmail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const reduce = useReducedMotion();

  // Get email from location state (redirected from login/register) or allow manual entry if missing
  const [email, setEmail] = useState(location.state?.email || "");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Email is required.");
      return;
    }
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const data = await authService.verifyOtp({ email, otp });
      login(data.token, data.user);
      navigate("/");
    } catch (err) {
      setError(
        getApiErrorMessage(err, "Invalid OTP. Please check code."),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!email) {
      setError("Email is required to resend OTP.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      await authService.resendOtp(email);
      setMessage("A new OTP has been sent to your email.");
      setResendCooldown(60);
      const timer = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setError(
        getApiErrorMessage(err, "Failed to resend OTP. Try again later."),
      );
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
          <p className="eyebrow mb-2">Verification</p>
          <h2 className="font-display text-[34px] font-semibold uppercase leading-none text-primary">Verify Your Email</h2>
          <p className="mt-1 text-sm text-tertiary">
            Enter the 6-digit code sent to your email
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

        {message && (
          <div
            role="status"
            className="mb-4 rounded-tag border-2 border-pitch bg-card p-3 text-center text-sm font-bold text-pitch"
          >
            {message}
          </div>
        )}

        <form onSubmit={handleVerifyOtp} className="space-y-5">
          <div className="mb-4 flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-tag border-2 border-inverse bg-sale-soft">
              <Mail className="h-7 w-7 text-sale" aria-hidden="true" />
            </div>
          </div>

          {!location.state?.email && (
            <div>
              <label htmlFor="verify-email" className={LABEL}>
                Email Address
              </label>
              <input
                id="verify-email"
                type="email"
                className={INPUT}
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          )}

          {location.state?.email && (
            <div className="rounded-tag border-2 border-border-primary bg-secondary py-2.5 text-center text-sm text-primary">
              Verifying for: <span className="font-bold text-accent">{email}</span>
            </div>
          )}

          <div>
            <label htmlFor="verify-otp" className={`${LABEL} text-center`}>
              One-Time Password
            </label>
            <input
              id="verify-otp"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              autoFocus
              className="w-full rounded-tag border-2 border-border-primary bg-card px-4 py-4 text-center font-display text-3xl font-semibold leading-none tracking-[0.4em] tabular-nums text-primary transition-all duration-snap ease-snap placeholder:text-muted focus:border-accent"
              placeholder="000000"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || otp.length < 6}
            className={`${BTN_PRIMARY} disabled:cursor-not-allowed`}
          >
            {loading ? (
              <Loader className="h-5 w-5 animate-spin" />
            ) : (
              <>
                Verify &amp; Login <CheckCircle className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="mb-1 text-sm text-tertiary">Didn't receive the code?</p>
          <button
            type="button"
            onClick={handleResendOtp}
            disabled={loading || resendCooldown > 0}
            className="inline-flex min-h-[44px] items-center justify-center px-2 text-sm font-bold text-accent tabular-nums hover:underline disabled:text-muted disabled:no-underline"
          >
            {resendCooldown > 0
              ? `Resend available in ${resendCooldown}s`
              : "Resend OTP"}
          </button>
        </div>

        <div className="mt-8 text-center text-sm text-tertiary">
          Wrong email?{" "}
          <Link to="/register" className="font-bold text-accent hover:underline">
            Create a new account
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default VerifyEmail;
