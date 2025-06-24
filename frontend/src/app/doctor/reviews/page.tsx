"use client";

import { useEffect, useState } from "react";
import { Container, Typography, Button, Box, Paper, TextField } from "@mui/material";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import { useLanguage } from "../../../context/LanguageContext";
import api from "../../../utils/api";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import Divider from "@mui/material/Divider";
import React from "react";

interface ReviewItem {
  answer_id:number;
  record_id:number;
  patient_id:number;
  patient_name:string;
  assignment_id:number;
  assignment_title:string;
  prompt?:string|null;
  answer_text:string;
  reviewed:boolean;
  correct?:boolean|null;
}

interface Group {
  record_id: number;
  patient_name: string;
  assignment_id: number;
  assignment_title: string;
  answers: ReviewItem[];
}

export default function ReviewPage(){
  const { user, token } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  const [list,setList]=useState<ReviewItem[]>([]);
  const [loading,setLoading]=useState(true);

  const fetchList= React.useCallback(async ()=>{
    try{
      const {data}=await api.get<ReviewItem[]>("/doctor/reviews",{headers:{Authorization:`Bearer ${token}`} });
      setList(data);
    }catch(err){ console.error(err); }
    setLoading(false);
  }, [token]);

  useEffect(()=>{ if(user&&user.role===2){ fetchList(); } else {router.replace("/");}},[user, fetchList, router]);

  const handleMark = async (id: number, correct: boolean) => {
    try {
      await api.post(`/doctor/reviews/${id}`, { correct }, { headers: { Authorization: `Bearer ${token}` } });
      setList((prev) => prev.filter((it) => it.answer_id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Container sx={{ mt: 4 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h4">{t("review")}</Typography>
        <Button variant="outlined" onClick={() => router.back()}>{t("back")}</Button>
      </Box>

      {loading ? null : list.length === 0 ? (
        <Typography>{t("noData")}</Typography>
      ) : (
        <Box>
          {Object.values(list.reduce((acc:Record<number,Group>, cur)=>{
            const key=cur.record_id;
            if(!acc[key]) acc[key]={
              record_id: cur.record_id,
              patient_name: cur.patient_name,
              assignment_id: cur.assignment_id,
              assignment_title: cur.assignment_title,
              answers: []
            };
            acc[key].answers.push(cur);
            return acc;
          },{} as Record<number,Group>)).map((group)=>(
            <Paper key={group.record_id} sx={{p:3, mb:3, borderRadius:3}}>
              <Box sx={{display:"flex",justifyContent:"space-between",mb:1}}>
                <Typography fontWeight="bold">{group.patient_name}</Typography>
                <Typography variant="body2" color="text.secondary">#{group.assignment_id}</Typography>
              </Box>
              <Typography variant="h6" sx={{mb:1}}>{group.assignment_title}</Typography>
              {group.answers.map((ans:ReviewItem,idx:number)=>(
                <Box key={ans.answer_id} sx={{mb:2}}>
                  {ans.prompt && <Typography sx={{mb:0.5}}>{idx+1}. {ans.prompt}</Typography>}
                  <TextField fullWidth multiline value={ans.answer_text} InputProps={{readOnly:true}} />
                  <Box sx={{display:"flex", gap:2, mt:1}}>
                     <Button size="small" variant="contained" color="success" startIcon={<CheckIcon/>} onClick={()=>handleMark(ans.answer_id,true)}>{t("correct")}</Button>
                     <Button size="small" variant="contained" color="error" startIcon={<CloseIcon/>} onClick={()=>handleMark(ans.answer_id,false)}>{t("wrong")}</Button>
                  </Box>
                  {idx<group.answers.length-1 && <Divider sx={{mt:2}}/>}
                </Box>
              ))}
            </Paper>
          ))}
        </Box>
      )}
    </Container>
  );
}