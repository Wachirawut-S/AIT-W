import { Box, Typography, TextField, Chip } from "@mui/material";
import getImageUrl from "../../utils/getImageUrl";
import { useLanguage } from "../../context/LanguageContext";
/* eslint-disable @next/next/no-img-element */

export interface WritingItem {
  prompt?: string;
  image_path?: string;
  answer_key?: string;
  manual_review: boolean;
  reviewed?: boolean;
  correct?: boolean | null;
}

interface Props {
  idx: number;
  item: WritingItem;
  response: string | undefined;
  submitted: boolean;
  onChange: (val: string) => void;
}

export default function WritingTry({ idx, item, response, submitted, onChange }: Props) {
  const { prompt, image_path, answer_key, manual_review } = item;
  const correct = !manual_review && submitted && answer_key !== undefined && response?.trim().toLowerCase() === answer_key.trim().toLowerCase();
  const { t } = useLanguage();
  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
        {idx}. {prompt}
      </Typography>
      {image_path && (
        <img
          src={getImageUrl(image_path)}
          alt="question"
          style={{ display: "block", maxWidth: 360, margin: "0 auto 16px", borderRadius: 12 }}
        />
      )}

      <TextField
        fullWidth
        multiline
        minRows={2}
        disabled={submitted}
        value={response ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Your answer..."
        sx={{ mb: 1 }}
      />

      {submitted && (
        manual_review ? (
          item.reviewed ? (
            <Chip label={item.correct ? "Marked correct" : "Marked incorrect"} color={item.correct ? "success" : "error"} />
          ) : (
            <Chip label={t("pendingReview")} />
          )
        ) : (
          <Chip label={correct ? "Correct" : `Answer: ${answer_key}` } color={correct ? "success" : "error"} />
        )
      )}
    </Box>
  );
} 