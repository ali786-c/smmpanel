import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, AlertTriangle, Download, Trash2, ShieldAlert } from "lucide-react";

export default function AccountManagement() {
  const { user, signOut } = useAuth();
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleExportData = async () => {
    setExporting(true);
    try {
      const [ordersRes, txRes, profileRes, ticketsRes] = await Promise.all([
        apiFetch("/orders?per_page=1000").then(r => r.ok ? r.json() : null),
        apiFetch("/wallet/transactions?per_page=1000").then(r => r.ok ? r.json() : null),
        apiFetch("/profile").then(r => r.ok ? r.json() : null),
        apiFetch("/tickets?per_page=1000").then(r => r.ok ? r.json() : null),
      ]);

      const exportData = {
        exported_at: new Date().toISOString(),
        user: { email: user?.email, id: user?.id },
        profile: profileRes?.profile ?? profileRes,
        orders: ordersRes?.data ?? [],
        transactions: txRes?.data ?? [],
        tickets: ticketsRes?.data ?? [],
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `data-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Data exported successfully");
    } catch {
      toast.error("Failed to export data");
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      const res = await apiFetch("/profile", { method: "DELETE" });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error ?? "Failed to delete account"); }
      toast.success("Account permanently deleted. Goodbye!");
      await signOut?.();
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete account. Please contact support.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="glass rounded-2xl p-6 space-y-4">
        <h3 className="font-heading font-semibold flex items-center gap-2"><Download className="w-5 h-5 text-primary" /> Export Your Data</h3>
        <p className="text-sm text-muted-foreground">Download a copy of all your data including profile, orders, transactions, and support tickets in JSON format. This complies with GDPR data portability requirements.</p>
        <Button onClick={handleExportData} disabled={exporting} className="gradient-primary text-primary-foreground font-bold">
          {exporting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
          EXPORT ALL DATA
        </Button>
      </div>

      <div className="glass rounded-2xl p-6 space-y-4 border border-destructive/20">
        <h3 className="font-heading font-semibold flex items-center gap-2 text-destructive"><ShieldAlert className="w-5 h-5" /> Delete Account</h3>
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-destructive mb-1">This action cannot be undone</p>
              <p className="text-muted-foreground">Deleting your account will permanently remove all your data, including orders, wallet balance, and support history. Any remaining wallet balance will be forfeited. This action complies with GDPR right to erasure.</p>
            </div>
          </div>
        </div>
        {!confirmDelete ? (
          <Button variant="outline" className="border-destructive/30 text-destructive hover:bg-destructive/10 font-bold" onClick={() => setConfirmDelete(true)}>
            <Trash2 className="w-4 h-4 mr-2" /> I WANT TO DELETE MY ACCOUNT
          </Button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-destructive font-medium">Are you absolutely sure? This will permanently delete your account and all data.</p>
            <div className="flex gap-3">
              <Button variant="destructive" onClick={handleDeleteAccount} disabled={deleting} className="font-bold">
                {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />} DELETE PERMANENTLY
              </Button>
              <Button variant="ghost" onClick={() => setConfirmDelete(false)}>Cancel</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
