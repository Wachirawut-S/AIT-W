"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Container, Typography, Box, TextField, Button, Table, TableHead, TableRow, TableCell, TableBody } from "@mui/material";
import { useAuth } from "../../../context/AuthContext";
import { useLanguage } from "../../../context/LanguageContext";
import api from "../../../utils/api";

interface User {
  id: number;
  username: string;
  first_name?: string;
  last_name?: string;
  email: string;
}

const DoctorPatientsPage = () => {
  const { user, token } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  const [patients, setPatients] = useState<User[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!user || user.role !== 2) {
      router.replace("/");
      return;
    }

    const fetchPatients = async () => {
      const { data } = await api.get<User[]>("/doctor/patients", { headers: { Authorization: `Bearer ${token}` } });
      setPatients(data);
    };
    fetchPatients();
  }, [user, token, router]);

  const filtered = patients.filter((p) => {
    const key = q.toLowerCase();
    return p.username.toLowerCase().includes(key) || (p.first_name?.toLowerCase() ?? "").includes(key);
  });

  return (
    <Container sx={{ mt: 4 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h4">{t("patients")}</Typography>
        <Box sx={{ display: "flex", gap: 2 }}>
          <TextField size="small" label={t("search")} value={q} onChange={(e)=>setQ(e.target.value)} />
          <Button variant="contained" onClick={()=>router.push("/doctor/patients/add")}>{t("add")}</Button>
        </Box>
      </Box>

      {patients.length === 0 ? (
        <Typography color="text.secondary">{t("noData")}</Typography>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{t("username")}</TableCell>
              <TableCell>{t("firstName")}</TableCell>
              <TableCell>{t("lastName")}</TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((p)=>(
              <TableRow key={p.id}>
                <TableCell>{p.username}</TableCell>
                <TableCell>{p.first_name}</TableCell>
                <TableCell>{p.last_name}</TableCell>
                <TableCell>
                  <Button size="small" variant="outlined" onClick={()=>router.push(`/doctor/patients/${p.id}`)}>{t("inspect")}</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Container>
  );
};

export default DoctorPatientsPage; 