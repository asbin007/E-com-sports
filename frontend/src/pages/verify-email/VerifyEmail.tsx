import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle, Loader, Mail } from "lucide-react";
import { authService } from "../../services/authService";
import { useAuth } from "../../context/AuthContext";

const VerifyEmail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();

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
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Invalid OTP. Please check code.",
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
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Failed to resend OTP. Try again later.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-4 flex items-center justify-center bg-primary relative overflow-hidden px-4">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-[120px] translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/5 rounded-full blur-[120px] -translate-x-1/2 translate-y-1/2"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card backdrop-blur-lg p-8 sm:p-10 rounded-2xl shadow-xl w-full max-w-md border border-border-primary relative z-10"
      >
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center">
              <span className="text-white font-black text-lg italic">B</span>
            </div>
            <div>
              <span className="text-lg font-black text-primary tracking-tight uppercase italic leading-none block">Brothers</span>
              <span className="text-[8px] font-bold text-accent uppercase tracking-[0.2em] leading-none">Sports House</span>
            </div>
          </Link>
        </div>

        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-primary">Verify Your Email</h2>
          <p className="text-tertiary text-sm mt-1">
            Enter the 6-digit code sent to your email
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-sm text-center font-medium">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-500 rounded-xl text-sm text-center font-medium">
            {message}
          </div>
        )}

        <form onSubmit={handleVerifyOtp} className="space-y-5">
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 bg-accent/10 rounded-2xl flex items-center justify-center">
              <Mail className="w-7 h-7 text-accent" />
            </div>
          </div>

          {!location.state?.email && (
            <div>
              <label className="block text-sm font-medium text-secondary mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                className="w-full px-4 py-3 bg-secondary border border-border-primary rounded-xl text-primary text-sm font-medium focus:border-accent focus:ring-2 focus:ring-accent/10 outline-none transition-all placeholder:text-muted"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          )}

          {location.state?.email && (
            <div className="text-center text-sm font-medium text-secondary bg-secondary border border-border-primary py-2.5 rounded-xl">
              Verifying for: <span className="text-accent font-bold">{email}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-secondary mb-1.5 text-center">
              One-Time Password
            </label>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              autoFocus
              className="w-full px-4 py-4 bg-secondary border border-border-primary rounded-xl text-center text-2xl tracking-[0.5em] font-bold text-primary focus:border-accent focus:ring-2 focus:ring-accent/10 outline-none transition-all placeholder:text-muted"
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
            className="w-full bg-accent text-white py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-accent/20 hover:bg-accent-hover hover:shadow-accent/30 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Verify & Login <CheckCircle className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-tertiary mb-1">Didn't receive the code?</p>
          <button
            type="button"
            onClick={handleResendOtp}
            disabled={loading || resendCooldown > 0}
            className="text-accent font-bold text-sm hover:underline disabled:text-muted disabled:no-underline"
          >
            {resendCooldown > 0
              ? `Resend available in ${resendCooldown}s`
              : "Resend OTP"}
          </button>
        </div>

        <div className="mt-8 text-center text-sm text-tertiary">
          Wrong email?{" "}
          <Link to="/register" className="text-accent font-bold hover:underline">
            Create a new account
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default VerifyEmail;
