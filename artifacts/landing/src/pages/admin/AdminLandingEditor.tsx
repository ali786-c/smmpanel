import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Save, RotateCcw, Eye, Loader2 } from "lucide-react";

interface LandingField {
  key: string;
  label: string;
  type: "text" | "textarea" | "number";
  section: string;
  placeholder: string;
}

const LANDING_FIELDS: LandingField[] = [
  // Hero
  { key: "landing_badge", label: "Hero Badge Text", type: "text", section: "Hero", placeholder: "e.g. #1 Social Media Marketing Platform" },
  { key: "landing_hero_title_1", label: "Hero Title Line 1", type: "text", section: "Hero", placeholder: "e.g. Grow Your Social Media" },
  { key: "landing_hero_title_2", label: "Hero Title Line 2 (highlighted)", type: "text", section: "Hero", placeholder: "e.g. With Intelligent Campaigns" },
  { key: "landing_hero_subtitle", label: "Hero Subtitle", type: "textarea", section: "Hero", placeholder: "Main description below the hero title" },
  { key: "landing_hero_cta_primary", label: "Primary CTA Button Text", type: "text", section: "Hero", placeholder: "e.g. Launch Campaign" },
  { key: "landing_hero_cta_secondary", label: "Secondary CTA Button Text", type: "text", section: "Hero", placeholder: "e.g. View Dashboard" },
  
  // Stats
  { key: "landing_stat_1_value", label: "Stat 1 Value", type: "text", section: "Stats", placeholder: "e.g. 50ms" },
  { key: "landing_stat_1_label", label: "Stat 1 Label", type: "text", section: "Stats", placeholder: "e.g. Avg Response" },
  { key: "landing_stat_2_value", label: "Stat 2 Value", type: "text", section: "Stats", placeholder: "e.g. 99.9%" },
  { key: "landing_stat_2_label", label: "Stat 2 Label", type: "text", section: "Stats", placeholder: "e.g. Uptime" },
  { key: "landing_stat_3_value", label: "Stat 3 Value", type: "text", section: "Stats", placeholder: "e.g. 24/7" },
  { key: "landing_stat_3_label", label: "Stat 3 Label", type: "text", section: "Stats", placeholder: "e.g. Campaign Support" },
  { key: "landing_stat_4_value", label: "Stat 4 Value", type: "text", section: "Stats", placeholder: "e.g. 10K+" },
  { key: "landing_stat_4_label", label: "Stat 4 Label", type: "text", section: "Stats", placeholder: "e.g. Campaign Templates" },

  // Trusted By
  { key: "landing_trusted_by_text", label: "Trusted By Header Text", type: "text", section: "Trusted By", placeholder: "e.g. Trusted by 3,200+ agencies worldwide" },
  { key: "landing_trusted_by_names", label: "Agency Names (comma-separated)", type: "text", section: "Trusted By", placeholder: "e.g. Growthify, ScaleUp Media, ViralReach" },

  // Features Section
  { key: "landing_features_title_1", label: "Features Title Part 1", type: "text", section: "Features", placeholder: "e.g. Built for" },
  { key: "landing_features_title_2", label: "Features Title Part 2 (highlighted)", type: "text", section: "Features", placeholder: "e.g. Marketing Agencies" },
  { key: "landing_features_subtitle", label: "Features Subtitle", type: "textarea", section: "Features", placeholder: "Description below features title" },

  // CTA Section
  { key: "landing_cta_title_1", label: "CTA Title Part 1", type: "text", section: "CTA", placeholder: "e.g. Ready to" },
  { key: "landing_cta_title_2", label: "CTA Title Part 2 (highlighted)", type: "text", section: "CTA", placeholder: "e.g. Scale Your Marketing" },
  { key: "landing_cta_description", label: "CTA Description", type: "textarea", section: "CTA", placeholder: "CTA section description text" },
  { key: "landing_cta_button", label: "CTA Button Text", type: "text", section: "CTA", placeholder: "e.g. Start Free Campaign" },

  // Trustpilot
  { key: "landing_trustpilot_rating", label: "Trustpilot Rating Text", type: "text", section: "Trustpilot", placeholder: "e.g. Excellent" },
  { key: "landing_trustpilot_reviews", label: "Trustpilot Reviews Count Text", type: "text", section: "Trustpilot", placeholder: "e.g. Based on 2,300+ reviews" },

  // Social Proof Numbers
  { key: "landing_social_proof_orders_floor", label: "Min Orders Delivered (floor)", type: "number", section: "Social Proof", placeholder: "e.g. 12847" },
  { key: "landing_social_proof_users_floor", label: "Min Active Users (floor)", type: "number", section: "Social Proof", placeholder: "e.g. 3200" },

  // Footer
  { key: "landing_footer_description", label: "Footer Description", type: "textarea", section: "Footer", placeholder: "Short company description in footer" },

  // Live Order Feed
  { key: "landing_live_feed_services", label: "Live Feed Service Names (one per line)", type: "textarea", section: "Live Feed", placeholder: "Instagram Growth Campaign\nYouTube Channel Promotion\nTikTok Brand Awareness" },

  // Support Links
  { key: "landing_support_telegram_url", label: "Telegram Channel URL", type: "text", section: "Support Links", placeholder: "e.g. https://t.me/yourchannel" },
  { key: "landing_support_discord_url", label: "Discord Server URL", type: "text", section: "Support Links", placeholder: "e.g. https://discord.gg/yourserver" },

  // SEO
  { key: "landing_meta_title", label: "Meta Title", type: "text", section: "SEO", placeholder: "Page title for search engines (max 60 chars)" },
  { key: "landing_meta_description", label: "Meta Description", type: "textarea", section: "SEO", placeholder: "Page description for search engines (max 160 chars)" },
  { key: "landing_og_title", label: "Open Graph Title", type: "text", section: "SEO", placeholder: "Title for social media sharing" },
  { key: "landing_og_description", label: "Open Graph Description", type: "textarea", section: "SEO", placeholder: "Description for social media sharing" },
];

