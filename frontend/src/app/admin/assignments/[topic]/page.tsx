"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Container, Typography, Box, TextField, Button, Table, TableHead, TableRow, TableCell, TableBody } from "@mui/material";
import { useAuth } from "../../../../context/AuthContext";
import { useLanguage } from "../../../../context/LanguageContext";
import api from "../../../../utils/api";
import PreviewIcon from "@mui/icons-material/Visibility";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogActions from "@mui/material/DialogActions";

interface Assignment { id:number; title:string; qtype:string; }

const TopicAssignmentsPage = () => {
  const params = useParams();
  const topicNum = Number(params?.topic);
  const { user, token } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  const [list, setList] = useState<Assignment[]>([]);
  const [q, setQ] = useState("");
  const [delId,setDelId]=useState<number|null>(null);

  useEffect(()=>{
    if(!user||user.role!==1){ router.replace("/"); return; }
    const fetchList = async()=>{
      const {data}= await api.get<Assignment[]>("/assignments/", { headers:{Authorization:`Bearer ${token}`}, params:{ topic: topicNum }});
      setList(data);
    };
    fetchList();
  },[user, token, topicNum, router]);

  const filtered = list.filter(a=> a.title.toLowerCase().includes(q.toLowerCase()));

  return (
    <Container sx={{ mt:4 }}>
      <Box sx={{ display:"flex", justifyContent:"space-between", alignItems:"center", mb:2 }}>
        <Typography variant="h4">{t(`assignments.topic${topicNum}`)}</Typography>
        <Box sx={{ display:"flex", gap:2 }}>
          <TextField size="small" label={t("search")} value={q} onChange={(e)=>setQ(e.target.value)} />
          <Button variant="contained" onClick={()=>router.push(`/admin/assignments/${topicNum}/add`)}>{t("addAssignment")}</Button>
          <Button variant="outlined" onClick={()=>router.push(`/admin/assignments`)}>{t("back")}</Button>
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
                  <Box sx={{display:"flex",justifyContent:"flex-end", gap:1, flexWrap:"wrap"}}>
                    <Button size="small" variant="outlined" startIcon={<PreviewIcon/>} sx={{textTransform:"none", borderRadius:2}} onClick={()=>router.push(`/admin/assignments/${topicNum}/${a.id}/preview`)}>{t("preview")}</Button>
                    <Button size="small" variant="outlined" startIcon={<PlayArrowIcon/>} sx={{textTransform:"none", borderRadius:2}} onClick={()=>router.push(`/admin/assignments/${topicNum}/${a.id}/try`)}>{t("try")}</Button>
                    <Button size="small" variant="outlined" startIcon={<EditIcon/>} sx={{textTransform:"none", borderRadius:2}} onClick={()=>router.push(`/admin/assignments/${topicNum}/${a.id}`)}>{t("edit")}</Button>
                    <Button size="small" variant="outlined" color="error" startIcon={<DeleteIcon/>} sx={{textTransform:"none", borderRadius:2}} onClick={()=>setDelId(a.id)}>{t("delete")}</Button>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={delId!==null} onClose={()=>setDelId(null)}>
        <DialogTitle>{t("confirmDelete")}</DialogTitle>
        <DialogActions>
          <Button onClick={()=>setDelId(null)}>{t("no")}</Button>
          <Button color="error" onClick={async()=>{
            if(delId){
              await api.delete(`/assignments/${delId}`, {headers:{Authorization:`Bearer ${token}`} });
              setList(list.filter(a=>a.id!==delId));
              setDelId(null);
            }
          }}>{t("yes")}</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default TopicAssignmentsPage; 