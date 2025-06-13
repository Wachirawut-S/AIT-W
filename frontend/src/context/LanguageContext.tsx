"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import jaTranslations from "../locales/ja.json";
import enTranslations from "../locales/en.json";

type Locale = "ja" | "en";
type Translations = typeof jaTranslations;

interface LanguageContextProps {
  locale: Locale;
  translations: Translations;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

const getTranslations = (locale: Locale): Translations => {
  return locale === "ja" ? jaTranslations : enTranslations;
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [locale, setLocaleState] = useState<Locale>("ja"); // default to Japanese

  // Load saved language preference
  useEffect(() => {
    const saved = localStorage.getItem("locale") as Locale;
    if (saved && (saved === "ja" || saved === "en")) {
      setLocaleState(saved);
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem("locale", newLocale);
  };

  const translations = getTranslations(locale);

  // Helper function to get nested translation
  const t = (key: string): string => {
    const keys = key.split(".");
    let current: unknown = translations;
    
    for (const k of keys) {
      if (current && typeof current === "object" && current !== null && k in current) {
        current = (current as Record<string, unknown>)[k];
      } else {
        return key; // Return key if translation not found
      }
    }
    
    return typeof current === "string" ? current : key;
  };

  return (
    <LanguageContext.Provider value={{ locale, translations, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}; 