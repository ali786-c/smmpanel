import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Settings as SettingsIcon, Bell, User, Lock, Globe, Shield, Key } from "lucide-react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import NotificationPreferences from "@/components/NotificationPreferences";

export default function Settings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"settings" | "notifications">("settings");

  // Profile
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [username, setUsername] = useState("");

  // Password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Timezone
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("display_name, phone, avatar_url")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setDisplayName(data.display_name || "");
          setPhone(data.phone || "");
          setAvatarUrl(data.avatar_url || "");
        }
      });
  }, [user]);

  const handleUpdateProfile = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName, phone, avatar_url: avatarUrl })
      .eq("user_id", user.id);
    setLoading(false);
    if (error) toast.error("Failed to update profile");
    else toast.success("Profile updated successfully");
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const handleChangeEmail = async () => {
    toast.info("Email change requires verification. Check your inbox.");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab("settings")}
          className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeTab === "settings"
              ? "gradient-primary text-primary-foreground"
              : "glass text-muted-foreground hover:text-foreground"
          }`}
        >
          <SettingsIcon className="w-4 h-4 inline mr-2" />
          SETTINGS
        </button>
        <button
          onClick={() => setActiveTab("notifications")}
          className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeTab === "notifications"
              ? "gradient-primary text-primary-foreground"
              : "glass text-muted-foreground hover:text-foreground"
          }`}
        >
          <Bell className="w-4 h-4 inline mr-2" />
          NOTIFICATIONS
        </button>
      </div>

      {activeTab === "settings" ? (
        <>
          {/* Profile Header */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-full gradient-primary flex items-center justify-center text-xl font-bold text-primary-foreground">
                {displayName.slice(0, 2).toUpperCase() || "U"}
              </div>
              <div>
                <h3 className="font-heading font-bold text-lg">{displayName || "User"}</h3>
                <p className="text-xs text-muted-foreground">@{user?.email?.split("@")[0] || "user"}</p>
              </div>
            </div>
          </div>

          {/* Change Password */}
          <div className="glass rounded-2xl p-6 space-y-4">
            <h3 className="font-heading font-semibold flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              Change Password
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Current password</label>
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Current password"
                  className="bg-secondary/50"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">New password</label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password"
                  className="bg-secondary/50"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Confirm new password</label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="bg-secondary/50"
                />
              </div>
            </div>
            <Button
              onClick={handleChangePassword}
              disabled={loading || !newPassword}
              className="w-full gradient-primary text-primary-foreground font-bold py-5"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              CHANGE PASSWORD
            </Button>
          </div>

          {/* Profile / Email / Username */}
          <div className="glass rounded-2xl p-6 space-y-4">
            <h3 className="font-heading font-semibold flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Account Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Email</label>
                <Input value={user?.email || ""} disabled className="bg-secondary/30 opacity-60" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Username</label>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username"
                  className="bg-secondary/50"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Display Name</label>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="bg-secondary/50"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Phone</label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Optional"
                  className="bg-secondary/50"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Avatar URL</label>
                <Input
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://..."
                  className="bg-secondary/50"
                />
              </div>
            </div>
            <Button
              onClick={handleUpdateProfile}
              disabled={loading}
              className="w-full gradient-primary text-primary-foreground font-bold py-5"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              SAVE PROFILE
            </Button>
          </div>

          {/* Two-Factor Authentication */}
          <div className="glass rounded-2xl p-6 space-y-4">
            <h3 className="font-heading font-semibold flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Two-factor authentication
            </h3>
            <div className="p-4 rounded-xl bg-warning/10 border border-warning/20">
              <p className="text-sm text-muted-foreground">
                Email-based option to add an extra layer of protection to your account. When signing in you'll need to enter a code that will be sent to your email address.
              </p>
            </div>
            <Button
              variant="outline"
              className="w-full border-primary/30 hover:bg-primary/10 font-bold py-5"
              onClick={() => toast.info("Two-factor authentication coming soon")}
            >
              ENABLE
            </Button>
          </div>

          {/* Language */}
          <div className="glass rounded-2xl p-6 space-y-4">
            <h3 className="font-heading font-semibold flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" />
              Language
            </h3>
            <p className="text-sm text-muted-foreground">Choose your preferred language for the interface.</p>
            <LanguageSwitcher />
          </div>

          {/* Timezone */}
          <div className="glass rounded-2xl p-6 space-y-4">
            <h3 className="font-heading font-semibold flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" />
              Timezone
            </h3>
            <div className="flex items-center gap-4">
              <Input
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="bg-secondary/50 flex-1"
              />
              <Button
                variant="outline"
                className="border-primary/30 hover:bg-primary/10 font-bold px-8"
                onClick={() => toast.success("Timezone saved")}
              >
                SAVE
              </Button>
            </div>
          </div>

          {/* API Key */}
          <div className="glass rounded-2xl p-6 space-y-4">
            <h3 className="font-heading font-semibold flex items-center gap-2">
              <Key className="w-5 h-5 text-primary" />
              API Key
            </h3>
            <p className="text-sm text-muted-foreground">
              Generate a new API key for programmatic access. Your current key will be invalidated.
            </p>
            <Button
              variant="outline"
              className="w-full border-primary/30 hover:bg-primary/10 font-bold py-5"
              onClick={async () => {
                if (!user) return;
                const newKey = Array.from(crypto.getRandomValues(new Uint8Array(32)))
                  .map((b) => b.toString(16).padStart(2, "0"))
                  .join("");
                const { error } = await supabase
                  .from("profiles")
                  .update({ api_key: newKey })
                  .eq("user_id", user.id);
                if (error) toast.error("Failed to generate key");
                else toast.success("New API key generated. View it on the API page.");
              }}
            >
              GENERATE NEW
            </Button>
          </div>
        </>
      ) : (
        <NotificationPreferences userId={user?.id} email={user?.email} />
      )}
    </div>
  );
}
