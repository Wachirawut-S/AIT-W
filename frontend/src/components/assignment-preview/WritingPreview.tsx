"use client";
/* eslint-disable @next/next/no-img-element */
import { Box, Typography, Chip, Paper } from "@mui/material";
import getImageUrl from "../../utils/getImageUrl";
import { useLanguage } from "../../context/LanguageContext";

interface Props { prompt?:string; image?:string; manual:boolean; answer?:string; }
export default function WritingPreview({prompt,image,manual,answer}:Props){
  const { t } = useLanguage();
  return(
    <Box sx={{mb:3}}>
      <Paper elevation={1} sx={{ p: 3, borderRadius: 3, textAlign: "center" }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
          {prompt}
        </Typography>
        {image && (
          <img
            src={getImageUrl(image)}
            alt="question"
            style={{ display: "block", maxWidth: 360, margin: "0 auto 16px", borderRadius: 12 }}
          />
        )}

        {manual ? (
          <Chip label={t("pendingReview")} color="warning" />
        ) : (
          <Chip label={`${t("answerKey")}: ${answer}` } color="success" />
        )}
      </Paper>
    </Box>
  );
} 