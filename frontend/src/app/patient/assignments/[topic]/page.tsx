"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Container, Typography, Table, TableHead, TableRow, TableCell, TableBody, Button, Chip, Box } from "@mui/material";
import { useAuth } from "../../../../context/AuthContext";
import { useLanguage } from "../../../../context/LanguageContext";
import api from "../../../../utils/api";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import HistoryIcon from "@mui/icons-material/History";
import ReplayIcon from "@mui/icons-material/Replay";

interface Assignment { id:number; title:string; qtype:string; }
interface PatientRecord { assignment_id:number; finished_at?:string; score?:number|null; }

export default function PatientTopicPage(){
  const params=useParams();
  const topicNum=Number(params?.topic);
  const { user, token } = useAuth();
  const { t } = useLanguage();
  const router=useRouter();

  const [list,setList]=useState<Assignment[]>([]);
  const [records,setRecords]=useState<PatientRecord[]>([]);
  const [scoreMap,setScoreMap] = useState<Record<string,string>>({});
  const [attemptsMap,setAttemptsMap] = useState<Record<number,number>>({});

  useEffect(()=>{
    if(!user||user.role!==3){ router.replace("/"); return; }
    const fetch=async()=>{
      const {data}=await api.get<Assignment[]>(`/patient/assignments`,{headers:{Authorization:`Bearer ${token}`}, params:{topic:topicNum}});
      setList(data);
      const r=await api.get<PatientRecord[]>(`/patient/records`,{headers:{Authorization:`Bearer ${token}`}});
      setRecords(r.data);

      // compute latest score per assignment and fetch total counts
      const latest: Record<number, PatientRecord> = {};
      r.data.forEach(rec=>{
        if(rec.finished_at){
          const prev=latest[rec.assignment_id];
          if(!prev || new Date(rec.finished_at)>new Date(prev.finished_at!)){
            latest[rec.assignment_id]=rec;
          }
        }
      });

      const entries = Object.entries(latest);
      const totals: Record<string,string> = {};
      await Promise.all(entries.map(async ([aidStr, recObj])=>{
        const aidNum=Number(aidStr);
        try{
          const {data}=await api.get<{items:{type:string;answer_key?:number}[]}>(`/patient/assignments/v2/${aidNum}`,{headers:{Authorization:`Bearer ${token}`} });
          let totalMCQ=0;
          if(data.items && data.items.length>0){
            totalMCQ = data.items.filter(it=>it.type==="mcq" && it.answer_key!==undefined).length;
          }else{
            // legacy fallback minimal item array length not available for drag etc.
            const legacy=await api.get<{items: {choices:unknown[]}[]}>(`/patient/assignments/${aidNum}`,{headers:{Authorization:`Bearer ${token}`} });
            const items=legacy.data.items;
            totalMCQ = items.filter(it=>Array.isArray(it.choices)).length; // approximate
          }
          if(recObj.score!==null && recObj.score!==undefined && totalMCQ>0){
             totals[aidStr] = `${recObj.score}/${totalMCQ}`;
          }else if(recObj.score!==null && recObj.score!==undefined){
             totals[aidStr] = `${recObj.score}`;
          }
        }catch(err){ console.error(err);} 
      }));
      setScoreMap(totals);

      // attempts count per assignment
      const att: Record<number, number> = {};
      r.data.forEach(rec=>{ att[rec.assignment_id]=(att[rec.assignment_id]??0)+1; });
      setAttemptsMap(att);
    };
    fetch();
  },[user,token,topicNum,router]);

  const doneSet=new Set(records.filter(r=>r.finished_at).map(r=>r.assignment_id));

  return (
    <Container sx={{mt:4}}>
      <Box sx={{display:"flex",justifyContent:"space-between",alignItems:"center",mb:2}}>
        <Typography variant="h4" gutterBottom>{t(`assignments.topic${topicNum}`)}</Typography>
        <Button variant="outlined" onClick={()=>router.push(`/patient/assignments`)}>{t("back")}</Button>
      </Box>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>{t("title")}</TableCell>
            <TableCell>{t("score")}</TableCell>
            <TableCell>{t("attempts")}</TableCell>
            <TableCell align="right"></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {list.map(a=> (
            <TableRow key={a.id}>
              <TableCell>{a.title}</TableCell>
              <TableCell>{scoreMap[a.id]?.toString() ?? "-"}</TableCell>
              <TableCell>{attemptsMap[a.id] ?? 0}</TableCell>
              <TableCell align="right">
                <Box sx={{display:"flex", justifyContent:"flex-end", alignItems:"center"}}>
                  {doneSet.has(a.id)? (
                    <>
                      <Chip label={t("done")} color="success" variant="outlined" sx={{mr:1}}/>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<ReplayIcon/>}
                        sx={{mr:1, borderRadius:2, textTransform:"none"}}
                        onClick={()=>router.push(`/patient/assignments/${topicNum}/${a.id}/start`)}
                      >{t("retry")}</Button>
                    </>
                  ):(
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<PlayArrowIcon/>}
                      sx={{mr:1, borderRadius:2, textTransform:"none"}}
                      onClick={()=>router.push(`/patient/assignments/${topicNum}/${a.id}/start`)}
                    >{t("try")}</Button>
                  )}
                  {attemptsMap[a.id] ? (
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<HistoryIcon/>}
                      sx={{ borderRadius: 2, textTransform: "none" }}
                      onClick={() => router.push(`/patient/assignments/${topicNum}/${a.id}/history`)}
                    >
                      {t("history")}
                    </Button>
                  ) : null}
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Container>
  );
} 