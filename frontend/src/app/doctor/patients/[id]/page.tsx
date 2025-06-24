"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Container, Typography, Box, Paper, Button, Dialog, DialogTitle, DialogContent, FormControlLabel, Checkbox, DialogActions, Select, MenuItem, InputLabel, FormControl, Table, TableHead, TableRow, TableCell, TableBody } from "@mui/material";
import { useAuth } from "../../../../context/AuthContext";
import { useLanguage } from "../../../../context/LanguageContext";
import api from "../../../../utils/api";
import HistoryIcon from "@mui/icons-material/History";

interface Patient {
  id: number;
  username: string;
  first_name?: string;
  last_name?: string;
  email: string;
  date_of_birth?: string;
  address?: string;
}

interface Assignment{ id:number; title:string; topic:number; }
interface RecordOut{ assignment_id:number; finished_at?:string|null; score?:number|null; }

export default function PatientInspectPage() {
  const { user, token } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const params = useParams();
  const pid = params?.id as string;

  const [patient, setPatient] = useState<Patient | null>(null);

  // dialog state
  const [dlgOpen,setDlgOpen]=useState(false);
  const [topic,setTopic]=useState<number|"all">("all");
  const [assignments,setAssignments]=useState<Assignment[]>([]);
  const [selected,setSelected]=useState<Set<number>>(new Set());

  // list state
  const [assigned,setAssigned]=useState<Assignment[]>([]);
  const [scoreMap,setScoreMap]=useState<Record<number,string>>({});
  const [attemptsMap,setAttemptsMap]=useState<Record<number,number>>({});
  const [totalMap,setTotalMap]=useState<Record<number,number>>({});

  const loadAssignments = async (topicParam: number | "all") => {
    const { data } = await api.get<Assignment[]>(
      "/doctor/assignments",
      {
        headers: { Authorization: `Bearer ${token}` },
        params: topicParam === "all" ? {} : { topic: topicParam },
      }
    );
    // Exclude assignments already linked to this patient
    const filtered = data.filter((a) => !assigned.some((b) => b.id === a.id));
    setAssignments(filtered);
  };

  useEffect(() => {
    if (!user || user.role !== 2) {
      router.replace("/");
      return;
    }
    const fetch = async () => {
      const { data } = await api.get<Patient>(`/doctor/patients/${pid}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPatient(data);

      const ares = await api.get<Assignment[]>(`/doctor/patients/${pid}/assignments`,{headers:{Authorization:`Bearer ${token}`}});
      setAssigned(ares.data);

      const recRes=await api.get<RecordOut[]>(`/doctor/patients/${pid}/records`,{headers:{Authorization:`Bearer ${token}`} });

      const att:Record<number,number>={};
      const score:Record<number,string>={};
      recRes.data.forEach(r=>{ att[r.assignment_id]=(att[r.assignment_id]??0)+1; if(r.score!==null && r.score!==undefined) score[r.assignment_id]=String(r.score); });
      setAttemptsMap(att); setScoreMap(score);

      // fetch total MCQ per assignment (can be parallel)
      const totals:Record<number,number>={};
      await Promise.all(ares.data.map(async(a)=>{
         try{
           const {data}=await api.get<{items:{type:string;answer_key?:number}[]}>(`/doctor/assignments/v2/${a.id}`,{headers:{Authorization:`Bearer ${token}`} });
           const total=data.items.filter(it=>it.type==="mcq" && it.answer_key!==undefined).length;
           totals[a.id]=total;
         }catch{}
      }));
      setTotalMap(totals);
    };
    fetch();
  }, [user, token, pid, router]);

  if (!patient) return null;

  return (
    <Container sx={{ mt: 4 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h4">
          {t("patient")} - {patient.username}
        </Typography>
        <Box sx={{display:"flex",gap:2}}>
          <Button variant="contained" onClick={()=>{setDlgOpen(true); loadAssignments("all");}}>{t("assign")}</Button>
          <Button variant="outlined" onClick={() => router.back()}>
            {t("back")}
          </Button>
        </Box>
      </Box>

      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Typography variant="h6" gutterBottom>{t("basicInfo")}</Typography>
        <Typography><b>{t("username")}:</b> {patient.username}</Typography>
        {patient.first_name && <Typography><b>{t("firstName")}:</b> {patient.first_name}</Typography>}
        {patient.last_name && <Typography><b>{t("lastName")}:</b> {patient.last_name}</Typography>}
        <Typography><b>{t("email")}:</b> {patient.email}</Typography>
        {patient.date_of_birth && (
          <Typography><b>{t("dob")}:</b> {patient.date_of_birth}</Typography>
        )}
        {patient.address && (
          <Typography><b>{t("address")}:</b> {patient.address}</Typography>
        )}
      </Paper>

      {assigned.length>0 && (
        <Paper sx={{p:3,borderRadius:3, mt:3}}>
          <Typography variant="h6" gutterBottom>{t("assignments")}</Typography>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{t("title")}</TableCell>
                <TableCell>{t("score")}</TableCell>
                <TableCell>{t("attempts")}</TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {assigned.map(a=> (
                <TableRow key={a.id}>
                  <TableCell>{a.title}</TableCell>
                  <TableCell>{ (scoreMap[a.id]!==undefined && totalMap[a.id]>0) ? `${scoreMap[a.id]}/${totalMap[a.id]}` : (scoreMap[a.id] ?? "-") }</TableCell>
                  <TableCell>{attemptsMap[a.id] ?? 0}</TableCell>
                  <TableCell align="right">
                    <Button size="small" variant="outlined" startIcon={<HistoryIcon/>} sx={{textTransform:"none", borderRadius:2}} onClick={()=>router.push(`/doctor/patients/${pid}/history/${a.id}`)}>{t("history")}</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      {/* Assignment dialog */}
      <Dialog open={dlgOpen} onClose={()=>setDlgOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t("assignments")}</DialogTitle>
        <DialogContent dividers>
          <FormControl size="small" sx={{ mb: 2, minWidth: 160 }}>
            <InputLabel>{t("topic")}</InputLabel>
            <Select value={topic} label={t("topic")} onChange={(e)=>{
                const val = e.target.value as number | "all";
                setTopic(val);
                loadAssignments(val);
            }}>
              <MenuItem value="all">{t("all")}</MenuItem>
              {Array.from({length:9},(_,i)=>i+1).map(num=> (
                <MenuItem key={num} value={num}>{t(`assignments.topic${num}`)}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {topic === "all" ? (
            Array.from({length:9},(_,i)=>i+1).map(tp=>{
               const list = assignments.filter(a=>a.topic===tp);
               if(list.length===0) return null;
               const allChecked = list.every(a=>selected.has(a.id));
               return (
                 <Box key={tp} sx={{mb:2, borderBottom:1, borderColor:"divider", pb:1}}>
                   <FormControlLabel control={<Checkbox checked={allChecked} onChange={(e)=>{
                       const next=new Set(selected);
                       if(e.target.checked) list.forEach(a=>next.add(a.id));
                       else list.forEach(a=>next.delete(a.id));
                       setSelected(next);
                   }} />} label={t(`assignments.topic${tp}`)} sx={{fontWeight:"bold"}} />
                   <Box sx={{pl:3}}>
                    {list.map(a=>(<FormControlLabel key={a.id} control={<Checkbox checked={selected.has(a.id)} onChange={(e)=>{
                       const next=new Set(selected);
                       if(e.target.checked) next.add(a.id); else next.delete(a.id);
                       setSelected(next);
                    }} />} label={a.title} />))}
                   </Box>
                 </Box>
               );
            })
          ) : (
            assignments.map(a=> (
              <FormControlLabel key={a.id} control={<Checkbox checked={selected.has(a.id)} onChange={(e)=>{
                 const next=new Set(selected);
                 if(e.target.checked) next.add(a.id); else next.delete(a.id);
                 setSelected(next);
              }} />} label={a.title} />
            ))
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setDlgOpen(false)}>{t("cancel")}</Button>
          <Button variant="contained" disabled={selected.size===0} onClick={async()=>{
             await api.post(`/doctor/patients/${pid}/assign`, { assignment_ids: [...selected] }, { headers: { Authorization: `Bearer ${token}` } });

             // --- Refresh tables & stats ------------------------------
             const ares = await api.get<Assignment[]>(`/doctor/patients/${pid}/assignments`, { headers: { Authorization: `Bearer ${token}` } });
             const newAssigned = ares.data;
             setAssigned(newAssigned);

             // Recompute attempts / scores
             const recRes = await api.get<RecordOut[]>(`/doctor/patients/${pid}/records`, { headers: { Authorization: `Bearer ${token}` } });
             const att: Record<number, number> = {};
             const score: Record<number, string> = {};
             recRes.data.forEach((r) => {
               att[r.assignment_id] = (att[r.assignment_id] ?? 0) + 1;
               if (r.score !== null && r.score !== undefined) score[r.assignment_id] = String(r.score);
             });
             setAttemptsMap(att);
             setScoreMap(score);

             const totals: Record<number, number> = {};
             await Promise.all(
               newAssigned.map(async (a) => {
                 try {
                   const { data } = await api.get<{ items: { type: string; answer_key?: number }[] }>(
                     `/doctor/assignments/v2/${a.id}`,
                     { headers: { Authorization: `Bearer ${token}` } }
                   );
                   totals[a.id] = data.items.filter((it) => it.type === "mcq" && it.answer_key !== undefined).length;
                 } catch {}
               })
             );
             setTotalMap(totals);

             setSelected(new Set());
             setDlgOpen(false);
          }}>{t("assign")}</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
} 