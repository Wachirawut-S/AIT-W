"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Container, Typography, Chip, Box, Button } from "@mui/material";
import { useAuth } from "../../../../../../context/AuthContext";
import { useLanguage } from "../../../../../../context/LanguageContext";
import api from "../../../../../../utils/api";
import MultipleChoicePreview from "../../../../../../components/assignment-preview/MultipleChoicePreview";
import WritingPreview from "../../../../../../components/assignment-preview/WritingPreview";

// ---------- Types for v2 read ----------
type Choice = { text?: string; image?: string };

interface MCQItem {
  type: "mcq";
  id: number;
  prompt?: string;
  image_path?: string;
  choices: Choice[];
  answer_key?: number;
}

interface WritingItem {
  type: "writing";
  id: number;
  prompt?: string;
  image_path?: string;
  answer_key?: string;
  manual_review: boolean;
}

type Item = MCQItem | WritingItem;

interface Assignment {
  id: number;
  topic: number;
  title: string;
  qtype: string;
  properties?: Record<string, unknown>;
  items: Item[];
}

export default function PreviewAssignment(){
  const { user, token } = useAuth();
  const { t } = useLanguage();
  const router=useRouter();
  const params=useParams();
  const id=params?.id as string;
  const [ass,setAss]=useState<Assignment|null>(null);

  useEffect(()=>{
    if(!user||!(user.role===1||user.role===2)){ router.replace("/"); return; }
    const fetch=async()=>{
      const base = user?.role === 2 ? "/doctor/assignments" : "/assignments";
      // First try v2
      try {
        const { data } = await api.get<Assignment>(`${base}/v2/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        // If backend returned items array but it's empty, fall back to legacy
        if (data.items?.length === 0) throw new Error("empty-items");
        setAss(data);
      } catch(err){ console.error(err);}
    };
    fetch();
  },[user,token,id,router]);

  if(!ass) return null;
  return(
    <Container sx={{mt:4}}>
      <Box sx={{display:"flex",justifyContent:"space-between",alignItems:"center",mb:2}}>
        <Typography variant="h4">{t("preview")} - {ass.title}</Typography>
        <Button variant="outlined" onClick={()=>router.back()}>{t("back")}</Button>
      </Box>
      <Chip label={t(ass.qtype)} sx={{mb:2}}/>
      {ass.items.map((it,i)=>{
        if(it.type === "mcq"){
          return (
            <MultipleChoicePreview
              key={it.id}
              idx={i+1}
              prompt={it.prompt}
              image={it.image_path}
              choices={it.choices}
              answerKey={it.answer_key !== undefined ? String(it.answer_key) : undefined}
            />
          );
        }
        if(it.type === "writing"){
          return (
            <WritingPreview
              key={it.id}
              prompt={it.prompt}
              image={it.image_path}
              manual={it.manual_review}
              answer={it.answer_key}
            />
          );
        }
        return null;
      })}
    </Container>
  );
} 