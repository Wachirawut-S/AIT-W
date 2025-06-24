"use client";
/* eslint-disable @next/next/no-img-element */
import { Box, Typography, Chip, Stack } from "@mui/material";
import getImageUrl from "../../utils/getImageUrl";

interface Props { prompt?:string; image?:string; words:string[]; subCount:number; }

export default function DragDropPreview({prompt,image,words,subCount}:Props){
  const slots = Array.from({length:subCount});
  return(
    <Box sx={{mb:3}}>
      <Typography variant="subtitle1">{prompt}</Typography>
      {image && <img src={getImageUrl(image)} alt="question" style={{maxWidth:200}}/>}
      <Stack direction="row" spacing={1} sx={{flexWrap:"wrap",my:1}}>
        {words.map((w,i)=>(<Chip key={i} label={w}/>))}
      </Stack>
      <Stack spacing={1}>
        {slots.map((_,i)=>(<Box key={i} sx={{width:200,height:40,border:"1px dashed",borderColor:"grey.500"}}/>))}
      </Stack>
    </Box>
  );
} 