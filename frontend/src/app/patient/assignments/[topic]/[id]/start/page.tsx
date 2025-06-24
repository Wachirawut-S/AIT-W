"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Container, Typography, Box, Button, Chip } from "@mui/material";
import { useAuth } from "../../../../../../context/AuthContext";
import { useLanguage } from "../../../../../../context/LanguageContext";
import api from "../../../../../../utils/api";
import MultipleChoiceTry from "../../../../../../components/assignment-try/MultipleChoiceTry";
import WritingTry from "../../../../../../components/assignment-try/WritingTry";

// types
interface Choice { text?:string; image?:string; }
interface MCQItem { type:"mcq"; id:number; prompt?:string; image_path?:string; choices:Choice[]; answer_key?:number; }
interface WritingItem { type:"writing"; id:number; prompt?:string; image_path?:string; answer_key?:string; manual_review:boolean; }
type Item = MCQItem | WritingItem;
interface Assignment { id:number; title:string; items:Item[]; }

// legacy types
type LegacyChoice = Choice | string;
interface LegacyItem { prompt?:string; image_path?:string; choices:LegacyChoice[]; answer_key?:string; }
interface LegacyAssignment { id:number; title:string; qtype:string; properties?:Record<string,unknown>; items:LegacyItem[]; }

export default function PatientStartPage(){
  const { user, token } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const params=useParams();
  const aid=params?.id as string;

  const [ass,setAss]=useState<Assignment|null>(null);
  const [responses,setResponses]=useState<(number|string|undefined)[]>([]);
  const [submitted,setSubmitted]=useState(false);
  const [score,setScore]=useState(0);
  const [totalMcq,setTotalMcq]=useState(0);

  useEffect(()=>{
    if(!user||user.role!==3){ router.replace("/"); return; }
    const fetch=async()=>{
      try{
        const {data}=await api.get<Assignment>(`/patient/assignments/v2/${aid}`,{headers:{Authorization:`Bearer ${token}`} });
        if(data.items.length===0){
           const legacyResp=await api.get<LegacyAssignment>(`/patient/assignments/${aid}`,{headers:{Authorization:`Bearer ${token}`}});
           const legacy=legacyResp.data;
           const transformedItems: Item[] = legacy.items.map((it:LegacyItem, index:number)=>{
              if(legacy.qtype==="multiple_choice"){
                 return {type:"mcq", id:index, prompt:it.prompt, image_path:it.image_path, choices:it.choices as Choice[], answer_key:it.answer_key? Number(it.answer_key):undefined} as MCQItem;
              }
              return {type:"writing", id:index, prompt:it.prompt, image_path:it.image_path, answer_key:it.answer_key, manual_review: legacy.properties?.manualReview===true} as WritingItem;
           });
           const assign: Assignment={id:legacy.id,title:legacy.title,items:transformedItems};
           setAss(assign);
           setResponses(Array(transformedItems.length).fill(undefined));
        }else{
           setAss(data);
           setResponses(Array(data.items.length).fill(undefined));
        }
        await api.post(`/patient/records/${aid}/start`,{}, {headers:{Authorization:`Bearer ${token}`}});
      }catch(err){
        console.error(err);
        router.back();
      }
    };
    fetch();
  },[user,token,aid,router]);

  const handleMCQ=(idx:number, choice:number, correct:boolean)=>{
    setResponses(prev=>{const n=[...prev]; n[idx]=choice; return n;});
    api.post(`/patient/records/${aid}/mcq`,{item_id:(ass!.items[idx] as MCQItem).id, choice_index:choice, is_correct:correct},{headers:{Authorization:`Bearer ${token}`}});
  };
  const handleWriting=(idx:number, text:string)=>{
    setResponses(prev=>{const n=[...prev]; n[idx]=text; return n;});
  };
  const submit=async()=>{
    let sc=0,total=0;
    ass!.items.forEach((it,i)=>{
      if(it.type==="mcq" && it.answer_key!==undefined){
        total++; if(responses[i]===it.answer_key) sc++; return;
      }
      if(it.type==="writing" && !it.manual_review && it.answer_key){
        total++;
        const respStr=(responses[i]??"").toString().trim().toLowerCase();
        if(respStr===it.answer_key.trim().toLowerCase()) sc++;
      }
    });
    setScore(sc); setTotalMcq(total);
    await api.post(`/patient/records/${aid}/finish`,{score: total?sc:null},{headers:{Authorization:`Bearer ${token}`} });
    setSubmitted(true);

    // send writing answers (once)
    await Promise.all(ass!.items.map(async(it,i)=>{
      if(it.type==="writing" && responses[i]!==undefined){
        await api.post(`/patient/records/${aid}/writing`,{item_id:it.id, answer_text:responses[i]},{headers:{Authorization:`Bearer ${token}`} });
      }
    }));
  };

  const handleRetry=async()=>{
    await api.post(`/patient/records/${aid}/start`,{}, {headers:{Authorization:`Bearer ${token}`} });
    setResponses(Array(ass!.items.length).fill(undefined));
    setSubmitted(false);
    setScore(0);
    setTotalMcq(0);
  };

  if(!ass) return null;
  return (
    <Container sx={{mt:4, mb:6}}>
      <Box sx={{display:"flex", justifyContent:"space-between", alignItems:"center", mb:2}}>
        <Typography variant="h4">{ass.title}</Typography>
        <Button variant="outlined" onClick={()=>router.back()}>{t("back")}</Button>
      </Box>
      {ass.items.map((it,i)=>{
        if(it.type==="mcq") return <MultipleChoiceTry key={it.id} idx={i+1} item={it} selected={responses[i] as number|undefined} submitted={submitted} onSelect={(c)=>handleMCQ(i,c,c===it.answer_key)}/>;
        if(it.type==="writing") return <WritingTry key={it.id} idx={i+1} item={it} response={responses[i] as string|undefined} submitted={submitted} onChange={(txt)=>handleWriting(i,txt)}/>;
        return null;
      })}
      {!submitted && (
        <Box sx={{display:"flex",justifyContent:"center",mt:3}}>
          <Button variant="contained" disabled={responses.every(r=>r===undefined)} onClick={submit}>{t("submit")}</Button>
        </Box>
      )}
      {submitted && (
        <Box sx={{display:"flex", flexDirection:"column", alignItems:"center", mt:3}}>
          {totalMcq>0 && <Chip label={`${t("score")}: ${score}/${totalMcq}`} color={score===totalMcq?"success":"primary"} sx={{mb:1}}/>}
          <Button variant="outlined" onClick={handleRetry}>{t("retry")}</Button>
        </Box>
      )}
    </Container>
  );
} 