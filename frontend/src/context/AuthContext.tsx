import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import api from "../utils/api";

interface User {
  username: string;
  role: number;
}

interface AuthContextProps {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  // Persist token in localStorage for now (simple) ---------------------------
  useEffect(() => {
    const stored = localStorage.getItem("jwt");
    if (stored) {
      setToken(stored);
      // Decode payload from JWT. Role is provided by backend from v2.
      const payload = JSON.parse(atob(stored.split(".")[1]));
      setUser({ username: payload.sub, role: payload.role ?? 3 });
    }
  }, []);

  const login = async (username: string, password: string) => {
    const params = new URLSearchParams();
    params.append("username", username);
    params.append("password", password);

    const { data } = await api.post("/auth/login", params, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    setToken(data.access_token);
    localStorage.setItem("jwt", data.access_token);
    const payload = JSON.parse(atob(data.access_token.split(".")[1]));
    setUser({ username: payload.sub, role: payload.role ?? 3 });
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("jwt");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}; 