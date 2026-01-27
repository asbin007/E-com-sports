import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Loader, ArrowRight, Mail } from "lucide-react";
import { authService } from "../../services/authService";
import { useAuth } from "../../context/AuthContext";

const VerifyEmail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();

  // Get email from location state (redirected from login) or allow manual entry if missing
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
    <div className="min-h-screen pt-20 flex items-center justify-center bg-gray-50 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] bg-pink-200 rounded-full blur-[120px] opacity-50"></div>
      <div className="absolute bottom-[10%] left-[10%] w-[40%] h-[40%] bg-indigo-200 rounded-full blur-[120px] opacity-50"></div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/80 backdrop-blur-lg p-8 sm:p-12 rounded-3xl shadow-2xl w-full max-w-md border border-white/50 relative z-10"
      >
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Verify Your Email
          </h2>
          <p className="text-gray-500">
            Enter simple 6-digit code sent to your email
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-600 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-4 p-3 bg-green-100 text-green-600 rounded-lg text-sm text-center">
            {message}
          </div>
        )}

        <form onSubmit={handleVerifyOtp} className="space-y-6">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
              <Mail className="w-8 h-8 text-indigo-600" />
            </div>
          </div>

          {!location.state?.email && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                readOnly={!!location.state?.email}
                required
              />
            </div>
          )}

          {location.state?.email && (
            <div className="text-center text-sm font-medium text-gray-700 bg-gray-100 py-2 rounded-lg">
              Verifying for: <span className="text-indigo-600">{email}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
              One-Time Password
            </label>
            <input
              type="text"
              className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl text-center text-2xl tracking-widest font-bold focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
              placeholder="123456"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || otp.length < 6}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-[1.02] transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Verify & Login <CheckCircle className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500 mb-2">Didn't receive the code?</p>
          <button
            type="button"
            onClick={handleResendOtp}
            disabled={loading || resendCooldown > 0}
            className="text-indigo-600 font-bold hover:underline disabled:text-gray-400 disabled:no-underline"
          >
            {resendCooldown > 0
              ? `Resend available in ${resendCooldown}s`
              : "Resend OTP"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default VerifyEmail;
