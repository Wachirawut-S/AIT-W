import { Box, TextField, Button } from "@mui/material";
import ImageUploader from "../ImageUploader";
import { useLanguage } from "../../context/LanguageContext";

interface Choice { text?: string; image?: string; }
export interface MCQItem {
  prompt: string;
  image_path?: string;
  choices: Choice[];
  answer_key?: string;
}

interface Props {
  item: MCQItem;
  onChange: (item: MCQItem) => void;
}

export default function MultipleChoiceEditor({ item, onChange }: Props) {
  const { t } = useLanguage();

  const update = (patch: Partial<MCQItem>) => onChange({ ...item, ...patch });

  const updateChoice = (ci: number, patch: Partial<Choice>) => {
    const newChoices = [...item.choices];
    newChoices[ci] = { ...newChoices[ci], ...patch };
    update({ choices: newChoices });
  };

  return (
    <Box sx={{ mt: 1 }}>
      <TextField
        fullWidth
        multiline
        label={t("prompt")}
        value={item.prompt}
        onChange={(e) => update({ prompt: e.target.value })}
        sx={{ my: 1 }}
      />
      <ImageUploader imagePath={item.image_path} onChange={(path) => update({ image_path: path })} />

      {item.choices.map((c, ci) => (
        <Box key={ci} sx={{ display: "flex", alignItems: "center", gap: 1, my: 2 }}>
          <TextField
            label={`${t("choice")} ${ci + 1}`}
            value={c.text}
            onChange={(e) => updateChoice(ci, { text: e.target.value })}
          />
          <ImageUploader imagePath={c.image} onChange={(path) => updateChoice(ci, { image: path })} />
          <Button
            variant={item.answer_key === String(ci) ? "contained" : "outlined"}
            size="small"
            onClick={() => update({ answer_key: String(ci) })}
          >
            {t("answerKey")}
          </Button>
        </Box>
      ))}
    </Box>
  );
} 