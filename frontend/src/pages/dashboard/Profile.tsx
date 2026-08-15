import { useState } from "react";
import { User, Mail, Shield, Save, Loader2, Lock, Eye, EyeOff } from "lucide-react";
import { userService } from "../../services/userService";
import { useAuth } from "../../context/AuthContext";
import { motion } from "framer-motion";

type FormMessage = { type: "" | "success" | "error"; text: string };

const EMPTY_MESSAGE: FormMessage = { type: "", text: "" };

/** Announced banner, rendered inside the card whose form produced it. */
const StatusBanner = ({ msg }: { msg: FormMessage }) => {
  if (!msg.text) return null;
  const isError = msg.type === "error";
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      role={isError ? "alert" : "status"}
      aria-live={isError ? "assertive" : "polite"}
      className={`mb-4 p-3 rounded-xl border flex items-center gap-3 ${
        isError
          ? "bg-red-500/10 border-red-500/20 text-red-500"
          : "bg-green-500/10 border-green-500/20 text-green-600"
      }`}
    >
      <Shield className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
      <p className="text-sm font-medium">{msg.text}</p>
    </motion.div>
  );
};

const Profile = () => {
  const { user } = useAuth();

  // Each form owns its own loading + message state, so one form's request never
  // disables the other's button and an error always renders next to its own form.
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState<FormMessage>(EMPTY_MESSAGE);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<FormMessage>(EMPTY_MESSAGE);

  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

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
    setProfileLoading(true);
    setProfileMsg(EMPTY_MESSAGE);
    try {
      await userService.updateProfile(profileData);
      setProfileMsg({ type: "success", text: "Profile updated successfully!" });
    } catch (error: any) {
      setProfileMsg({
        type: "error",
        text: error.response?.data?.message || "Failed to update profile",
      });
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMsg({ type: "error", text: "New passwords don't match" });
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setPasswordMsg({ type: "error", text: "Password must be at least 6 characters" });
      return;
    }
    setPasswordLoading(true);
    setPasswordMsg(EMPTY_MESSAGE);
    try {
      await userService.changePassword({
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword,
      });
      setPasswordMsg({ type: "success", text: "Password changed successfully!" });
      setPasswordData({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error: any) {
      setPasswordMsg({
        type: "error",
        text: error.response?.data?.message || "Failed to change password",
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-primary">Profile Settings</h1>
        <p className="text-sm text-tertiary mt-1">Manage your account information and security</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Info */}
        <div className="bg-card rounded-xl border border-border-primary p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 bg-accent/10 rounded-xl flex items-center justify-center">
              <User className="w-4.5 h-4.5 text-accent" />
            </div>
            <h2 className="text-base font-bold text-primary">Personal Information</h2>
          </div>

          <StatusBanner msg={profileMsg} />

          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div>
              <label htmlFor="profile-username" className="text-xs font-medium text-secondary mb-1.5 block">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" aria-hidden="true" />
                <input
                  id="profile-username"
                  type="text"
                  value={profileData.username}
                  onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-secondary border border-border-primary rounded-xl text-primary text-sm font-medium focus:border-accent focus:ring-2 focus:ring-accent/10 outline-none transition-all"
                />
              </div>
            </div>
            <div>
              <label htmlFor="profile-email" className="text-xs font-medium text-secondary mb-1.5 block">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" aria-hidden="true" />
                <input
                  id="profile-email"
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-secondary border border-border-primary rounded-xl text-primary text-sm font-medium focus:border-accent focus:ring-2 focus:ring-accent/10 outline-none transition-all"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={profileLoading}
              className="w-full py-3 bg-accent text-white rounded-xl font-bold text-sm hover:bg-accent-hover transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {profileLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              ) : (
                <Save className="w-4 h-4" aria-hidden="true" />
              )}
              Save Changes
            </button>
          </form>
        </div>

        {/* Change Password */}
        <div className="bg-card rounded-xl border border-border-primary p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 bg-accent/10 rounded-xl flex items-center justify-center">
              <Lock className="w-4.5 h-4.5 text-accent" />
            </div>
            <h2 className="text-base font-bold text-primary">Change Password</h2>
          </div>

          <StatusBanner msg={passwordMsg} />

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label htmlFor="current-password" className="text-xs font-medium text-secondary mb-1.5 block">
                Current Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" aria-hidden="true" />
                <input
                  id="current-password"
                  type={showOldPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  value={passwordData.oldPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                  className="w-full pl-10 pr-10 py-3 bg-secondary border border-border-primary rounded-xl text-primary text-sm font-medium focus:border-accent focus:ring-2 focus:ring-accent/10 outline-none transition-all placeholder:text-muted"
                />
                <button
                  type="button"
                  onClick={() => setShowOldPassword(!showOldPassword)}
                  aria-label={showOldPassword ? "Hide current password" : "Show current password"}
                  aria-pressed={showOldPassword}
                  aria-controls="current-password"
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-primary"
                >
                  {showOldPassword ? (
                    <EyeOff className="w-4 h-4" aria-hidden="true" />
                  ) : (
                    <Eye className="w-4 h-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="new-password" className="text-xs font-medium text-secondary mb-1.5 block">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" aria-hidden="true" />
                <input
                  id="new-password"
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Min 6 characters"
                  autoComplete="new-password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className="w-full pl-10 pr-10 py-3 bg-secondary border border-border-primary rounded-xl text-primary text-sm font-medium focus:border-accent focus:ring-2 focus:ring-accent/10 outline-none transition-all placeholder:text-muted"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  aria-label={showNewPassword ? "Hide new password" : "Show new password"}
                  aria-pressed={showNewPassword}
                  aria-controls="new-password"
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-primary"
                >
                  {showNewPassword ? (
                    <EyeOff className="w-4 h-4" aria-hidden="true" />
                  ) : (
                    <Eye className="w-4 h-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="confirm-password" className="text-xs font-medium text-secondary mb-1.5 block">
                Confirm New Password
              </label>
              <input
                id="confirm-password"
                type="password"
                placeholder="••••••••"
                autoComplete="new-password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                className="w-full px-4 py-3 bg-secondary border border-border-primary rounded-xl text-primary text-sm font-medium focus:border-accent focus:ring-2 focus:ring-accent/10 outline-none transition-all placeholder:text-muted"
              />
            </div>
            <button
              type="submit"
              disabled={passwordLoading}
              className="w-full py-3 bg-inverse text-inverse rounded-xl font-bold text-sm hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {passwordLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              ) : (
                <Shield className="w-4 h-4" aria-hidden="true" />
              )}
              Update Password
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
