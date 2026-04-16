import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { Copy, Code, Key, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ApiDocs() {
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);

  const baseUrl = `${window.location.origin}/api/v2`;

  useEffect(() => {
    apiFetch("/profile")
      .then(r => r.ok ? r.json() : null)
      .then(d => { setApiKey(d?.profile?.api_key ?? d?.api_key ?? ""); })
      .finally(() => setLoading(false));
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const regenerateKey = async () => {
    setRegenerating(true);
    const res = await apiFetch("/profile/regenerate-api-key", { method: "POST" });
    if (res.ok) {
      const d = await res.json();
      setApiKey(d.api_key ?? "");
      toast.success("New API key generated");
    } else toast.error("Failed to regenerate key");
    setRegenerating(false);
  };

  const endpoints = [
    { title: "Service List", params: [{ key: "key", value: "Your API key" }, { key: "action", value: "services" }], response: `[\n  { "service": 1, "name": "Instagram Followers", "type": "Default",\n    "category": "Instagram", "rate": "0.90", "min": "50", "max": "10000",\n    "refill": true, "cancel": true }\n]` },
    { title: "Add Order", params: [{ key: "key", value: "Your API key" }, { key: "action", value: "add" }, { key: "service", value: "Service ID" }, { key: "link", value: "Link to page" }, { key: "quantity", value: "Needed quantity" }], response: `{ "order": 23501 }` },
    { title: "Order Status", params: [{ key: "key", value: "Your API key" }, { key: "action", value: "status" }, { key: "order", value: "Order ID" }], response: `{ "charge": "0.27819", "start_count": "3572", "status": "Partial", "remains": "157", "currency": "USD" }` },
    { title: "Cancel Orders", params: [{ key: "key", value: "Your API key" }, { key: "action", value: "cancel" }, { key: "orders", value: "Comma-separated Order IDs (up to 100)" }], response: `[{ "order": 2, "cancel": 1 }]` },
    { title: "Create Refill", params: [{ key: "key", value: "Your API key" }, { key: "action", value: "refill" }, { key: "order", value: "Order ID" }], response: `{ "refill": "1" }` },
    { title: "User Balance", params: [{ key: "key", value: "Your API key" }, { key: "action", value: "balance" }], response: `{ "balance": "100.84292", "currency": "USD" }` },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="glass rounded-2xl p-6 space-y-4">
        <h3 className="font-heading font-semibold flex items-center gap-2"><Key className="w-5 h-5 text-primary" /> Your API Key</h3>
        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm"><Loader2 className="w-4 h-4 animate-spin" /> Loading...</div>
        ) : (
          <div className="space-y-3">
            <div className="flex gap-2">
              <code className="flex-1 glass rounded-xl px-4 py-3 text-xs font-mono text-primary truncate">{apiKey || "No API key generated yet"}</code>
              <Button size="icon" variant="outline" onClick={() => copyToClipboard(apiKey)} disabled={!apiKey} className="border-primary/30 hover:bg-primary/10 shrink-0"><Copy className="w-4 h-4" /></Button>
            </div>
            <Button onClick={regenerateKey} disabled={regenerating} variant="outline" className="gap-2 border-primary/30 hover:bg-primary/10">
              {regenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} Regenerate Key
            </Button>
          </div>
        )}
        <div className="glass rounded-xl p-3 space-y-1">
          <p className="text-xs font-medium text-muted-foreground">API Endpoint</p>
          <div className="flex items-center gap-2">
            <code className="text-xs font-mono text-primary flex-1">{baseUrl}</code>
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => copyToClipboard(baseUrl)}><Copy className="w-3 h-3" /></Button>
          </div>
          <p className="text-xs text-muted-foreground">HTTP Method: POST · Response: JSON</p>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-heading font-semibold flex items-center gap-2"><Code className="w-5 h-5 text-primary" /> Endpoints</h3>
        {endpoints.map((ep) => (
          <div key={ep.title} className="glass rounded-2xl p-5 space-y-3">
            <h4 className="font-medium text-sm">{ep.title}</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {ep.params.map(p => (
                <div key={p.key} className="flex gap-2">
                  <span className="text-primary font-mono font-medium w-20 shrink-0">{p.key}</span>
                  <span className="text-muted-foreground">{p.value}</span>
                </div>
              ))}
            </div>
            <div className="relative">
              <pre className="bg-secondary/50 rounded-xl p-3 text-xs font-mono text-muted-foreground overflow-x-auto">{ep.response}</pre>
              <Button size="icon" variant="ghost" className="absolute top-2 right-2 h-6 w-6 opacity-50 hover:opacity-100" onClick={() => copyToClipboard(ep.response)}><Copy className="w-3 h-3" /></Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
