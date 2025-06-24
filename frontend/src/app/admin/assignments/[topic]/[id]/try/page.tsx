"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Container,
  Typography,
  Button,
  Box,
  Chip,
  Paper,
} from "@mui/material";
import { useAuth } from "../../../../../../context/AuthContext";
import { useLanguage } from "../../../../../../context/LanguageContext";
import api from "../../../../../../utils/api";
import getImageUrl from "../../../../../../utils/getImageUrl";
import WritingTry from "../../../../../../components/assignment-try/WritingTry";

// ---------- Shared types (mirror preview page) ----------

type ChoiceObj = { text?: string; image?: string };
export type Choice = string | ChoiceObj;

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

// ---------------- Legacy fallback types -----------------
type LegacyChoice = Choice | string;

interface LegacyItem {
  prompt?: string;
  image_path?: string;
  choices: LegacyChoice[];
  answer_key?: string;
}

interface LegacyAssignment {
  id: number;
  topic: number;
  title: string;
  qtype: string;
  properties?: Record<string, unknown>;
  items: LegacyItem[];
}

interface Assignment {
  id: number;
  topic: number;
  title: string;
  qtype: string;
  properties?: Record<string, unknown>;
  items: Item[];
}

export default function TryPage() {
  const { user, token } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [ass, setAss] = useState<Assignment | null>(null);
  const [responses, setResponses] = useState<(number | string | undefined)[]>([]);
  const [submitted, setSubmitted] = useState(false);

  // Fetch assignment (use v2 only – admin-created legacy items will be MCQ and map fine)
  useEffect(() => {
    if (!user || (user.role !== 1 && user.role !== 2)) {
      router.replace("/");
      return;
    }
    const fetch = async () => {
      const base = user?.role === 2 ? "/doctor/assignments" : "/assignments";
      try {
        const { data } = await api.get<Assignment>(`${base}/v2/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (data.items?.length === 0) throw new Error("empty-items");
        setAss(data);
        setResponses(Array(data.items.length).fill(undefined));
      } catch {
        // legacy fallback
        try {
          const { data: legacy } = await api.get<LegacyAssignment>(`${base}/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          const legacyItems: Item[] = legacy.items.map((it: LegacyItem, index: number) => {
            if (legacy.qtype === "multiple_choice") {
              return {
                type: "mcq",
                id: index,
                prompt: it.prompt,
                image_path: it.image_path,
                choices: it.choices,
                answer_key: it.answer_key !== undefined ? Number(it.answer_key) : undefined,
              } as MCQItem;
            }
            // writing fallback
            return {
              type: "writing",
              id: index,
              prompt: it.prompt,
              image_path: it.image_path,
              answer_key: it.answer_key,
              manual_review: legacy.properties?.manualReview === true,
            } as WritingItem;
          });

          const transformed: Assignment = {
            id: legacy.id,
            topic: legacy.topic,
            title: legacy.title,
            qtype: legacy.qtype,
            properties: legacy.properties,
            items: legacyItems,
          };
          setAss(transformed);
          setResponses(Array(legacyItems.length).fill(undefined));
        } catch (err) {
          console.error(err);
        }
      }
    };
    fetch();
  }, [user, token, id, router]);

  // ------ helpers ------
  const handleMCQSelect = (itemIndex: number, choiceIdx: number) => {
    if (submitted) return; // lock after submit
    setResponses((prev) => {
      const next = [...prev];
      next[itemIndex] = choiceIdx;
      return next;
    });
  };

  const handleSubmit = () => {
    setSubmitted(true);
  };

  const handleRetry = () => {
    if (ass) {
      setResponses(Array(ass.items.length).fill(undefined));
    }
    setSubmitted(false);
  };

  if (!ass) return null;

  // Compute simple MCQ score when submitted
  let score = 0;
  let totalAuto = 0;
  if (submitted) {
    ass.items.forEach((it, idx) => {
      if (it.type === "mcq" && it.answer_key !== undefined) {
        totalAuto += 1;
        if (responses[idx] === it.answer_key) score += 1;
        return;
      }
      if (it.type === "writing" && !it.manual_review && it.answer_key) {
        totalAuto += 1;
        const resp = (responses[idx] ?? "").toString().trim().toLowerCase();
        if (resp === it.answer_key.trim().toLowerCase()) score += 1;
      }
    });
  }

  return (
    <Container sx={{ mt: 4, mb: 6 }}>
      {/* Header Row */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h4" sx={{ flexGrow: 1 }}>
          {t("try")} - {ass.title}
        </Typography>

        {/* Score Chip top-right visible after submit */}
        {submitted && totalAuto > 0 && (
          <Chip
            label={`${t("score")}: ${score}/${totalAuto}`}
            color={score === totalAuto ? "success" : "primary"}
            sx={{ mr: 2 }}
          />
        )}

        <Button variant="outlined" onClick={() => router.back()}>
          {t("back")}
        </Button>
      </Box>

      {ass.items.map((it, i) => {
        if (it.type === "mcq") {
          const selected = responses[i] as number | undefined;
          return (
            <Box key={it.id} sx={{ mb: 3 }}>
              <Paper elevation={1} sx={{ p: 3, textAlign: "center", borderRadius: 3 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
                  {i + 1}. {it.prompt}
                </Typography>
                {it.image_path && (
                  <img
                    src={getImageUrl(it.image_path)}
                    alt="question"
                    style={{ display: "block", maxWidth: 480, margin: "0 auto", borderRadius: 12 }}
                  />
                )}

                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, justifyContent: "center", mt: 3 }}>
                  {it.choices.map((raw, cIdx) => {
                    const isObj = (v: unknown): v is ChoiceObj => typeof v === "object" && v !== null;
                    const { image: imgPath, text: labelText } = isObj(raw)
                      ? raw
                      : { image: undefined, text: String(raw) };

                    const isCorrect = submitted && cIdx === it.answer_key;
                    const isWrongSel = submitted && selected === cIdx && cIdx !== it.answer_key;

                    return (
                      <Box key={cIdx} sx={{ width: 200 }}>
                        <Box
                          onClick={() => handleMCQSelect(i, cIdx)}
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

        if (it.type === "writing") {
          return (
            <WritingTry
              key={it.id}
              idx={i + 1}
              item={it}
              response={responses[i] as string | undefined}
              submitted={submitted}
              onChange={(val) => {
                const next = [...responses];
                next[i] = val;
                setResponses(next);
              }}
            />
          );
        }

        return null;
      })}

      {!submitted ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
          <Button
            variant="contained"
            disabled={responses.every((r) => r === undefined)}
            onClick={handleSubmit}
          >
            {t("submit")}
          </Button>
        </Box>
      ) : (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
          <Button variant="outlined" onClick={handleRetry}>{t("retry")}</Button>
        </Box>
      )}
    </Container>
  );
} 