import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { updatePassword } from "firebase/auth";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { db, auth } from "@/lib/firebase";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { user, userProfile, refreshProfile } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [displayName, setDisplayName] = useState(
    userProfile?.displayName || "",
  );
  const [phone, setPhone] = useState(userProfile?.phone || "");
  const [licenseNumber, setLicenseNumber] = useState(
    userProfile?.licenseNumber || "",
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSaved, setPasswordSaved] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {return;}
    setError("");
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        displayName,
        phone,
        licenseNumber,
      } as Record<string, string>);
      await refreshProfile();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: unknown) {
      const fbErr = err as { message?: string };
      setError(fbErr.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) {return;}
    setPasswordError("");
    setPasswordSaved(false);
    try {
      await updatePassword(auth.currentUser, newPassword);
      setPasswordSaved(true);
      setNewPassword("");
      setTimeout(() => setPasswordSaved(false), 3000);
    } catch (err: unknown) {
      const fbErr = err as { code?: string; message?: string };
      if (fbErr.code === "auth/requires-recent-login") {
        setPasswordError(
          "Please log out and log back in before changing your password",
        );
      } else {
        setPasswordError(fbErr.message || "Failed to change password");
      }
    }
  };

  if (!userProfile) {return null;}

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Manage your profile and preferences
          </p>
        </div>
      </div>

      {/* Profile */}
      <section className="rounded-lg border bg-card p-6">
        <h2 className="text-lg font-semibold mb-4">Profile</h2>
        <form onSubmit={handleSaveProfile} className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium mb-1">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={userProfile.email}
              disabled
              className="w-full rounded-lg border bg-muted px-3 py-2 text-sm text-muted-foreground cursor-not-allowed"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Email cannot be changed
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              placeholder="+63 912 345 6789"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              License / Accreditation #
            </label>
            <input
              type="text"
              value={licenseNumber}
              onChange={(e) => setLicenseNumber(e.target.value)}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              placeholder="HLURB / DHSUD license number"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {saved && (
            <p className="text-sm text-green-600 dark:text-green-400">
              Profile saved!
            </p>
          )}
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </form>
      </section>

      {/* Password */}
      <section className="rounded-lg border bg-card p-6">
        <h2 className="text-lg font-semibold mb-4">Change Password</h2>
        <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium mb-1">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              minLength={6}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              placeholder="At least 6 characters"
            />
          </div>
          {passwordError && (
            <p className="text-sm text-destructive">{passwordError}</p>
          )}
          {passwordSaved && (
            <p className="text-sm text-green-600 dark:text-green-400">
              Password changed!
            </p>
          )}
          <button
            type="submit"
            disabled={!newPassword}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            Change Password
          </button>
        </form>
      </section>

      {/* Preferences */}
      <section className="rounded-lg border bg-card p-6">
        <h2 className="text-lg font-semibold mb-4">Preferences</h2>
        <div className="space-y-4 max-w-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Dark Mode</p>
              <p className="text-xs text-muted-foreground">
                Toggle dark/light theme
              </p>
            </div>
            <button
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              className={cn(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                theme === "dark" ? "bg-primary" : "bg-gray-300",
              )}
            >
              <span
                className={cn(
                  "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                  theme === "dark" ? "translate-x-6" : "translate-x-1",
                )}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Role</p>
              <p className="text-xs text-muted-foreground capitalize">
                {userProfile.role}
              </p>
            </div>
          </div>

          {userProfile.officeName && (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Office</p>
                <p className="text-xs text-muted-foreground">
                  {userProfile.officeName}
                </p>
              </div>
            </div>
          )}

          {userProfile.officeId && (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Office ID</p>
                <p className="text-xs text-muted-foreground">
                  <code className="text-xs">{userProfile.officeId}</code>
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Account Info */}
      <section className="rounded-lg border bg-card p-6">
        <h2 className="text-lg font-semibold mb-4">Account</h2>
        <p className="text-sm text-muted-foreground">
          Account created:{" "}
          {new Date(userProfile.createdAt).toLocaleDateString()}
        </p>
        <p className="text-sm text-muted-foreground">
          User ID: <code className="text-xs">{userProfile.id}</code>
        </p>
      </section>
    </div>
  );
}
