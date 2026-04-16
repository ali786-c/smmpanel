import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Save, Palette, Type, RotateCcw } from "lucide-react";

interface ThemeConfig {
  primary_color: string;
  primary_glow: string;
  background_dark: string;
  background_light: string;
  accent_color: string;
  success_color: string;
  warning_color: string;
  destructive_color: string;
  heading_font: string;
  body_font: string;
  border_radius: string;
  dark_mode_default: string;
}

const defaultTheme: ThemeConfig = {
  primary_color: "163 58% 50%",
  primary_glow: "155 100% 75%",
  background_dark: "213 50% 7%",
  background_light: "0 0% 100%",
  accent_color: "210 100% 60%",
  success_color: "163 58% 50%",
  warning_color: "38 92% 50%",
  destructive_color: "0 84% 60%",
  heading_font: "Space Grotesk",
  body_font: "DM Sans",
  border_radius: "0.75",
  dark_mode_default: "true",
};

const colorFields: { key: keyof ThemeConfig; label: string }[] = [
  { key: "primary_color", label: "Primary Color" },
  { key: "primary_glow", label: "Primary Glow" },
  { key: "background_dark", label: "Dark Background" },
  { key: "background_light", label: "Light Background" },
  { key: "accent_color", label: "Accent Color" },
  { key: "success_color", label: "Success Color" },
  { key: "warning_color", label: "Warning Color" },
  { key: "destructive_color", label: "Destructive Color" },
];

function hslToHex(hsl: string): string {
  try {
    const parts = hsl.trim().split(/\s+/);
    const h = parseFloat(parts[0]) || 0;
    const s = (parseFloat(parts[1]) || 0) / 100;
    const l = (parseFloat(parts[2]) || 0) / 100;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, "0");
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  } catch {
    return "#22c55e";
  }
}

function hexToHsl(hex: string): string {
  try {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
      else if (max === g) h = ((b - r) / d + 2) * 60;
      else h = ((r - g) / d + 4) * 60;
    }
    return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  } catch {
    return "163 58% 50%";
  }
}