const SECTIONS = [...new Set(LANDING_FIELDS.map(f => f.section))];

export default function AdminLandingEditor() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [originalValues, setOriginalValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState(SECTIONS[0]);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    const keys = LANDING_FIELDS.map(f => f.key);
    const { data } = await supabase
      .from("system_settings")
      .select("key, value")
      .in("key", keys);

    const vals: Record<string, string> = {};
    (data || []).forEach((row: any) => {
      vals[row.key] = row.value;
    });
    setValues(vals);
    setOriginalValues({ ...vals });
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const changedKeys = Object.keys(values).filter(k => values[k] !== originalValues[k]);
      // Also include new keys that weren't in original
      LANDING_FIELDS.forEach(f => {
        if (values[f.key] && !originalValues[f.key]) {
          changedKeys.push(f.key);
        }
      });

      for (const key of [...new Set(changedKeys)]) {
        const value = values[key] || "";
        // Upsert: try update first, insert if not exists
        const { data: existing } = await supabase
          .from("system_settings")
          .select("id")
          .eq("key", key)
          .maybeSingle();

        if (existing) {
          await supabase
            .from("system_settings")
            .update({ value, updated_at: new Date().toISOString() })
            .eq("key", key);
        } else {
          await supabase
            .from("system_settings")
            .insert({ key, value });
        }
      }

      setOriginalValues({ ...values });
      toast({ title: "Saved", description: `${changedKeys.length} landing page setting(s) updated.` });
    } catch (err) {
      toast({ title: "Error", description: "Failed to save settings.", variant: "destructive" });
    }
    setSaving(false);
  };

  const handleReset = () => {
    setValues({ ...originalValues });
  };

  const hasChanges = JSON.stringify(values) !== JSON.stringify(originalValues);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-heading font-bold">Landing Page Editor</h2>
          <p className="text-sm text-muted-foreground">Edit all landing page content, stats, CTAs, and SEO metadata.</p>
        </div>
        <div className="flex items-center gap-2">
          <a href="/" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm">
              <Eye className="w-4 h-4 mr-1" /> Preview
            </Button>
          </a>
          <Button variant="outline" size="sm" onClick={handleReset} disabled={!hasChanges}>
            <RotateCcw className="w-4 h-4 mr-1" /> Reset
          </Button>
          <Button size="sm" onClick={handleSave} disabled={!hasChanges || saving} className="gradient-primary text-primary-foreground">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
            Save Changes
          </Button>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex flex-wrap gap-2">
        {SECTIONS.map(section => (
          <button
            key={section}
            onClick={() => setActiveSection(section)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeSection === section
                ? "bg-primary/20 text-primary"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {section}
          </button>
        ))}
      </div>

      {/* Fields */}
      <div className="glass rounded-2xl p-6">
        <h3 className="font-heading font-semibold mb-4">{activeSection}</h3>
        <div className="space-y-4">
          {LANDING_FIELDS.filter(f => f.section === activeSection).map(field => (
            <div key={field.key}>
              <Label className="text-sm mb-1.5 block">{field.label}</Label>
              <p className="text-xs text-muted-foreground mb-2">Key: <code className="font-mono bg-muted px-1 py-0.5 rounded">{field.key}</code></p>
              {field.type === "textarea" ? (
                <Textarea
                  value={values[field.key] || ""}
                  onChange={(e) => setValues({ ...values, [field.key]: e.target.value })}
                  placeholder={field.placeholder}
                  rows={3}
                />
              ) : (
                <Input
                  type={field.type}
                  value={values[field.key] || ""}
                  onChange={(e) => setValues({ ...values, [field.key]: e.target.value })}
                  placeholder={field.placeholder}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {hasChanges && (
        <div className="sticky bottom-4 flex justify-end">
          <Button onClick={handleSave} disabled={saving} className="gradient-primary text-primary-foreground shadow-lg">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
            Save {Object.keys(values).filter(k => values[k] !== originalValues[k]).length} Change(s)
          </Button>
        </div>
      )}
    </div>
  );
}
