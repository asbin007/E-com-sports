import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Loader } from "lucide-react";

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const token = searchParams.get("token");
  const refreshToken = searchParams.get("refreshToken");

  useEffect(() => {
    if (!token) {
      navigate("/login?error=no_token");
      return;
    }

    const fetchUser = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL || "http://localhost:1000/api/v1"}/auth/me`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (response.ok) {
          const data = await response.json();
          login(token, data.user, refreshToken || undefined);
          navigate("/");
        } else {
          navigate("/login?error=validation_failed");
        }
      } catch {
        navigate("/login?error=connection_failed");
      }
    };

    fetchUser();
  }, [token, refreshToken, navigate, login]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader className="w-10 h-10 animate-spin text-indigo-600 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900">Authenticating...</h2>
        <p className="text-gray-500">Please wait while we log you in.</p>
      </div>
    </div>
  );
};

export default AuthCallback;
