"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableRow, Button, Container, Typography, Box } from "@mui/material";
import { useAuth } from "../../../context/AuthContext";
import { useLanguage } from "../../../context/LanguageContext";
import api from "../../../utils/api";
import TextField from "@mui/material/TextField";

interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: number;
  doctor_id?: number;
}

const UsersPage = () => {
  const { user, token } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    // Redirect non-admins away
    if (!user || user.role !== 1) {
      router.replace("/");
      return;
    }

    const fetchUsers = async () => {
      try {
        const { data } = await api.get<User[]>("/admin/users", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers(data);
      } catch (e) {
        console.error(e);
      }
    };
    fetchUsers();
  }, [user, token, router]);

  const handleInspect = (id: number) => {
    router.push(`/admin/users/${id}`);
  };

  const doctorsMap: Record<number,string> = Object.fromEntries(users.map(u=>[u.id, u.username]));
  const filtered = users.filter((u) => {
    const q = query.toLowerCase();
    return (
      u.username.toLowerCase().includes(q) ||
      (u.first_name?.toLowerCase() ?? "").includes(q)
    );
  });

  return (
    <Container sx={{ mt: 4 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h4">
          {t("navbar.manageUsers")}
        </Typography>
        <TextField size="small" label={t("search")} value={query} onChange={(e)=>setQuery(e.target.value)} />
      </Box>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>{t("username")}</TableCell>
            <TableCell>{t("firstName")}</TableCell>
            <TableCell>{t("lastName")}</TableCell>
            <TableCell>{t("email")}</TableCell>
            <TableCell>{t("role")}</TableCell>
            <TableCell>{t("bounded")}</TableCell>
            <TableCell></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filtered.map((u) => (
            <TableRow key={u.id}>
              <TableCell>{u.username}</TableCell>
              <TableCell>{u.first_name}</TableCell>
              <TableCell>{u.last_name}</TableCell>
              <TableCell>{u.email}</TableCell>
              <TableCell>{u.role === 1 ? t("navbar.admin") : u.role === 2 ? t("navbar.doctor") : t("user")}</TableCell>
              <TableCell>{u.role === 3 ? (u.doctor_id ? doctorsMap[u.doctor_id] ?? "-" : t("unbounded")) : "-"}</TableCell>
              <TableCell>
                <Button variant="outlined" size="small" onClick={() => handleInspect(u.id)}>
                  {t("inspect")}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Container>
  );
};

export default UsersPage; 