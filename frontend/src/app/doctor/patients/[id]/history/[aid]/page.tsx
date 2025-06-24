"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Container, Typography, Table, TableHead, TableRow, TableCell, TableBody, Button, Box } from "@mui/material";
import { useAuth } from "../../../../../../context/AuthContext";
import { useLanguage } from "../../../../../../context/LanguageContext";
import api from "../../../../../../utils/api";
import VisibilityIcon from "@mui/icons-material/Visibility";

interface RecordOut { id:number; assignment_id:number; finished_at?:string|null; score?:number|null; }
interface AssignmentData{ items:{type:string;answer_key?:number}[] }

export default function DoctorPatientHistory(){
  const { user, token } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const params = useParams();
  const pid = params?.id as string;
  const aid = params?.aid as string;

  const [records,setRecords]=useState<RecordOut[]>([]);
  const [total,setTotal]=useState<number>(0);

  useEffect(()=>{
    if(!user||user.role!==2){ router.replace("/"); return; }
    const fetch=async()=>{
      try{
        const {data}=await api.get<RecordOut[]>(`/doctor/patients/${pid}/records`,{headers:{Authorization:`Bearer ${token}`} });
        const filtered=data.filter(r=>String(r.assignment_id)===aid);
        setRecords(filtered);
        // fetch total MCQ for this assignment
        try{
          const {data:ass}=await api.get<AssignmentData>(`/doctor/assignments/v2/${aid}`,{headers:{Authorization:`Bearer ${token}`} });
          const tCnt=ass.items.filter(it=>it.type==="mcq" && it.answer_key!==undefined).length;
          setTotal(tCnt);
        }catch{}
      }catch(err){ console.error(err); }
    };
    fetch();
  },[user,token,pid,aid,router]);

  return (
    <Container sx={{mt:4}}>
      <Box sx={{display:"flex",justifyContent:"space-between",alignItems:"center",mb:2}}>
        <Typography variant="h4">{t("history")}</Typography>
        <Button variant="outlined" onClick={()=>router.back()}>{t("back")}</Button>
      </Box>
      {records.length===0? (
        <Typography>{t("noRecords")}</Typography>
      ):(
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{t("attempt")}</TableCell>
              <TableCell>{t("date")}</TableCell>
              <TableCell>{t("score")}</TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {records.map((rec,idx)=>(
              <TableRow key={rec.id}>
                <TableCell>{records.length - idx}</TableCell>
                <TableCell>{new Date(rec.finished_at??'').toLocaleString()}</TableCell>
                <TableCell>{rec.score!==null&&rec.score!==undefined && total>0? `${rec.score}/${total}`: (rec.score ?? "-") }</TableCell>
                <TableCell align="right"><Button size="small" variant="outlined" startIcon={<VisibilityIcon/>} sx={{textTransform:"none", borderRadius:2}} onClick={()=>router.push(`/doctor/patients/${pid}/history/${aid}/${rec.id}`)}>{t("detail")??"Detail"}</Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Container>
  );
} 