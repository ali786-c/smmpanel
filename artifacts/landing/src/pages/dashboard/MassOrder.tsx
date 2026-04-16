import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function MassOrder() {
  const [input, setInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<{ line: number; status: string; message: string }[]>([]);

  const handleSubmit = async () => {
    if (!input.trim()) return;
    setSubmitting(true);
    setResults([]);

    const lines = input.trim().split("\n").filter(l => l.trim());
    const newResults: typeof results = [];

    for (let i = 0; i < lines.length; i++) {
      const parts = lines[i].split("|").map(p => p.trim());
      if (parts.length < 3) {
        newResults.push({ line: i + 1, status: "error", message: "Invalid format. Use: service_id | link | quantity" });
        continue;
      }
      const [serviceId, link, qty] = parts;
      try {
        const res = await apiFetch("/orders", {
          method: "POST",
          body: JSON.stringify({ service_id: serviceId, link, quantity: parseInt(qty) }),
        });
        if (res.ok) {
          newResults.push({ line: i + 1, status: "success", message: `Campaign launched for ${link}` });
        } else {
          const e = await res.json();
          newResults.push({ line: i + 1, status: "error", message: e.error ?? e.message ?? "Failed" });
        }
      } catch (err: any) {
        newResults.push({ line: i + 1, status: "error", message: err.message || "Failed" });
      }
    }

    setResults(newResults);
    setSubmitting(false);
    const successCount = newResults.filter(r => r.status === "success").length;
    if (successCount > 0) toast.success(`${successCount}/${lines.length} campaigns launched`);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="glass rounded-2xl p-6">
        <h2 className="text-xl font-heading font-bold mb-2 flex items-center gap-2"><Upload className="w-5 h-5 text-primary" /> Mass Campaign Order</h2>
        <p className="text-sm text-muted-foreground mb-6">Submit multiple campaigns at once. One per line using the format:</p>
        <div className="glass rounded-lg p-3 mb-4 font-mono text-xs text-muted-foreground">service_id | link | quantity</div>
        <Textarea value={input} onChange={e => setInput(e.target.value)}
          placeholder={"service_id | link | quantity\nservice_id | link | quantity\nservice_id | link | quantity"}
          className="min-h-[200px] bg-secondary/50 font-mono text-sm" />
        <p className="text-xs text-muted-foreground text-center mt-4 mb-2">
          <span className="text-destructive font-medium">⚠ No refunds.</span> All orders are final once submitted. By clicking Submit you agree to our{" "}
          <a href="/terms" className="text-primary hover:underline">Terms of Service</a>.
        </p>
        <Button className="w-full gradient-primary text-primary-foreground font-bold text-base py-6" disabled={!input.trim() || submitting} onClick={handleSubmit}>
          {submitting ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> PROCESSING...</> : "SUBMIT"}
        </Button>
      </div>

      {results.length > 0 && (
        <div className="glass rounded-2xl p-6 space-y-2">
          <h3 className="font-heading font-semibold mb-3">Results</h3>
          {results.map(r => (
            <div key={r.line} className={`flex items-center gap-3 text-sm p-2 rounded-lg ${r.status === "success" ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
              <span className="font-mono text-xs w-8">#{r.line}</span>
              <span className="flex-1">{r.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
