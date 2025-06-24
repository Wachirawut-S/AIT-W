"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Container,
  Typography,
  Box,
  TextField,
  ToggleButtonGroup,
  ToggleButton,
  Button,
  Paper,
  IconButton,
  Snackbar,
  Alert,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import MultipleChoiceEditor, { MCQItem } from "../../../../../components/assignment-edit/MultipleChoiceEditor";
import WritingEditor, { WritingItem as WritingEditItem } from "../../../../../components/assignment-edit/WritingEditor";
import { useAuth } from "../../../../../context/AuthContext";
import { useLanguage } from "../../../../../context/LanguageContext";
import api from "../../../../../utils/api";

interface Choice {
  text?: string;
  image?: string;
}
interface Item {
  prompt: string;
  image_path?: string;
  choices: Choice[];
  answer_key?: string;
}
interface Assignment {
  id: number;
  topic: number;
  title: string;
  qtype: string;
  properties?: Record<string, unknown>;
  items: Item[];
}

export default function EditAssignmentPage() {
  const { user, token } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const params = useParams();
  const topic = Number(params?.topic);
  const id = params?.id as string;

  // form states
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [qtype, setQtype] = useState<"multiple_choice" | "writing">("multiple_choice");
  const [manualReview, setManualReview] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [saving, setSaving] = useState(false);
  const [snack, setSnack] = useState<string | null>(null);

  // Load existing assignment
  useEffect(() => {
    if (!user || user.role !== 1) {
      router.replace("/");
      return;
    }
    const fetch = async () => {
      const { data } = await api.get<Assignment>(`/assignments/v2/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTitle(data.title);
      setQtype(data.qtype as "multiple_choice" | "writing");
      if (data.qtype === "writing") {
        setManualReview(data.properties?.manualReview === true);
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const transformed: Item[] = (data.items as any[]).map((it)=>{
        if(it.type==="mcq") return {prompt:it.prompt??"", image_path:it.image_path, choices:it.choices, answer_key: String(it.answer_key)};
        return {prompt:it.prompt??"", image_path:it.image_path, choices:[{text:""}], answer_key: it.answer_key};
      });
      setItems(transformed);
      setLoading(false);
    };
    fetch();
  }, [user, token, id, router]);

  if (!user || user.role !== 1) return null;
  if (loading) return <Container sx={{ mt: 4 }}><Typography>{t("loading")}</Typography></Container>;

  const addItem = () => {
    const choiceCount = (qtype === "multiple_choice" ? (items[0]?.choices.length ?? 4) : 1);
    const newChoices: Choice[] = Array.from({ length: choiceCount }).map(() => ({ text: "" }));
    setItems([...items, { prompt: "", choices: newChoices }]);
  };

  const updateItem = (idx: number, field: Partial<Item>) => {
    setItems(items.map((it, i) => (i === idx ? { ...it, ...field } : it)));
  };

  const save = async () => {
    // basic validation similar to add
    if (!title.trim()) {
      setSnack(t("titleRequired"));
      return;
    }
    if (items.length === 0) {
      setSnack(t("needOneItem"));
      return;
    }
    const choiceCount = items[0]?.choices.length ?? 4;
    if (qtype === "multiple_choice" && (choiceCount < 2 || choiceCount > 10)) {
      setSnack(t("numChoiceRange"));
      return;
    }
    for (const [index, it] of items.entries()) {
      if (!it.prompt.trim()) {
        setSnack(`${t("item")} ${index + 1}: ${t("promptRequired")}`);
        return;
      }
      if (qtype === "multiple_choice") {
        if (it.choices.length !== choiceCount) {
          setSnack(`${t("item")} ${index + 1}: ${t("choicesNotMatch")}`);
          return;
        }
        if (!it.answer_key) {
          setSnack(`${t("item")} ${index + 1}: ${t("answerRequired")}`);
          return;
        }
      }
      if (qtype === "writing" && !manualReview && !it.answer_key) {
        setSnack(`${t("item")} ${index + 1}: ${t("answerRequired")}`);
        return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        topic,
        title,
        qtype,
        properties: qtype === "multiple_choice" ? { numChoices: choiceCount } : qtype === "writing" ? { manualReview } : {},
        items: items.map((it) => ({
          prompt: it.prompt,
          image_path: it.image_path,
          choices: it.choices,
          answer_key: it.answer_key,
        })),
      };
      await api.put(`/assignments/${id}`, payload, { headers: { Authorization: `Bearer ${token}` } });
      setSnack(t("saved"));
    } catch (err) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const msg = (err as any)?.response?.data?.detail ?? "error";
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  const choiceCountRender = items[0]?.choices.length ?? 4;

  return (
    <Container sx={{ mt: 4, pb: 8 }}>
      <Typography variant="h4" gutterBottom>
        {t("editAssignment")}
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2, maxWidth: 600 }}>
        <TextField label={t("title")} value={title} onChange={(e) => setTitle(e.target.value)} />

        {/* Disable qtype toggles after initial fetch */}
        <ToggleButtonGroup exclusive value={qtype} disabled>
          <ToggleButton value="multiple_choice">{t("multiple_choice")}</ToggleButton>
          <ToggleButton value="writing">{t("writing")}</ToggleButton>
        </ToggleButtonGroup>
        {qtype === "multiple_choice" && (
          <TextField type="number" label={t("numberOfChoices")} value={choiceCountRender} disabled inputProps={{ min: 2, max: 10 }} />
        )}
        {qtype === "writing" && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography>{t("manualReview")}: {manualReview ? t("yes") : t("no")}</Typography>
          </Box>
        )}
      </Box>

      {items.map((item, idx) => (
        <Paper key={idx} sx={{ p: 2, my: 2 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography variant="h6">
              {t("item")} {idx + 1}
            </Typography>
            <IconButton color="error" onClick={() => setItems(items.filter((_, i) => i !== idx))}>
              <DeleteIcon />
            </IconButton>
          </Box>
          {/* no drag_drop handling */}

          {qtype === "multiple_choice" && (
            <MultipleChoiceEditor item={item as MCQItem} onChange={(updated) => updateItem(idx, updated)} />
          )}

          {qtype === "writing" && (
            <WritingEditor item={item as WritingEditItem} manualReview={manualReview} onChange={(updated)=>updateItem(idx,updated)} />
          )}
        </Paper>
      ))}

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 4 }}>
        {/* Bottom-left back */}
        <Button variant="outlined" onClick={() => router.back()}>
          {t("back")}
        </Button>

        {/* Bottom-right actions */}
        <Box>
          <Button sx={{ mr: 2 }} onClick={addItem}>
            {t("addItem")}
          </Button>
          <Button variant="contained" onClick={save} disabled={saving}>
            {t("saveAssignment")}
          </Button>
        </Box>
      </Box>

      <Snackbar open={!!snack} autoHideDuration={3000} onClose={() => setSnack(null)}>
        <Alert severity="info" variant="filled" onClose={() => setSnack(null)} sx={{ width: "100%" }}>
          {snack}
        </Alert>
      </Snackbar>
    </Container>
  );
} 