"use client";

import { ThemeModeProvider } from "../context/ThemeContext";
import { AuthProvider } from "../context/AuthContext";
import { LanguageProvider } from "../context/LanguageContext";
import { ReactNode } from "react";

const Providers = ({ children }: { children: ReactNode }) => (
  <LanguageProvider>
    <AuthProvider>
      <ThemeModeProvider>
        {children}
      </ThemeModeProvider>
    </AuthProvider>
  </LanguageProvider>
);

export default Providers; 