export default function AdminThemeEditor() {
  const { user } = useAuth();
  const [theme, setTheme] = useState<ThemeConfig>(defaultTheme);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewDark, setPreviewDark] = useState(true);

  useEffect(() => {
    supabase.from("system_settings").select("key, value")
      .like("key", "theme_%")
      .then(({ data }) => {
        if (data?.length) {
          const loaded = { ...defaultTheme };
          data.forEach((s: any) => {
            const k = s.key.replace("theme_", "") as keyof ThemeConfig;
            if (k in loaded) loaded[k] = s.value;
          });
          setTheme(loaded);
        }
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const entries = Object.entries(theme);
    for (const [key, value] of entries) {
      const fullKey = `theme_${key}`;
      const { data: existing } = await supabase
        .from("system_settings").select("id").eq("key", fullKey).maybeSingle();
      if (existing) {
        await supabase.from("system_settings").update({ value, updated_by: user?.id }).eq("key", fullKey);
      } else {
        await supabase.from("system_settings").insert({ key: fullKey, value, updated_by: user?.id });
      }
    }

    // Apply theme to CSS
    applyTheme(theme);
    setSaving(false);
    toast.success("Theme saved & applied!");
  };

  const applyTheme = (t: ThemeConfig) => {
    const root = document.documentElement;
    root.style.setProperty("--primary", t.primary_color);
    root.style.setProperty("--accent", t.accent_color);
    root.style.setProperty("--destructive", t.destructive_color);
    root.style.setProperty("--radius", `${t.border_radius}rem`);
  };

  const handleReset = () => {
    setTheme(defaultTheme);
    toast.info("Reset to defaults — save to apply");
  };

  const updateColor = (key: keyof ThemeConfig, hex: string) => {
    setTheme((prev) => ({ ...prev, [key]: hexToHsl(hex) }));
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="font-heading font-bold text-xl flex items-center gap-2">
          <Palette className="w-5 h-5 text-primary" /> Theme Editor
        </h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="w-3 h-3 mr-1" /> Reset
          </Button>
          <Button onClick={handleSave} disabled={saving} className="gradient-primary text-primary-foreground font-bold gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Theme
          </Button>
        </div>
      </div>

      {/* Color Grid */}
      <div className="glass rounded-2xl p-6">
        <h3 className="font-heading font-semibold mb-4 flex items-center gap-2">
          <Palette className="w-4 h-4 text-primary" /> Colors
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {colorFields.map((cf) => (
            <div key={cf.key} className="flex items-center gap-3">
              <input
                type="color"
                value={hslToHex(theme[cf.key])}
                onChange={(e) => updateColor(cf.key, e.target.value)}
                className="w-10 h-10 rounded-lg border-2 border-border cursor-pointer bg-transparent"
              />
              <div className="flex-1">
                <p className="text-sm font-medium">{cf.label}</p>
                <p className="text-xs text-muted-foreground font-mono">{theme[cf.key]}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Typography */}
      <div className="glass rounded-2xl p-6">
        <h3 className="font-heading font-semibold mb-4 flex items-center gap-2">
          <Type className="w-4 h-4 text-primary" /> Typography
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Heading Font</label>
            <Input value={theme.heading_font} onChange={(e) => setTheme({ ...theme, heading_font: e.target.value })} className="bg-secondary/50" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Body Font</label>
            <Input value={theme.body_font} onChange={(e) => setTheme({ ...theme, body_font: e.target.value })} className="bg-secondary/50" />
          </div>
        </div>
      </div>

      {/* Misc */}
      <div className="glass rounded-2xl p-6">
        <h3 className="font-heading font-semibold mb-4">Appearance</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Border Radius</p>
              <p className="text-xs text-muted-foreground">Controls roundness of buttons and cards</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range" min="0" max="1.5" step="0.25"
                value={theme.border_radius}
                onChange={(e) => setTheme({ ...theme, border_radius: e.target.value })}
                className="w-32 accent-primary"
              />
              <span className="text-sm font-mono w-12 text-right">{theme.border_radius}rem</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Dark Mode Default</p>
              <p className="text-xs text-muted-foreground">New visitors see dark mode first</p>
            </div>
            <Switch
              checked={theme.dark_mode_default === "true"}
              onCheckedChange={(v) => setTheme({ ...theme, dark_mode_default: v ? "true" : "false" })}
            />
          </div>
        </div>
      </div>

      {/* Live Preview */}
      <div className="glass rounded-2xl p-6">
        <h3 className="font-heading font-semibold mb-4">Live Preview</h3>
        <div className="flex items-center gap-2 mb-4">
          <Button size="sm" variant={previewDark ? "default" : "outline"} onClick={() => setPreviewDark(true)}>Dark</Button>
          <Button size="sm" variant={!previewDark ? "default" : "outline"} onClick={() => setPreviewDark(false)}>Light</Button>
        </div>
        <div
          className="rounded-xl p-6 border border-border"
          style={{
            background: previewDark
              ? `hsl(${theme.background_dark})`
              : `hsl(${theme.background_light})`,
            color: previewDark ? "#e2e8f0" : "#1e293b",
          }}
        >
          <h4 style={{ fontFamily: theme.heading_font, fontSize: "1.25rem", fontWeight: 700, marginBottom: 8 }}>
            Preview Heading
          </h4>
          <p style={{ fontFamily: theme.body_font, fontSize: "0.875rem", marginBottom: 16, opacity: 0.7 }}>
            This is how your platform will look with the selected theme.
          </p>
          <div className="flex gap-2 flex-wrap">
            <span style={{ background: `hsl(${theme.primary_color})`, color: "#fff", padding: "6px 16px", borderRadius: `${theme.border_radius}rem`, fontSize: "0.8rem", fontWeight: 600 }}>
              Primary Button
            </span>
            <span style={{ background: `hsl(${theme.accent_color})`, color: "#fff", padding: "6px 16px", borderRadius: `${theme.border_radius}rem`, fontSize: "0.8rem" }}>
              Accent
            </span>
            <span style={{ background: `hsl(${theme.success_color})`, color: "#fff", padding: "6px 16px", borderRadius: `${theme.border_radius}rem`, fontSize: "0.8rem" }}>
              Success
            </span>
            <span style={{ background: `hsl(${theme.warning_color})`, color: "#fff", padding: "6px 16px", borderRadius: `${theme.border_radius}rem`, fontSize: "0.8rem" }}>
              Warning
            </span>
            <span style={{ background: `hsl(${theme.destructive_color})`, color: "#fff", padding: "6px 16px", borderRadius: `${theme.border_radius}rem`, fontSize: "0.8rem" }}>
              Danger
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
