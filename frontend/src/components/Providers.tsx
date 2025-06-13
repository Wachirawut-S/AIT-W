"use client";

import { ThemeProvider, CssBaseline } from "@mui/material";
import theme from "../theme";
import { AuthProvider } from "../context/AuthContext";
import { LanguageProvider } from "../context/LanguageContext";
import { ReactNode } from "react";

const Providers = ({ children }: { children: ReactNode }) => (
  <LanguageProvider>
    <AuthProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </AuthProvider>
  </LanguageProvider>
);

export default Providers; 