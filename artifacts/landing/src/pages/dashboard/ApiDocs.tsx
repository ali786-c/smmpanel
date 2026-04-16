import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Copy, Code, Key, RefreshCw, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ApiDocs() {
  const { user } = useAuth();
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);

  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const baseUrl = `https://${projectId}.supabase.co/functions/v1/api-v2`;

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("api_key")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        setApiKey(data?.api_key || "");
        setLoading(false);
      });
  }, [user]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const regenerateKey = async () => {
    if (!user) return;
    setRegenerating(true);
    const newKey = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    const { error } = await supabase
      .from("profiles")
      .update({ api_key: newKey })
      .eq("user_id", user.id);
    if (error) toast.error("Failed to regenerate key");
    else {
      setApiKey(newKey);
      toast.success("New API key generated");
    }
    setRegenerating(false);
  };

  const endpoints = [
    {
      title: "Service List",
      params: [
        { key: "key", value: "Your API key" },
        { key: "action", value: "services" },
      ],
      response: `[
  {
    "service": 1,
    "name": "Instagram Followers",
    "type": "Default",
    "category": "Instagram",
    "rate": "0.90",
    "min": "50",
    "max": "10000",
    "refill": true,
    "cancel": true
  }
]`,
    },
    {
      title: "Add Order",
      params: [
        { key: "key", value: "Your API key" },
        { key: "action", value: "add" },
        { key: "service", value: "Service ID" },
        { key: "link", value: "Link to page" },
        { key: "quantity", value: "Needed quantity" },
      ],
      response: `{ "order": 23501 }`,
    },
    {
      title: "Order Status",
      params: [
        { key: "key", value: "Your API key" },
        { key: "action", value: "status" },
        { key: "order", value: "Order ID" },
      ],
      response: `{
  "charge": "0.27819",
  "start_count": "3572",
  "status": "Partial",
  "remains": "157",
  "currency": "USD"
}`,
    },
    {
      title: "Multiple Orders Status",
      params: [
        { key: "key", value: "Your API key" },
        { key: "action", value: "status" },
        { key: "orders", value: "Order IDs (comma separated, up to 100)" },
      ],
      response: `{
  "1": { "charge": "0.27819", "start_count": "3572", "status": "Partial", "remains": "157", "currency": "USD" },
  "10": { "error": "Incorrect order ID" }
}`,
    },
    {
      title: "Create Refill",
      params: [
        { key: "key", value: "Your API key" },
        { key: "action", value: "refill" },
        { key: "order", value: "Order ID" },
      ],
      response: `{ "refill": "1" }`,
    },
    {
      title: "Create Multiple Refills",
      params: [
        { key: "key", value: "Your API key" },
        { key: "action", value: "refill" },
        { key: "orders", value: "Order IDs (comma separated, up to 100)" },
      ],
      response: `[
  { "order": 1, "refill": 1 },
  { "order": 2, "refill": { "error": "Incorrect order ID" } },
  { "refill": 3, "status": { "error": "Refill not found" } }
]`,
    },
    {
      title: "Cancel Orders",
      params: [
        { key: "key", value: "Your API key" },
        { key: "action", value: "cancel" },
        { key: "orders", value: "Order IDs (comma separated, up to 100)" },
      ],
      response: `[
  { "order": 2, "cancel": 1 },
  { "order": 9, "cancel": { "error": "Incorrect order ID" } }
]`,
    },
    {
      title: "User Balance",
      params: [
        { key: "key", value: "Your API key" },
        { key: "action", value: "balance" },
      ],
      response: `{ "balance": "100.84292", "currency": "USD" }`,
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* API Details */}
      <div className="glass rounded-2xl p-6">
        <h2 className="text-sm font-heading font-bold uppercase tracking-wider text-primary mb-6">
          API Details
        </h2>
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="text-xs text-muted-foreground font-medium uppercase mb-1 block">API URL</label>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-secondary/50 rounded-lg px-3 py-2.5 text-sm font-mono break-all text-primary">
                {baseUrl}
              </code>
              <Button variant="ghost" size="icon" onClick={() => copyToClipboard(baseUrl)} className="shrink-0">
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground font-medium uppercase mb-1 block">
              API Key <span className="normal-case">(can be found in your account page)</span>
            </label>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-secondary/50 rounded-lg px-3 py-2.5 text-sm font-mono truncate">
                {apiKey ? `${apiKey.slice(0, 12)}...${apiKey.slice(-8)}` : "No key generated"}
              </code>
              <Button variant="ghost" size="icon" onClick={() => copyToClipboard(apiKey)} className="shrink-0">
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="text-xs text-muted-foreground font-medium uppercase mb-1 block">HTTP Method</label>
            <p className="text-sm font-medium">POST</p>
          </div>
          <div>
            <label className="text-xs text-muted-foreground font-medium uppercase mb-1 block">Response Format</label>
            <p className="text-sm font-medium">JSON</p>
          </div>
        </div>
        <div className="mb-6">
          <label className="text-xs text-muted-foreground font-medium uppercase mb-1 block">Example Code</label>
          <a href="#" className="text-sm text-primary hover:underline flex items-center gap-1">
            {window.location.origin}/example.txt
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
        <Button
          variant="outline"
          onClick={regenerateKey}
          disabled={regenerating}
          className="border-primary/30 hover:bg-primary/10"
        >
          {regenerating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
          Generate New API Key
        </Button>
      </div>

      {/* Endpoints */}
      {endpoints.map((ep) => (
        <div key={ep.title} className="glass rounded-2xl p-6">
          <h3 className="font-heading font-semibold text-sm uppercase tracking-wider mb-4">{ep.title}</h3>
          <div className="overflow-x-auto mb-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-border">
                  <th className="pb-2 text-xs text-muted-foreground font-medium uppercase w-1/3">Key</th>
                  <th className="pb-2 text-xs text-primary font-medium uppercase">Action</th>
                </tr>
              </thead>
              <tbody>
                {ep.params.map((p) => (
                  <tr key={p.key} className="border-b border-border/30">
                    <td className="py-2.5 font-mono text-primary text-xs">{p.key}</td>
                    <td className="py-2.5 text-xs text-muted-foreground">{p.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="relative">
            <pre className="bg-secondary/50 rounded-xl p-4 text-xs font-mono overflow-x-auto text-muted-foreground">
              {ep.response}
            </pre>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2"
              onClick={() => copyToClipboard(ep.response)}
            >
              <Copy className="w-3 h-3" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
