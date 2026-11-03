import { useState } from "react";
import { User, Mail, Shield, Save, Loader2, Lock, Eye, EyeOff } from "lucide-react";
import { userService } from "../../services/userService";
import { useAuth } from "../../context/AuthContext";
import { getApiErrorMessage } from "../../utils/apiError";
import { motion, useReducedMotion } from "framer-motion";

const LABEL = "mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-tertiary";
const INPUT =
  "w-full min-h-[44px] rounded-tag border-2 border-border-primary bg-card py-3 text-sm text-primary transition-all duration-snap ease-snap placeholder:text-muted focus:border-accent";
const EYE_BTN =
  "absolute right-0.5 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center text-muted transition-colors duration-snap ease-snap hover:text-primary";
const BTN_BASE =
  "flex w-full items-center justify-center gap-2 rounded-tag border-2 border-inverse py-3 font-display text-lg uppercase leading-none tracking-[0.04em] transition-all duration-snap ease-snap hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard active:translate-x-0 active:translate-y-0 active:shadow-none disabled:translate-x-0 disabled:translate-y-0 disabled:border-border-primary disabled:bg-secondary disabled:text-muted disabled:shadow-none";

type FormMessage = { type: "" | "success" | "error"; text: string };

const EMPTY_MESSAGE: FormMessage = { type: "", text: "" };

/** Announced banner, rendered inside the card whose form produced it. */
const StatusBanner = ({ msg }: { msg: FormMessage }) => {
  const reduce = useReducedMotion();
  if (!msg.text) return null;
  const isError = msg.type === "error";
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.16, ease: [0.2, 0.7, 0.3, 1] }}
      role={isError ? "alert" : "status"}
      aria-live={isError ? "assertive" : "polite"}
      className={`mb-4 flex items-center gap-3 rounded-tag border-2 bg-card p-3 ${
        isError ? "border-accent text-accent" : "border-pitch text-pitch"
      }`}
    >
      <Shield className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
      <p className="text-sm font-bold">{msg.text}</p>
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
    } catch (error) {
      setProfileMsg({
        type: "error",
        text: getApiErrorMessage(error, "Failed to update profile"),
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
    } catch (error) {
      setPasswordMsg({
        type: "error",
        text: getApiErrorMessage(error, "Failed to change password"),
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="eyebrow mb-2">Settings</p>
        <h1 className="font-display text-[34px] font-semibold uppercase leading-none text-primary">
          Profile Settings
        </h1>
        <p className="mt-1 text-sm text-tertiary">Manage your account information and security</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Profile Info */}
        <div className="rounded-card border-2 border-inverse bg-card p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-tag border-2 border-inverse bg-card">
              <User className="h-4 w-4 text-accent" aria-hidden="true" />
            </div>
            <h2 className="font-display text-[29px] font-semibold uppercase leading-none text-primary">
              Personal Information
            </h2>
          </div>

          <StatusBanner msg={profileMsg} />

          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div>
              <label htmlFor="profile-username" className={LABEL}>
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
                <input
                  id="profile-username"
                  type="text"
                  value={profileData.username}
                  onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                  className={`${INPUT} pl-10 pr-4`}
                />
              </div>
            </div>
            <div>
              <label htmlFor="profile-email" className={LABEL}>
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
                <input
                  id="profile-email"
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  className={`${INPUT} pl-10 pr-4`}
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={profileLoading}
              className={`${BTN_BASE} bg-accent text-inverse hover:bg-accent-hover`}
            >
              {profileLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Save className="h-4 w-4" aria-hidden="true" />
              )}
              Save Changes
            </button>
          </form>
        </div>

        {/* Change Password */}
        <div className="rounded-card border-2 border-inverse bg-card p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-tag border-2 border-inverse bg-card">
              <Lock className="h-4 w-4 text-accent" aria-hidden="true" />
            </div>
            <h2 className="font-display text-[29px] font-semibold uppercase leading-none text-primary">
              Change Password
            </h2>
          </div>

          <StatusBanner msg={passwordMsg} />

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label htmlFor="current-password" className={LABEL}>
                Current Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
                <input
                  id="current-password"
                  type={showOldPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  value={passwordData.oldPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                  className={`${INPUT} pl-10 pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowOldPassword(!showOldPassword)}
                  aria-label={showOldPassword ? "Hide current password" : "Show current password"}
                  aria-pressed={showOldPassword}
                  aria-controls="current-password"
                  className={EYE_BTN}
                >
                  {showOldPassword ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="new-password" className={LABEL}>
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
                <input
                  id="new-password"
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Min 6 characters"
                  autoComplete="new-password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className={`${INPUT} pl-10 pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  aria-label={showNewPassword ? "Hide new password" : "Show new password"}
                  aria-pressed={showNewPassword}
                  aria-controls="new-password"
                  className={EYE_BTN}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="confirm-password" className={LABEL}>
                Confirm New Password
              </label>
              <input
                id="confirm-password"
                type="password"
                placeholder="••••••••"
                autoComplete="new-password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                className={`${INPUT} px-4`}
              />
            </div>
            <button
              type="submit"
              disabled={passwordLoading}
              className={`${BTN_BASE} bg-inverse text-inverse`}
            >
              {passwordLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Shield className="h-4 w-4" aria-hidden="true" />
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
