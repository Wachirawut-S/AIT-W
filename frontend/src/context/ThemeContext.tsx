import { createContext, useContext, useMemo, useState, ReactNode } from "react";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { createTheme, ThemeOptions } from "@mui/material/styles";

interface ThemeCtx {
  mode: "light" | "dark";
  toggle: () => void;
}

const ThemeContext = createContext<ThemeCtx>({ mode: "light", toggle: () => {} });

export const useThemeMode = () => useContext(ThemeContext);

const getDesignTokens = (mode: "light" | "dark"): ThemeOptions => ({
  palette: {
    mode,
    primary: {
      main: "#3EB489",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#98FF98",
      contrastText: "#ffffff",
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 12, textTransform: "none" as const },
      },
    },
  },
});

export const ThemeModeProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setMode] = useState<"light" | "dark">("light");
  const theme = useMemo(() => createTheme(getDesignTokens(mode)), [mode]);
  const toggle = () => setMode((prev) => (prev === "light" ? "dark" : "light"));

  return (
    <ThemeContext.Provider value={{ mode, toggle }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
}; 