import { useState, useEffect } from "react";
import { 
  Zap, 
  Settings, 
  Play, 
  Trash2, 
  Plus, 
  Loader2, 
  Info, 
  CheckCircle2, 
  AlertCircle 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";

interface Keyword {
  id: string;
  keyword: string;
  status: string;
  last_used_at?: string;
}

interface Config {
  is_enabled: boolean;
  frequency_hours: number;
}

export default function AdminAIBlogging() {
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [config, setConfig] = useState<Config>({ is_enabled: false, frequency_hours: 24 });
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [newKeyword, setNewKeyword] = useState("");
  const [progress, setProgress] = useState<{ percent: number; status: string } | null>(null);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchProgress, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const respConfig = await apiFetch("/admin/blog-automation/config").then(r => r.json());
      const respKeywords = await apiFetch("/admin/blog-automation/keywords").then(r => r.json());
      setConfig(respConfig);
      setKeywords(respKeywords);
    } catch (error) {
      toast.error("Failed to load automation data");
    } finally {
      setLoading(false);
    }
  };

  const fetchProgress = async () => {
    try {
      const data = await apiFetch("/admin/blog-automation/progress").then(r => r.json());
      if (data && data.percent !== undefined) {
        setProgress(data);
        if (data.percent === 100) {
          // Reset progress after a short delay once complete
          setTimeout(() => setProgress(null), 10000);
        }
      } else {
        setProgress(null);
      }
    } catch (e) {}
  };

  const handleToggle = async (enabled: boolean) => {
    try {
      await apiFetch("/admin/blog-automation/config", {
        method: "POST",
        body: JSON.stringify({ is_enabled: enabled })
      });
      setConfig({ ...config, is_enabled: enabled });
      toast.success(`Automation ${enabled ? 'enabled' : 'disabled'}`);
    } catch (e) {
      toast.error("Failed to update config");
    }
  };

  const addKeyword = async () => {
    if (!newKeyword.trim()) return;
    try {
      const resp = await apiFetch("/admin/blog-automation/keywords", {
        method: "POST",
        body: JSON.stringify({ keyword: newKeyword })
      }).then(r => r.json());
      setKeywords([...keywords, resp]);
      setNewKeyword("");
      toast.success("Keyword added");
    } catch (e) {
      toast.error("Failed to add keyword");
    }
  };

  const deleteKeyword = async (id: string) => {
    try {
      await apiFetch(`/admin/blog-automation/keywords/${id}`, { method: "DELETE" });
      setKeywords(keywords.filter(k => k.id !== id));
      toast.success("Keyword removed");
    } catch (e) {
      toast.error("Failed to delete keyword");
    }
  };

  const triggerNow = async () => {
    setTriggering(true);
    try {
      await apiFetch("/admin/blog-automation/trigger", { method: "POST" });
      toast.info("AI Generation started in background");
      fetchProgress();
    } catch (e) {
      toast.error("Failed to trigger generation");
    } finally {
      setTriggering(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold flex items-center gap-3">
            <Zap className="text-primary w-8 h-8" /> 
            AI Blogging Engine
          </h1>
          <p className="text-muted-foreground mt-1">Manage manual triggers and SEO keyword pool.</p>
        </div>
        <Button 
          size="lg" 
          className="gradient-primary rounded-2xl px-8" 
          onClick={triggerNow}
          disabled={triggering || (progress !== null && progress.percent < 100)}
        >
          {triggering ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
          Trigger Generation Now
        </Button>
      </div>

      {progress && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex justify-between items-center">
              <span>Current Status: {progress.status}</span>
              <span className="text-primary">{progress.percent}%</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={progress.percent} className="h-3" />
            <p className="text-xs text-muted-foreground mt-2 italic flex items-center gap-1">
              <Info className="w-3 h-3" /> AI is crafting premium magazine-styled content...
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card className="glass rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="w-4 h-4" /> Global Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Automation Strategy</p>
                  <p className="text-xs text-muted-foreground">Enabled cron-based blogging</p>
                </div>
                <Switch 
                  checked={config.is_enabled} 
                  onCheckedChange={handleToggle} 
                />
              </div>
              <div className="pt-2">
                <p className="text-xs text-muted-foreground bg-secondary/50 p-3 rounded-xl border border-border">
                  <span className="font-bold text-foreground">Note:</span> AI will pick the "Least Recently Used" keyword from your active pool automatically.
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg">Database Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Active Keywords:</span>
                <span className="font-medium">{keywords.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] ${config.is_enabled ? 'bg-primary/20 text-primary' : 'bg-destructive/20 text-destructive'}`}>
                  {config.is_enabled ? 'AUTONOMOUS' : 'MANUAL ONLY'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="glass rounded-2xl h-full flex flex-col">
            <CardHeader>
              <CardTitle className="text-xl">SEO Keyword Pool</CardTitle>
              <CardDescription>Add keywords that the AI will use to research and write blogs.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col space-y-4">
              <div className="flex gap-2">
                <Input 
                  placeholder="e.g. Benefits of SMM in 2024" 
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  className="rounded-xl"
                  onKeyDown={(e) => e.key === 'Enter' && addKeyword()}
                />
                <Button onClick={addKeyword} className="rounded-xl">
                  <Plus className="w-4 h-4 mr-1" /> Add
                </Button>
              </div>

              <div className="border border-border rounded-xl overflow-hidden flex-1">
                <table className="w-full text-sm">
                  <thead className="bg-secondary/30">
                    <tr className="border-b border-border">
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Keyword</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Last Used</th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {keywords.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-4 py-12 text-center text-muted-foreground">
                          No keywords added yet. Add your first SEO target above.
                        </td>
                      </tr>
                    ) : keywords.map((k) => (
                      <tr key={k.id} className="hover:bg-secondary/20 transition-colors">
                        <td className="px-4 py-3 font-medium">{k.keyword}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          {k.last_used_at ? new Date(k.last_used_at).toLocaleDateString() : "Never"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-muted-foreground hover:text-destructive"
                            onClick={() => deleteKeyword(k.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass rounded-xl p-4 flex items-center gap-4">
          <div className="bg-primary/20 p-2 rounded-lg text-primary">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-medium italic">"Every AI post is automatically pushed to the frontend live blog page once generation is 100% complete."</p>
          </div>
        </div>
        <div className="glass rounded-xl p-4 flex items-center gap-4 border-l-4 border-l-yellow-500">
          <AlertCircle className="w-5 h-5 text-yellow-500" />
          <p className="text-xs text-muted-foreground">
            Ensure your <strong>GEMINI_API_KEY</strong> is correctly set in your .env file on the cPanel server for the engine to connect.
          </p>
        </div>
      </div>
    </div>
  );
}
