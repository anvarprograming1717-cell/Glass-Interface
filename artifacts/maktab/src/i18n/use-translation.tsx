import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, TranslationKey, translations } from './translations';

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    const saved = localStorage.getItem('maktab-lang');
    return (saved as Language) || 'uz';
  });

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem('maktab-lang', newLang);
  };

  const t = (key: TranslationKey): string => {
    return translations[lang][key] || translations['en'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
}
