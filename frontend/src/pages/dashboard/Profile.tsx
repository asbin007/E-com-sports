import { useState } from "react";
import { User, Mail, Shield, Save, Loader2, Lock } from "lucide-react";
import { userService } from "../../services/userService";
import { useAuth } from "../../context/AuthContext";
import { motion } from "framer-motion";

const Profile = () => {
  const { user } = useAuth(); // We might need a way to refresh user context
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const [profileData, setProfileData] = useState({
    username: user?.username || "",
    email: user?.email || "",
  });

  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await userService.updateProfile(profileData);
      setMsg({
        type: "success",
        text: "Protocol Updated: Profile Synchronized",
      });
    } catch (error: any) {
      setMsg({
        type: "error",
        text: error.response?.data?.message || "Synchronization Failure",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMsg({
        type: "error",
        text: "Protocol Mismatch: Passwords do not align",
      });
      return;
    }
    setLoading(true);
    try {
      await userService.changePassword({
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword,
      });
      setMsg({ type: "success", text: "Security Protocol Updated" });
      setPasswordData({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error: any) {
      setMsg({
        type: "error",
        text: error.response?.data?.message || "Security Update Failed",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-16">
      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-5xl font-black text-stone-950 uppercase italic tracking-tighter leading-none">
          Identity <span className="text-orange-600">Protocol</span>
        </h1>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em]">
          Manage your elite credentials and secure comm paths.
        </p>
      </div>

      {msg.text && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className={`p-6 rounded-2xl border ${msg.type === "success" ? "bg-green-50 border-green-100 text-green-600" : "bg-red-50 border-red-100 text-red-600"} flex items-center gap-4`}
        >
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${msg.type === "success" ? "bg-green-100" : "bg-red-100"}`}
          >
            {msg.type === "success" ? (
              <Shield className="w-5 h-5" />
            ) : (
              <Shield className="w-5 h-5" />
            )}
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest mb-0.5">
              {msg.type.toUpperCase()}
            </p>
            <p className="text-xs font-bold italic">{msg.text}</p>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-16">
        {/* Profile Info Form */}
        <section className="space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-stone-950 text-white rounded-xl flex items-center justify-center shadow-lg">
              <User className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-black text-stone-950 uppercase italic tracking-tight">
              Core Credentials
            </h2>
          </div>

          <form
            onSubmit={handleProfileUpdate}
            className="space-y-6 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm"
          >
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
                Display Alias
              </label>
              <div className="relative">
                <User className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={profileData.username}
                  onChange={(e) =>
                    setProfileData({ ...profileData, username: e.target.value })
                  }
                  className="w-full pl-14 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:border-orange-600 focus:ring-4 focus:ring-orange-600/5 transition-all outline-none font-bold text-sm"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
                Digital Identity (Email)
              </label>
              <div className="relative">
                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={profileData.email}
                  onChange={(e) =>
                    setProfileData({ ...profileData, email: e.target.value })
                  }
                  className="w-full pl-14 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:border-orange-600 focus:ring-4 focus:ring-orange-600/5 transition-all outline-none font-bold text-sm"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-stone-950 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] italic flex items-center justify-center gap-3 hover:bg-orange-600 transition-all active:scale-95 disabled:opacity-50 shadow-xl shadow-stone-950/10"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4" /> Synchronize Identity
                </>
              )}
            </button>
          </form>
        </section>

        {/* Password Security Form */}
        <section className="space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-orange-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-orange-600/20">
              <Lock className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-black text-stone-950 uppercase italic tracking-tight">
              Security Vault
            </h2>
          </div>

          <form
            onSubmit={handlePasswordChange}
            className="space-y-6 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm"
          >
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
                Current Cipher
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={passwordData.oldPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    oldPassword: e.target.value,
                  })
                }
                className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:border-orange-600 focus:ring-4 focus:ring-orange-600/5 transition-all outline-none font-bold text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
                New Protocol Cipher
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={passwordData.newPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    newPassword: e.target.value,
                  })
                }
                className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:border-orange-600 focus:ring-4 focus:ring-orange-600/5 transition-all outline-none font-bold text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
                Verify New Cipher
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={passwordData.confirmPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    confirmPassword: e.target.value,
                  })
                }
                className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:border-orange-600 focus:ring-4 focus:ring-orange-600/5 transition-all outline-none font-bold text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-600 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] italic flex items-center justify-center gap-3 hover:bg-orange-700 transition-all active:scale-95 disabled:opacity-50 shadow-xl shadow-orange-600/20"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Shield className="w-4 h-4" /> Update Security Protocol
                </>
              )}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
};

export default Profile;
