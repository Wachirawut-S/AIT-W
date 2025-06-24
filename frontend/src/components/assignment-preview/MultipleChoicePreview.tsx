"use client";
import { Box, Typography, Paper } from "@mui/material";
import getImageUrl from "../../utils/getImageUrl";
/* eslint-disable @next/next/no-img-element */

type ChoiceObj = { image?: string; text?: string };
type Choice = string | ChoiceObj;

interface Props {
  idx: number;
  prompt?: string;
  image?: string;
  choices: Choice[];
  answerKey?: string;
}

export default function MultipleChoicePreview({idx,prompt,image,choices,answerKey}:Props){
  return(
    <Box sx={{mb:3}}>
      <Paper elevation={1} sx={{p:3,textAlign:"center",mb:3,borderRadius:3}}>
        <Typography variant="h4" sx={{mb:3,fontWeight:"bold"}}>{idx}. {prompt}</Typography>
        {image && (
          <img
            src={getImageUrl(image)}
            alt="question"
            style={{ display:"block", maxWidth:600, maxHeight:600, margin:"0 auto", borderRadius:12 }}
          />
        )}

        <Box sx={{display:"flex",flexWrap:"wrap",gap:2,justifyContent:"center",mt:3}}>
          {choices.map((raw, i) => {
            const isObj = (v: unknown): v is ChoiceObj => typeof v === "object" && v !== null;

            const { image: imgPath, text: labelText } = isObj(raw)
              ? raw
              : { image: undefined, text: String(raw) };

            const isKey = answerKey === String(i);
            return (
              <Box key={i} sx={{width:200}}>
                <Box
                  sx={{
                    p: 1,
                    border: 2,
                    borderColor: isKey ? "success.main" : "grey.300",
                    borderRadius: 2,
                    textAlign: "center",
                    bgcolor: isKey ? "success.light" : "grey.50",
                    transition: "box-shadow .2s",
                    boxShadow: isKey ? 4 : 1,
                    ':hover': { boxShadow: 6 },
                  }}
                >
                  {imgPath && (
                    <img
                      src={getImageUrl(imgPath)}
                      alt="choice"
                      style={{
                        display: "block",
                        maxWidth: 100,
                        maxHeight: 100,
                        width: "100%",
                        objectFit: "cover",
                        margin: "12px auto 0",
                        borderRadius: 12,
                      }}
                    />
                  )}
                  {labelText && (
                    <Typography sx={{ mt: 1 }}>{labelText}</Typography>
                  )}
                </Box>
              </Box>
            );
          })}
        </Box>
      </Paper>
    </Box>
  );
} 