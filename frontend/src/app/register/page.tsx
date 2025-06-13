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
      const backendError = (err as AxiosError<{ detail?: string }>)?.response?.data?.detail;
      let translatedError: string;
      
      // Translate specific backend error messages
      if (backendError === "Username already taken") {
        translatedError = t("auth.usernameAlreadyTaken");
      } else if (backendError === "Email already registered") {
        translatedError = t("auth.emailAlreadyRegistered");
      } else {
        translatedError = backendError ?? t("auth.registrationFailed");
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