"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Snackbar,
  Alert,
} from "@mui/material";
import api from "../../../../utils/api";
import { useAuth } from "../../../../context/AuthContext";
import { useLanguage } from "../../../../context/LanguageContext";

interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  date_of_birth?: string;
  address?: string;
  role: number;
  doctor_id?: number | null;
}

const UserDetailPage = () => {
  const params = useParams();
  const userId = Number(params?.id);
  const { token, user: currentUser } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!currentUser || currentUser.role !== 1) {
      router.replace("/");
      return;
    }

    const fetchDetail = async () => {
      try {
        const [{ data: detail }, { data: users }] = await Promise.all([
          api.get<User>(`/admin/users/${userId}`, { headers: { Authorization: `Bearer ${token}` } }),
          api.get<User[]>("/admin/users", { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        setUser(detail);
        setAllUsers(users);
      } catch (e) {
        console.error(e);
      }
    };
    fetchDetail();
  }, [userId, token, currentUser, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) return;
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        username: user.username,
        email: user.email,
        role: user.role,
        doctor_id: user.doctor_id,
      };

      if (user.first_name?.trim()) payload.first_name = user.first_name;
      if (user.last_name?.trim()) payload.last_name = user.last_name;
      if (user.address?.trim()) payload.address = user.address;
      if (user.date_of_birth) payload.date_of_birth = user.date_of_birth;

      await api.put(`/admin/users/${userId}`, payload, { headers: { Authorization: `Bearer ${token}` } });
      setSaved(true);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  // For doctors, list patients; for patients, show doctor name
  const patients = allUsers.filter((u) => u.doctor_id === user.id);
  const doctor = allUsers.find((u) => u.id === user.doctor_id);

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        {t("inspect")} - {user.username}
      </Typography>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2, maxWidth: 500 }}>
        <TextField label={t("username")} name="username" value={user.username} onChange={handleChange} />
        <TextField label={t("email")} name="email" value={user.email} onChange={handleChange} />
        <TextField label={t("firstName")} name="first_name" value={user.first_name || ""} onChange={handleChange} />
        <TextField label={t("lastName")} name="last_name" value={user.last_name || ""} onChange={handleChange} />
        <TextField label={t("dateOfBirth")} type="date" name="date_of_birth" value={user.date_of_birth || ""} onChange={handleChange} InputLabelProps={{ shrink: true }} />
        <TextField label={t("address")} name="address" value={user.address || ""} onChange={handleChange} />
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button variant="outlined" onClick={() => router.push("/admin/users")}>{t("back")}</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>{saving ? "Saving..." : t("save")}</Button>
        </Box>
      </Box>

      <Snackbar open={saved} autoHideDuration={3000} onClose={() => setSaved(false)}>
        <Alert severity="success" variant="filled" onClose={() => setSaved(false)} sx={{ width: "100%" }}>
          {t("saved")}
        </Alert>
      </Snackbar>

      {user.role === 2 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>{t("patients")}</Typography>
          {patients.length === 0 ? (
            <Typography color="text.secondary">{t("noData")}</Typography>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t("username")}</TableCell>
                  <TableCell>{t("firstName")}</TableCell>
                  <TableCell>{t("lastName")}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {patients.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{p.username}</TableCell>
                    <TableCell>{p.first_name}</TableCell>
                    <TableCell>{p.last_name}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Box>
      )}

      {user.role === 3 && doctor && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>{t("doctor")}</Typography>
          <Typography>{doctor.first_name} {doctor.last_name} ({doctor.username})</Typography>
        </Box>
      )}
    </Container>
  );
};

export default UserDetailPage; 