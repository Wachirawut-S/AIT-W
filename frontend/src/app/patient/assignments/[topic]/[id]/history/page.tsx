"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Container,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Box,
  Button,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { useAuth } from "../../../../../../context/AuthContext";
import { useLanguage } from "../../../../../../context/LanguageContext";
import api from "../../../../../../utils/api";

interface MCQAnswer { item_id:number; choice_index:number; is_correct:boolean; }
interface WritingAnswer { item_id:number; answer_text:string; reviewed?:boolean; correct?:boolean|null; }
interface RecordItem {
  id:number;
  started_at:string;
  finished_at?:string|null;
  score?:number|null;
  mcq_answers:MCQAnswer[];
  writing_answers:WritingAnswer[];
}

export default function HistoryPage(){
  const { user, token } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const params = useParams();
  const aid = params?.id as string;

  const [records,setRecords]=useState<RecordItem[]>([]);

  useEffect(()=>{
    if(!user||user.role!==3){ router.replace("/"); return; }
    const fetch=async()=>{
      try{
        const {data}=await api.get<RecordItem[]>(`/patient/records/${aid}/history`,{headers:{Authorization:`Bearer ${token}`}});
        setRecords(data);
      }catch(err){ console.error(err); }
    };
    fetch();
  },[user,token,aid,router]);

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
                <TableCell>{new Date(rec.finished_at??rec.started_at).toLocaleString()}</TableCell>
                <TableCell>{rec.score!==null&&rec.score!==undefined? rec.score : "-"}</TableCell>
                <TableCell>
                  <IconButton onClick={()=>router.push(`/patient/assignments/${params?.topic}/${params?.id}/history/${rec.id}`)} title={t("detail")}
                  ><VisibilityIcon/></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Container>
  );
} 