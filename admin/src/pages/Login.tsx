import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Dumbbell, Loader, Eye, EyeOff, Lock } from 'lucide-react';

interface LoginError {
  kind: 'rejected' | 'locked';
  message: string;
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<LoginError | null>(null);

  // Where a protected route sent them before bouncing here. Only same-origin
  // paths are honoured so a crafted ?next= cannot redirect off the app.
  const requestedPath = searchParams.get('next');
  const redirectTo =
    requestedPath && requestedPath.startsWith('/') && !requestedPath.startsWith('//')
      ? requestedPath
      : '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      navigate(redirectTo, { replace: true });
    } catch (err: any) {
      // 423 is the backend's lockout after 5 failed attempts — a different
      // problem from a wrong password, and retrying will not help.
      if (err.response?.status === 423) {
        setError({
          kind: 'locked',
          message:
            'Too many failed attempts. This account is locked for 30 minutes — try again after that.',
        });
      } else {
        setError({
          kind: 'rejected',
          message: err.response?.data?.message || 'Login failed. Check your credentials.',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Dumbbell className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Brothers Sports House</h1>
          <p className="text-sm text-gray-500 mt-1">Admin Panel</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          {error && (
            <div
              className={`p-3 border rounded-lg text-sm flex items-start gap-2 ${
                error.kind === 'locked'
                  ? 'bg-amber-50 border-amber-200 text-amber-700'
                  : 'bg-red-50 border-red-200 text-red-600'
              }`}
            >
              {error.kind === 'locked' && <Lock className="w-4 h-4 mt-0.5 shrink-0" />}
              <span>{error.message}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@gmail.com"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2.5 pr-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-orange-500 text-white rounded-lg font-medium text-sm hover:bg-orange-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? <Loader className="w-4 h-4 animate-spin" /> : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
