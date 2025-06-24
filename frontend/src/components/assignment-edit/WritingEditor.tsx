import { Box, TextField, Chip } from "@mui/material";
import ImageUploader from "../ImageUploader";
import { useLanguage } from "../../context/LanguageContext";

export interface WritingItem {
  prompt: string;
  image_path?: string;
  answer_key?: string;
}

interface Props {
  item: WritingItem;
  manualReview: boolean;
  onChange: (item: WritingItem) => void;
}

export default function WritingEditor({ item, manualReview, onChange }: Props) {
  const { t } = useLanguage();

  const update = (patch: Partial<WritingItem>) => onChange({ ...item, ...patch });

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

      {!manualReview && (
        <TextField
          label={t("answerKey")}
          value={item.answer_key || ""}
          onChange={(e) => update({ answer_key: e.target.value })}
          sx={{ mt: 2 }}
        />
      )}
      {manualReview && <Chip label={t("manualReview")} sx={{ mt: 2 }} />}
    </Box>
  );
} 