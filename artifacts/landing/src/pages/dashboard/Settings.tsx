import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { Loader2, Settings as SettingsIcon, Bell, User, Lock, Globe, Key } from "lucide-react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import NotificationPreferences from "@/components/NotificationPreferences";
import { useAuth } from "@/hooks/useAuth";

export default function Settings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"settings" | "notifications">("settings");
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);

  useEffect(() => {
    apiFetch("/profile")
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        const p = d?.profile ?? d;
        if (p) {
          setDisplayName(p.display_name ?? "");
          setPhone(p.phone ?? "");
          setAvatarUrl(p.avatar_url ?? "");
        }
      });
  }, []);

  const handleUpdateProfile = async () => {
    setLoading(true);
    const res = await apiFetch("/profile", {
      method: "PATCH",
      body: JSON.stringify({ display_name: displayName, phone, avatar_url: avatarUrl }),
    });
    setLoading(false);
    if (res.ok) toast.success("Profile updated successfully");
    else toast.error("Failed to update profile");
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    if (newPassword !== confirmPassword) { toast.error("Passwords do not match"); return; }
    setLoading(true);
    const res = await apiFetch("/profile/change-password", {
      method: "POST",
      body: JSON.stringify({ current_password: currentPassword, password: newPassword, password_confirmation: confirmPassword }),
    });
    setLoading(false);
    if (res.ok) {
      toast.success("Password changed successfully");
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    } else {
      const e = await res.json();
      toast.error(e.error ?? "Failed to change password");
    }
  };

  const handleRegenerateApiKey = async () => {
    const res = await apiFetch("/profile/regenerate-api-key", { method: "POST" });
    if (res.ok) toast.success("New API key generated. View it on the API page.");
    else toast.error("Failed to generate key");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex gap-2">
        {(["settings", "notifications"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === tab ? "gradient-primary text-primary-foreground" : "glass text-muted-foreground hover:text-foreground"}`}>
            {tab === "settings" ? <><SettingsIcon className="w-4 h-4 inline mr-2" />SETTINGS</> : <><Bell className="w-4 h-4 inline mr-2" />NOTIFICATIONS</>}
          </button>
        ))}
      </div>

      {activeTab === "settings" ? (
        <>
          <div className="glass rounded-2xl p-6 space-y-4">
            <h3 className="font-heading font-semibold flex items-center gap-2"><User className="w-5 h-5 text-primary" /> Profile</h3>
            <div className="grid gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Display Name</label>
                <Input value={displayName} onChange={e => setDisplayName(e.target.value)} className="bg-secondary/50" placeholder="Your name" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Phone</label>
                <Input value={phone} onChange={e => setPhone(e.target.value)} className="bg-secondary/50" placeholder="+1 234 567 8900" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Avatar URL</label>
                <Input value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} className="bg-secondary/50" placeholder="https://..." />
              </div>
            </div>
            <Button onClick={handleUpdateProfile} disabled={loading} className="gradient-primary text-primary-foreground font-bold px-8">
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} SAVE PROFILE
            </Button>
          </div>

          <div className="glass rounded-2xl p-6 space-y-4">
            <h3 className="font-heading font-semibold flex items-center gap-2"><Lock className="w-5 h-5 text-primary" /> Change Password</h3>
            <div className="grid gap-3">
              <Input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="Current password" className="bg-secondary/50" />
              <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="New password" className="bg-secondary/50" />
              <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm new password" className="bg-secondary/50" />
            </div>
            <Button onClick={handleChangePassword} disabled={loading} variant="outline" className="border-primary/30 hover:bg-primary/10 font-bold px-8">
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} CHANGE PASSWORD
            </Button>
          </div>

          <div className="glass rounded-2xl p-6 space-y-4">
            <h3 className="font-heading font-semibold flex items-center gap-2"><Globe className="w-5 h-5 text-primary" /> Language & Region</h3>
            <LanguageSwitcher />
            <div className="flex items-center gap-3">
              <Input value={timezone} onChange={e => setTimezone(e.target.value)} className="bg-secondary/50 flex-1" />
              <Button variant="outline" className="border-primary/30 hover:bg-primary/10 font-bold px-8" onClick={() => toast.success("Timezone saved")}>SAVE</Button>
            </div>
          </div>

          <div className="glass rounded-2xl p-6 space-y-4">
            <h3 className="font-heading font-semibold flex items-center gap-2"><Key className="w-5 h-5 text-primary" /> API Key</h3>
            <p className="text-sm text-muted-foreground">Generate a new API key for programmatic access. Your current key will be invalidated.</p>
            <Button variant="outline" className="w-full border-primary/30 hover:bg-primary/10 font-bold py-5" onClick={handleRegenerateApiKey}>GENERATE NEW</Button>
          </div>
        </>
      ) : (
        <NotificationPreferences userId={user?.id} email={user?.email} />
      )}
    </div>
  );
}
