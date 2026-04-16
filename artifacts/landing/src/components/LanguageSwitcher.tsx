import { useTranslation } from "react-i18next";
import { supportedLanguages } from "@/i18n";
import { Globe } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function LanguageSwitcher({ className }: { className?: string }) {
  const { i18n } = useTranslation();

  const handleChange = (value: string) => {
    i18n.changeLanguage(value);
    document.documentElement.dir = value === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = value;
  };

  return (
    <div className={className}>
      <Select value={i18n.language?.split("-")[0] || "en"} onValueChange={handleChange}>
        <SelectTrigger className="w-[140px] h-8 text-xs">
          <Globe className="w-3.5 h-3.5 mr-1" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {supportedLanguages.map((lang) => (
            <SelectItem key={lang.code} value={lang.code}>
              {lang.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
