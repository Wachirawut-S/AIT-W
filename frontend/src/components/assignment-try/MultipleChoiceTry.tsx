import { Box, Typography } from "@mui/material";
import getImageUrl from "../../utils/getImageUrl";
/* eslint-disable @next/next/no-img-element */

type ChoiceObj = { text?: string; image?: string };
type Choice = string | ChoiceObj;

interface MCQItem {
  prompt?: string;
  image_path?: string;
  choices: Choice[];
  answer_key?: number;
}

interface Props {
  idx: number;
  item: MCQItem;
  selected: number | undefined;
  submitted: boolean;
  onSelect: (idx: number) => void;
}

export default function MultipleChoiceTry({ idx, item, selected, submitted, onSelect }: Props) {
  const { prompt, image_path, choices, answer_key } = item;
  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
        {idx}. {prompt}
      </Typography>
      {image_path && (
        <img
          src={getImageUrl(image_path)}
          alt="question"
          style={{ display: "block", maxWidth: 480, margin: "0 auto", borderRadius: 12 }}
        />
      )}

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, justifyContent: "center", mt: 3 }}>
        {choices.map((raw, cIdx) => {
          const isObj = (v: unknown): v is { image?: string; text?: string } => typeof v === "object" && v !== null;
          const { image: imgPath, text: labelText } = isObj(raw) ? raw : { image: undefined, text: String(raw) };

          const isCorrect = submitted && cIdx === answer_key;
          const isWrongSel = submitted && selected === cIdx && cIdx !== answer_key;

          return (
            <Box key={cIdx} sx={{ width: 200 }}>
              <Box
                onClick={() => !submitted && onSelect(cIdx)}
                sx={{
                  p: 1,
                  border: 2,
                  borderColor: isCorrect
                    ? "success.main"
                    : isWrongSel
                    ? "error.main"
                    : selected === cIdx
                    ? "primary.main"
                    : "grey.300",
                  borderRadius: 2,
                  textAlign: "center",
                  bgcolor: isCorrect
                    ? "success.light"
                    : isWrongSel
                    ? "error.light"
                    : selected === cIdx
                    ? "primary.light"
                    : "grey.50",
                  cursor: submitted ? "default" : "pointer",
                  userSelect: "none",
                  transition: "box-shadow .2s",
                  boxShadow: selected === cIdx ? 4 : 1,
                  ":hover": { boxShadow: submitted ? 1 : 6 },
                }}
              >
                {imgPath && (
                  <img
                    src={getImageUrl(imgPath)}
                    alt="choice"
                    style={{
                      display: "block",
                      maxWidth: 160,
                      maxHeight: 160,
                      width: "100%",
                      objectFit: "cover",
                      margin: "12px auto 0",
                      borderRadius: 12,
                    }}
                  />
                )}
                {labelText && <Typography sx={{ mt: 1 }}>{labelText}</Typography>}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
} 