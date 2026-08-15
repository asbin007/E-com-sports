import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, User, ArrowRight, Loader, Eye, EyeOff } from "lucide-react";
import { authService } from "../services/authService";

const Register = () => {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await authService.register(formData);
      navigate("/verify-email", { state: { email: formData.email } });
    } catch (err: any) {
      setError(err.response?.data?.message || "Registration failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-4 flex items-center justify-center bg-primary relative overflow-hidden px-4">
      {/* Background */}
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
          <h2 className="text-2xl font-bold text-primary">Create Account</h2>
          <p className="text-tertiary text-sm mt-1">Join us for exclusive deals & new arrivals</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-sm text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-secondary mb-1.5">Full Name</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted w-4.5 h-4.5" />
              <input
                type="text"
                className="w-full pl-11 pr-4 py-3 bg-secondary border border-border-primary rounded-xl text-primary text-sm font-medium focus:border-accent focus:ring-2 focus:ring-accent/10 outline-none transition-all placeholder:text-muted"
                placeholder="John Doe"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary mb-1.5">Email</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted w-4.5 h-4.5" />
              <input
                type="email"
                className="w-full pl-11 pr-4 py-3 bg-secondary border border-border-primary rounded-xl text-primary text-sm font-medium focus:border-accent focus:ring-2 focus:ring-accent/10 outline-none transition-all placeholder:text-muted"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted w-4.5 h-4.5" />
              <input
                type={showPassword ? "text" : "password"}
                className="w-full pl-11 pr-11 py-3 bg-secondary border border-border-primary rounded-xl text-primary text-sm font-medium focus:border-accent focus:ring-2 focus:ring-accent/10 outline-none transition-all placeholder:text-muted"
                placeholder="Min 6 characters"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-primary transition-colors"
              >
                {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="terms" className="rounded accent-accent w-4 h-4" required />
            <label htmlFor="terms" className="text-sm text-tertiary">
              I agree to the Terms & Conditions
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent text-white py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-accent/20 hover:bg-accent-hover transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? <Loader className="w-5 h-5 animate-spin" /> : <>Create Account <ArrowRight className="w-4 h-4" /></>}
          </button>

          {/* Google */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border-primary"></div></div>
            <div className="relative flex justify-center text-xs"><span className="px-3 bg-card text-muted font-medium">Or</span></div>
          </div>

          <button
            type="button"
            onClick={() => (window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`)}
            className="w-full flex items-center justify-center gap-3 py-3 bg-secondary border border-border-primary rounded-xl hover:bg-surface-hover transition-all text-primary font-medium text-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Sign up with Google
          </button>

          <div className="text-center text-sm text-tertiary mt-4">
            Already have an account?{" "}
            <Link to="/login" className="text-accent font-bold hover:underline">Sign In</Link>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default Register;
