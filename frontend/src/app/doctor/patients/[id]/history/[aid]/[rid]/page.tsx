"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Container, Typography, Box, Chip, Button } from "@mui/material";
import { useAuth } from "../../../../../../../context/AuthContext";
import { useLanguage } from "../../../../../../../context/LanguageContext";
import api from "../../../../../../../utils/api";
import MultipleChoiceTry from "../../../../../../../components/assignment-try/MultipleChoiceTry";
import WritingTry from "../../../../../../../components/assignment-try/WritingTry";

interface Choice { text?:string; image?:string; }
interface MCQItem { type:"mcq"; id:number; prompt?:string; image_path?:string; choices:Choice[]; answer_key?:number; }
interface WritingItem { type:"writing"; id:number; prompt?:string; image_path?:string; answer_key?:string; manual_review:boolean; }

type Item = MCQItem | WritingItem;
interface Assignment { id:number; title:string; items:Item[]; }
interface RecordOut { id:number; assignment_id:number; score?:number|null; mcq_answers:{item_id:number; choice_index:number;}[]; writing_answers:{item_id:number; answer_text:string;}[]; }

type LegacyChoice = Choice | string;
interface LegacyItem { prompt?:string; image_path?:string; choices:LegacyChoice[]; answer_key?:string; }
interface LegacyAssignment { id:number; title:string; qtype:string; properties?:{manualReview?:boolean} & Record<string,unknown>; items:LegacyItem[]; }

export default function DoctorAttemptDetail(){
  const { user, token } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const params = useParams();
  const pid=params?.id as string;
  const aid=params?.aid as string;
  const rid=params?.rid as string;

  const [ass,setAss]=useState<Assignment|null>(null);
  const [record,setRecord]=useState<RecordOut|null>(null);
  const [responses,setResponses]=useState<(number|string|undefined)[]>([]);

  useEffect(()=>{
    if(!user||user.role!==2){ router.replace("/"); return; }
    const fetch=async()=>{
      const {data:recs}=await api.get<RecordOut[]>(`/doctor/patients/${pid}/records`,{headers:{Authorization:`Bearer ${token}`} });
      const rec=recs.find(r=>String(r.id)===rid);
      if(!rec){ router.back(); return; }
      setRecord(rec);

      try{
        const {data:assignment}=await api.get<Assignment>(`/doctor/assignments/v2/${aid}`,{headers:{Authorization:`Bearer ${token}`} });
        if(assignment.items && assignment.items.length>0){
          setAss(assignment);
        }else{
          throw new Error("empty");
        }
      }catch{
        // legacy fallback minimal types
        try{
          const {data:legacy}=await api.get<LegacyAssignment>(`/doctor/assignments/${aid}`,{headers:{Authorization:`Bearer ${token}`} });
          const items:Item[] = legacy.items.map((it:LegacyItem,idx:number)=>{
            if(legacy.qtype==="multiple_choice"){
              return {type:"mcq", id:idx, prompt:it.prompt, image_path:it.image_path, choices:it.choices as Choice[], answer_key: it.answer_key!==undefined? Number(it.answer_key):undefined} as MCQItem;
            }
            return {type:"writing", id:idx, prompt:it.prompt, image_path:it.image_path, answer_key: it.answer_key, manual_review: legacy.properties?.manualReview===true} as WritingItem;
          });
          setAss({id:legacy.id, title:legacy.title, items});
        }catch(err){ console.error(err); }
      }
    };
    fetch();
  },[user,token,pid,aid,rid,router]);

  useEffect(()=>{
    if(!ass||!record) return;
    const respArr:(number|string|undefined)[] = Array(ass.items.length).fill(undefined);
    record.mcq_answers.forEach(a=>{ const idx=ass.items.findIndex(it=>it.id===a.item_id); if(idx!==-1) respArr[idx]=a.choice_index;});
    record.writing_answers.forEach(w=>{ const idx=ass.items.findIndex(it=>it.id===w.item_id); if(idx!==-1) respArr[idx]=w.answer_text;});
    setResponses(respArr);
  },[ass,record]);

  if(!ass||!record) return null;
  const totalMcq=ass.items.filter(it=>it.type==="mcq" && it.answer_key!==undefined).length;
  const score=record.score??0;

  return (
    <Container sx={{mt:4, mb:6}}>
      <Box sx={{display:"flex",justifyContent:"space-between",alignItems:"center",mb:2}}>
        <Typography variant="h4">{t("detail")} - {ass.title}</Typography>
        {totalMcq>0 && <Chip label={`${t("score")}: ${score}/${totalMcq}`} color={score===totalMcq?"success":"primary"}/>}  
        <Button variant="outlined" onClick={()=>router.back()}>{t("back")}</Button>
      </Box>
      {ass.items.map((it,i)=>{
        if(it.type==="mcq") return <MultipleChoiceTry key={it.id} idx={i+1} item={it} selected={responses[i] as number|undefined} submitted={true} onSelect={()=>{}}/>;
        if(it.type==="writing") return <WritingTry key={it.id} idx={i+1} item={it} response={responses[i] as string|undefined} submitted={true} onChange={()=>{}}/>;
        return null;
      })}
    </Container>
  );
} 