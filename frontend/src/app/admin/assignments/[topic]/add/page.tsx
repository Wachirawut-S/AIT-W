"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Container, Typography, Box, TextField, ToggleButtonGroup, ToggleButton, Button, Paper, IconButton, Snackbar, Alert } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import ImageUploader from "../../../../../components/ImageUploader";
import { useAuth } from "../../../../../context/AuthContext";
import { useLanguage } from "../../../../../context/LanguageContext";
import api from "../../../../../utils/api";

interface Choice { text?:string; image?:string; }
interface Item {
  prompt: string;
  image_path?: string;
  choices: Choice[];
  answer_key?: string;
}

export default function AddAssignmentPage(){
  const { user, token } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const params=useParams();
  const topic = Number(params?.topic);

  const [title,setTitle] = useState("");
  const [qtype,setQtype] = useState<"multiple_choice"|"writing"|null>(null);
  const [typeConfirmed,setTypeConfirmed] = useState(false);
  const [numChoices,setNumChoices] = useState(4);
  const [choicesConfirmed,setChoicesConfirmed] = useState(false);
  const [manualReview,setManualReview] = useState(false);
  const [items,setItems]=useState<Item[]>([]);
  const [saving,setSaving]=useState(false);
  const [snack,setSnack]=useState<string|null>(null);

  if(!user||user.role!==1) { if(typeof window!=="undefined") router.replace("/"); return null; }

  const addItem=()=>{
    const newChoices:Array<Choice>=Array.from({length:numChoices}).map(()=>({text:""}));
    setItems([...items,{prompt:"",choices:newChoices}]);
  };

  const updateItem=(idx:number, field:Partial<Item>)=>{
    setItems(items.map((it,i)=> i===idx? {...it, ...field}: it));
  };

  const save=async()=>{
    // basic validation
    if(!title.trim()){ setSnack(t("titleRequired")); return; }
    if(items.length===0){ setSnack(t("needOneItem")); return; }
    if(qtype==="multiple_choice" && (numChoices<2||numChoices>10)){ setSnack(t("numChoiceRange")); return; }
    for(const [index,it] of items.entries()){
      if(!it.prompt.trim()){ setSnack(`${t("item")} ${index+1}: ${t("promptRequired")}`); return; }
      if(qtype==="multiple_choice"){
         if(it.choices.length!==numChoices){ setSnack(`${t("item")} ${index+1}: ${t("choicesNotMatch")}`); return; }
         if(!it.answer_key){ setSnack(`${t("item")} ${index+1}: ${t("answerRequired")}`); return; }
      }
      if(qtype==="writing" && !manualReview && !it.answer_key){ setSnack(`${t("item")} ${index+1}: ${t("answerRequired")}`); return; }
    }

    setSaving(true);
    try{
      const payload={
        topic,
        title,
        qtype,
        properties: qtype==="multiple_choice"? {numChoices}: qtype==="writing"? {manualReview}: {},
        items: items.map(it=>({
          prompt: it.prompt,
          image_path: it.image_path,
          choices: it.choices,
          answer_key: it.answer_key,
        }))
      };
      await api.post("/assignments", payload,{headers:{Authorization:`Bearer ${token}`}});
      router.push(`/admin/assignments/${topic}`);
      setSnack(t("saved"));
    }catch(err){
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const msg = (err as any)?.response?.data?.detail ?? "error";
      alert(msg);
    }finally{ setSaving(false);}  
  };

  return (
    <Container sx={{mt:4, pb:8}}>
      <Typography variant="h4" gutterBottom>{t("addAssignment")}</Typography>
      <Box sx={{display:"flex",flexDirection:"column",gap:2,maxWidth:600}}>
        <TextField label={t("title")} value={title} onChange={(e)=>setTitle(e.target.value)} />
        <ToggleButtonGroup exclusive value={qtype} onChange={(_,v)=> !typeConfirmed && setQtype(v)}>
          <ToggleButton value="multiple_choice">{t("multiple_choice")}</ToggleButton>
          <ToggleButton value="writing">{t("writing")}</ToggleButton>
        </ToggleButtonGroup>
        {!typeConfirmed && (
          <Button variant="contained" size="small" onClick={()=>{ if(qtype) setTypeConfirmed(true); }} disabled={!qtype}>{t("confirm")}</Button>
        )}

        {qtype==="multiple_choice" && typeConfirmed && (
          <Box sx={{display:"flex",alignItems:"center",gap:1}}>
            <TextField type="number" label={t("numberOfChoices")} value={numChoices}
              disabled={choicesConfirmed}
              onChange={(e)=>setNumChoices(Number(e.target.value))}
              inputProps={{min:2,max:10}}
            />
            {!choicesConfirmed && <Button size="small" variant="contained" onClick={()=>setChoicesConfirmed(true)}>{t("confirm")}</Button>}
          </Box>
        )}
        {qtype==="writing" && (
          <Box sx={{display:"flex",alignItems:"center",gap:1}}>
            <Typography>{t("manualReview")}</Typography>
            <ToggleButton value="manual" selected={manualReview} onChange={()=>setManualReview(!manualReview)}>{manualReview? t("yes"): t("no")}</ToggleButton>
          </Box>
        )}
      </Box>

      {items.map((item,idx)=>(
        <Paper key={idx} sx={{p:2,my:2}}>
          <Box sx={{display:"flex",justifyContent:"space-between"}}>
            <Typography variant="h6">{t("item")} {idx+1}</Typography>
            <IconButton color="error" onClick={()=> setItems(items.filter((_,i)=>i!==idx))}><DeleteIcon/></IconButton>
          </Box>
          <TextField fullWidth multiline label={t("prompt")} value={item.prompt} onChange={(e)=>updateItem(idx,{prompt:e.target.value})} sx={{my:1}} />
          <ImageUploader imagePath={item.image_path} onChange={(path)=>updateItem(idx,{image_path:path})} />

          {qtype==="multiple_choice" && (
            <Box sx={{mt:1}}>
              {item.choices.map((c,ci)=> (
                <Box key={ci} sx={{display:"flex",alignItems:"center",gap:1,my:1}}>
                  <TextField label={`${t("choice")} ${ci+1}`} value={c.text} onChange={(e)=>{
                    const newChoices=[...item.choices];
                    newChoices[ci]={...newChoices[ci],text:e.target.value};
                    updateItem(idx,{choices:newChoices});
                  }} />
                  <ImageUploader imagePath={c.image} onChange={(path)=>{
                    const newChoices=[...item.choices];
                    newChoices[ci]={...newChoices[ci],image:path};
                    updateItem(idx,{choices:newChoices});
                  }}/>
                  <Button variant={item.answer_key===String(ci)?"contained":"outlined"} size="small" onClick={()=>updateItem(idx,{answer_key:String(ci)})}>{t("answerKey")}</Button>
                </Box>
              ))}
            </Box>
          )}

          {qtype==="writing" && !manualReview && (
            <TextField label={t("answerKey")} value={item.answer_key||""} onChange={(e)=>updateItem(idx,{answer_key:e.target.value})} />
          )}
        </Paper>
      ))}

      {typeConfirmed && (qtype!=="multiple_choice" || choicesConfirmed) && (
        <Button sx={{mt:2}} onClick={addItem}>{t("addItem")}</Button>
      )}

      <Button variant="contained" onClick={save} disabled={saving || !typeConfirmed || (qtype==="multiple_choice" && !choicesConfirmed) } sx={{mt:2}}>{t("saveAssignment")}</Button>

      <Snackbar open={!!snack} autoHideDuration={3000} onClose={()=>setSnack(null)}>
        <Alert severity="info" variant="filled" onClose={()=>setSnack(null)} sx={{width:"100%"}}>{snack}</Alert>
      </Snackbar>
    </Container>
  );
} 