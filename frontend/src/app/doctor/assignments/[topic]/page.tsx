"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Container, Typography, Box, TextField, Table, TableHead, TableRow, TableCell, TableBody, Button } from "@mui/material";
import { useAuth } from "../../../../context/AuthContext";
import { useLanguage } from "../../../../context/LanguageContext";
import api from "../../../../utils/api";
import PreviewIcon from "@mui/icons-material/Visibility";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";

interface Assignment { id:number; title:string; qtype:string; }

export default function DoctorTopicAssignments(){
  const params = useParams();
  const topicNum = Number(params?.topic);
  const { user, token } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  const [list,setList]=useState<Assignment[]>([]);
  const [q,setQ]=useState("");

  useEffect(()=>{
    if(!user||user.role!==2){ router.replace("/"); return; }
    const fetch=async()=>{
      const {data}=await api.get<Assignment[]>("/doctor/assignments", { headers:{Authorization:`Bearer ${token}`}, params:{ topic: topicNum }});
      setList(data);
    };
    fetch();
  },[user,token,topicNum,router]);

  const filtered=list.filter(a=>a.title.toLowerCase().includes(q.toLowerCase()));

  return (
    <Container sx={{mt:4}}>
      <Box sx={{display:"flex",justifyContent:"space-between",alignItems:"center",mb:2}}>
        <Typography variant="h4">{t(`assignments.topic${topicNum}`)}</Typography>
        <Box sx={{display:"flex", gap:2}}>
          <TextField size="small" label={t("search")} value={q} onChange={(e)=>setQ(e.target.value)} />
          <Button variant="outlined" onClick={()=>router.push(`/doctor/assignments`)}>{t("back")}</Button>
        </Box>
      </Box>
      {filtered.length===0 ? (
        <Typography color="text.secondary">{t("noData")}</Typography>
      ):(
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{t("title")}</TableCell>
              <TableCell>{t("qtype")}</TableCell>
              <TableCell align="right"></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map(a=>(
              <TableRow key={a.id}>
                <TableCell>{a.title}</TableCell>
                <TableCell>{t(a.qtype)}</TableCell>
                <TableCell align="right">
                  <Box sx={{display:"flex", justifyContent:"flex-end", gap:1, flexWrap:"wrap"}}>
                    <Button size="small" variant="outlined" startIcon={<PreviewIcon/>} sx={{textTransform:"none", borderRadius:2}} onClick={()=>router.push(`/admin/assignments/${topicNum}/${a.id}/preview`)}>{t("preview")}</Button>
                    <Button size="small" variant="outlined" startIcon={<PlayArrowIcon/>} sx={{textTransform:"none", borderRadius:2}} onClick={()=>router.push(`/admin/assignments/${topicNum}/${a.id}/try`)}>{t("try")}</Button>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Container>
  );
} 