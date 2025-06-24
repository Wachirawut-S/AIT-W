"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Container, Typography, Box, Chip, Button } from "@mui/material";
import { useAuth } from "../../../../../../../context/AuthContext";
import { useLanguage } from "../../../../../../../context/LanguageContext";
import api from "../../../../../../../utils/api";
import MultipleChoiceTry from "../../../../../../../components/assignment-try/MultipleChoiceTry";
import WritingTry from "../../../../../../../components/assignment-try/WritingTry";

// ---------- Types (same as Try page) ----------
interface Choice { text?:string; image?:string; }
interface MCQItem { type:"mcq"; id:number; prompt?:string; image_path?:string; choices:Choice[]; answer_key?:number; }
interface WritingItem {
  type: "writing";
  id: number;
  prompt?: string;
  image_path?: string;
  answer_key?: string;
  manual_review: boolean;
  reviewed?: boolean;
  correct?: boolean | null;
}
// Skipping drag items for now.

type Item = MCQItem | WritingItem;

interface Assignment { id:number; title:string; items:Item[]; }

interface MCQAns { item_id:number; choice_index:number; is_correct:boolean; }
interface WritingAns { item_id:number; answer_text:string; reviewed:boolean; correct:boolean|null; }
interface RecordDetail { id:number; assignment_id:number; score?:number|null; mcq_answers:MCQAns[]; writing_answers:WritingAns[]; }

// ------------ Legacy fallback types -------------
type LegacyChoice = Choice | string;
interface LegacyItem { prompt?:string; image_path?:string; choices: LegacyChoice[]; answer_key?:string; }
interface LegacyAssignment { id:number; title:string; qtype:string; properties?: {manualReview?:boolean} & Record<string,unknown>; items: LegacyItem[]; }

export default function AttemptDetailPage(){
  const { user, token } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const params = useParams();
  const aid = params?.id as string; // assignment id
  const rid = params?.rid as string; // record id

  const [ass,setAss]=useState<Assignment|null>(null);
  const [record,setRecord]=useState<RecordDetail|null>(null);
  const [responses,setResponses]=useState<(number|string|undefined)[]>([]);

  useEffect(()=>{
    if(!user||user.role!==3){ router.replace("/"); return; }
    const fetch=async()=>{
      try{
        // fetch record detail list and pick the one
        const {data:rec}=await api.get<RecordDetail>(`/patient/records/detail/${rid}`,{headers:{Authorization:`Bearer ${token}`} });
        if(!rec || String(rec.assignment_id)!==aid){ router.back(); return; }
        setRecord(rec);
        // fetch assignment items (same as start page but read-only)
        const {data:assignment}=await api.get<Assignment>(`/patient/assignments/v2/${aid}`,{headers:{Authorization:`Bearer ${token}`} });
        let items:Item[];
        if(assignment.items.length===0){
          // fallback legacy
          const {data:legacy}=await api.get<LegacyAssignment>(`/patient/assignments/${aid}`,{headers:{Authorization:`Bearer ${token}`} });
          // transform minimal MCQ/Writing only (same as start page)
          items=legacy.items.map((it:LegacyItem,idx:number)=>{
            if(legacy.qtype==="multiple_choice"){
              return {type:"mcq",id:idx,prompt:it.prompt,image_path:it.image_path,choices:it.choices as Choice[],answer_key:it.answer_key?Number(it.answer_key):undefined} as MCQItem;
            }
            return {type:"writing",id:idx,prompt:it.prompt,image_path:it.image_path,answer_key:it.answer_key,manual_review: legacy.properties?.manualReview===true} as WritingItem;
          });
          setAss({id:legacy.id,title:legacy.title,items});
        }else{
          setAss(assignment);
        }
      }catch(err){ console.error(err); }
    };
    fetch();
  },[user,token,aid,rid,router]);

  // Build responses once both ass and record loaded
  useEffect(()=>{
    if(!ass||!record) return;
    const respArr:(number|string|undefined)[] = Array(ass.items.length).fill(undefined);
    record.mcq_answers.forEach(a=>{
      const idx=ass.items.findIndex(it=>it.id===a.item_id);
      if(idx!==-1) respArr[idx]=a.choice_index;
    });
    record.writing_answers.forEach(w=>{
      const idx=ass.items.findIndex(it=>it.id===w.item_id);
      if(idx!==-1){
        respArr[idx]=w.answer_text;
        // inject review flags so WritingTry can show them
        const writable = ass.items[idx] as WritingItem;
        writable.reviewed = w.reviewed;
        writable.correct = w.correct;
      }
    });
    setResponses(respArr);
  },[ass,record]);

  if(!ass||!record) return null;

  const score=record.score??0;
  const totalMcq=ass.items.filter(it=>it.type==="mcq" && it.answer_key!==undefined).length;

  return (
    <Container sx={{mt:4, mb:6}}>
      <Box sx={{display:"flex",justifyContent:"space-between",alignItems:"center",mb:2}}>
        <Typography variant="h4">{t("detail")} - {ass.title}</Typography>
        {totalMcq>0 && <Chip label={`${t("score")}: ${score}/${totalMcq}`} color={score===totalMcq?"success":"primary"}/>}        
        <Button variant="outlined" onClick={()=>router.back()}>{t("back")}</Button>
      </Box>

      {ass.items.map((it,i)=>{
        if(it.type==="mcq"){
          return <MultipleChoiceTry key={it.id} idx={i+1} item={it} selected={responses[i] as number|undefined} submitted={true} onSelect={()=>{}}/>;
        }
        if(it.type==="writing"){
          return <WritingTry key={it.id} idx={i+1} item={it} response={responses[i] as string|undefined} submitted={true} onChange={()=>{}}/>;
        }
        return null;
      })}
    </Container>
  );
} 