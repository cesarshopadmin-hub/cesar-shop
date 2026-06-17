import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Languages } from "lucide-react";

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const nextLang = i18n.language === "ar" ? "en" : "ar";
    i18n.changeLanguage(nextLang);
  };

  useEffect(() => {
    const currentLang = i18n.language || "ar";
    document.documentElement.lang = currentLang;
    document.documentElement.dir = i18n.dir();
  }, [i18n.language]);

  return (
    <button
      onClick={toggleLanguage}
      className="fixed bottom-20 left-6 md:bottom-8 md:left-8 z-50 flex items-center justify-center gap-2 p-3 rounded-full bg-cesar-dark/80 backdrop-blur-md border border-cesar-cyan/50 text-white font-semibold shadow-lg hover:shadow-neon-cyan transition-all duration-300 hover:scale-105 active:scale-95 group"
      aria-label="Toggle Language"
    >
      <Languages className="w-5 h-5 text-cesar-cyan group-hover:rotate-12 transition-transform duration-300" />
      <span className="text-sm font-cairo">
        {i18n.language === "ar" ? "English" : "العربية"}
      </span>
    </button>
  );
}
