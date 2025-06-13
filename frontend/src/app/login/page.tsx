"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TextField, Button, Container, Typography, Box } from "@mui/material";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { AxiosError } from "axios";

const LoginPage = () => {
  const { login } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(username, password);
      router.push("/");
    } catch (err: unknown) {
      const detail = (err as AxiosError<{ detail?: string }>)?.response?.data?.detail ?? t("auth.loginFailed");
      setError(detail);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Typography variant="h4" gutterBottom>
        {t("auth.login")}
      </Typography>
      <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <TextField label={t("username")} value={username} onChange={(e) => setUsername(e.target.value)} required />
        <TextField label={t("password")} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error && (
          <Typography color="error" variant="body2">
            {error}
          </Typography>
        )}
        <Button variant="contained" type="submit">
          {t("auth.login")}
        </Button>
      </Box>
    </Container>
  );
};

export default LoginPage; 