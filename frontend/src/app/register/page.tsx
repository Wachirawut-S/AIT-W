"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TextField, Button, Container, Typography, Box } from "@mui/material";
import api from "../../utils/api";
import { useLanguage } from "../../context/LanguageContext";
import { AxiosError } from "axios";

const RegisterPage = () => {
  const router = useRouter();
  const { t } = useLanguage();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    address: "",
  });
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError(t("auth.passwordsDoNotMatch"));
      return;
    }
    try {
      await api.post("/auth/register", {
        username: form.username,
        email: form.email,
        password: form.password,
        first_name: form.firstName,
        last_name: form.lastName,
        date_of_birth: form.dateOfBirth || undefined,
        address: form.address || undefined,
        role: 3,
      });
      router.push("/login");
    } catch (err: unknown) {
      // Use a typed AxiosError instead of `any` to satisfy ESLint
      type BackendError = { detail?: unknown };
      const axiosError = err as AxiosError<BackendError>;
      const detail = axiosError?.response?.data?.detail;
      let translatedError: string;

      // Specific backend error strings we translate directly
      if (detail === "Username already taken") {
        translatedError = t("auth.usernameAlreadyTaken");
      } else if (detail === "Email already registered") {
        translatedError = t("auth.emailAlreadyRegistered");
      } else if (Array.isArray(detail)) {
        // FastAPI validation errors come back as a list → collect the messages
        translatedError = detail.map((d: { msg?: string }) => d.msg).filter(Boolean).join("\n");
      } else if (typeof detail === "string") {
        translatedError = detail;
      } else {
        translatedError = t("auth.registrationFailed");
      }

      setError(translatedError);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Typography variant="h4" gutterBottom>
        {t("auth.register")}
      </Typography>
      <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <TextField name="username" label={t("username")}
          value={form.username} onChange={handleChange} required />
        <TextField name="email" label={t("email")} type="email"
          value={form.email} onChange={handleChange} required />
        <TextField name="firstName" label={t("firstName")}
          value={form.firstName} onChange={handleChange} />
        <TextField name="lastName" label={t("lastName")}
          value={form.lastName} onChange={handleChange} />
        <TextField name="dateOfBirth" type="date" label={t("dateOfBirth")} 
          value={form.dateOfBirth} onChange={handleChange} InputLabelProps={{ shrink: true }} />
        <TextField name="address" label={t("address")}
          value={form.address} onChange={handleChange} />
        <TextField name="password" label={t("password")}
          type="password" value={form.password} onChange={handleChange} required />
        <TextField name="confirmPassword" label={t("confirmPassword")}
          type="password" value={form.confirmPassword} onChange={handleChange} required />
        {error && (
          <Typography color="error" variant="body2">
            {error}
          </Typography>
        )}
        <Button variant="contained" type="submit">
          {t("auth.register")}
        </Button>
      </Box>
    </Container>
  );
};

export default RegisterPage; 