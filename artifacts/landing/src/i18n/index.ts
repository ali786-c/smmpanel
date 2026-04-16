import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "./locales/en.json";
import es from "./locales/es.json";
import fr from "./locales/fr.json";
import ar from "./locales/ar.json";
import ko from "./locales/ko.json";
import ja from "./locales/ja.json";
import bn from "./locales/bn.json";
import hi from "./locales/hi.json";
import de from "./locales/de.json";
import it from "./locales/it.json";
import pt from "./locales/pt.json";
import nl from "./locales/nl.json";
import tr from "./locales/tr.json";
import ru from "./locales/ru.json";

export const supportedLanguages = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "it", label: "Italiano" },
  { code: "pt", label: "Português" },
  { code: "nl", label: "Nederlands" },
  { code: "tr", label: "Türkçe" },
  { code: "ru", label: "Русский" },
  { code: "ar", label: "العربية", dir: "rtl" },
  { code: "hi", label: "हिन्दी" },
  { code: "bn", label: "বাংলা" },
  { code: "ko", label: "한국어" },
  { code: "ja", label: "日本語" },
] as const;

const supportedCodes = supportedLanguages.map((l) => l.code);

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      es: { translation: es },
      fr: { translation: fr },
      ar: { translation: ar },
      ko: { translation: ko },
      ja: { translation: ja },
      bn: { translation: bn },
      hi: { translation: hi },
      de: { translation: de },
      it: { translation: it },
      pt: { translation: pt },
      nl: { translation: nl },
      tr: { translation: tr },
      ru: { translation: ru },
    },
    fallbackLng: "en",
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator", "htmlTag"],
      caches: ["localStorage"],
      lookupLocalStorage: "i18n_lang",
      convertDetectedLanguage: (lng: string) => {
        const base = lng.split("-")[0];
        return supportedCodes.includes(base as any) ? base : "en";
      },
    },
  });

export default i18n;