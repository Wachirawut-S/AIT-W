"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Container,
  Typography,
  TextField,
  Box,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  Snackbar,
  Alert,
} from "@mui/material";
import api from "../../../../utils/api";
import { useAuth } from "../../../../context/AuthContext";
import { useLanguage } from "../../../../context/LanguageContext";

interface User {
  id: number;
  username: string;
  first_name?: string;
  last_name?: string;
}

const AddPatientPage = () => {
  const { user, token } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  const [list, setList] = useState<User[]>([]);
  const [q, setQ] = useState("");
  const [snack, setSnack] = useState<string | null>(null);

  useEffect(()=>{
    if(!user || user.role !==2){ router.replace("/"); return; }
    const fetchAvail = async ()=>{
      const {data}= await api.get<User[]>("/doctor/patients/available", { headers:{Authorization:`Bearer ${token}`} });
      setList(data);
    };
    fetchAvail();
  },[user, token, router]);

  const filtered = list.filter((p)=>{
    const key=q.toLowerCase();
    return p.username.toLowerCase().includes(key)||(p.first_name?.toLowerCase()||"").includes(key);
  });

  const handleBind = async (id:number)=>{
    await api.post(`/doctor/patients/${id}/bind`, {}, { headers:{Authorization:`Bearer ${token}`} });
    setSnack(t("saved"));
    router.push("/doctor/patients");
  }

  return (
    <Container sx={{ mt:4 }}>
      <Box sx={{ display:"flex", justifyContent:"space-between", alignItems:"center", mb:2 }}>
        <Typography variant="h4">{t("add")} {t("patients")}</Typography>
        <Box sx={{ display:"flex", gap:2 }}>
          <TextField size="small" label={t("search")} value={q} onChange={(e)=>setQ(e.target.value)} />
          <Button variant="outlined" onClick={()=>router.back()}>{t("back")}</Button>
        </Box>
      </Box>

      {filtered.length===0 ? (
        <Typography color="text.secondary">{t("noData")}</Typography>
      ):(
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
            {filtered.map(p=>(
              <TableRow key={p.id}>
                <TableCell>{p.username}</TableCell>
                <TableCell>{p.first_name}</TableCell>
                <TableCell>{p.last_name}</TableCell>
                <TableCell><Button size="small" variant="contained" onClick={()=>handleBind(p.id)}>{t("bound")}</Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Snackbar open={!!snack} autoHideDuration={3000} onClose={()=>setSnack(null)}>
        <Alert severity="success" variant="filled" onClose={()=>setSnack(null)}>{snack}</Alert>
      </Snackbar>
    </Container>
  );
};

export default AddPatientPage; 