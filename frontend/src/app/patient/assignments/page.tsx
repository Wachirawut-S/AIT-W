"use client";

import {
  Container,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useLanguage } from "../../../context/LanguageContext";
import api from "../../../utils/api";

const TOPICS = Array.from({ length: 9 }, (_, i) => i + 1);

interface AssignmentBrief { id: number; topic: number; }
interface PatientRecord { assignment_id: number; finished_at?: string | null; score?: number | null; }

export default function PatientAssignmentsHome() {
  const { user, token } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  const [totals, setTotals] = useState<Record<number, { total: number; done: number }>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 3) return;
    const fetch = async () => {
      try {
        const { data: assignments } = await api.get<AssignmentBrief[]>("/patient/assignments", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const { data: recs } = await api.get<PatientRecord[]>("/patient/records", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const map: Record<number, { total: number; done: number }> = {};
        TOPICS.forEach((t) => (map[t] = { total: 0, done: 0 }));

        assignments.forEach((a) => {
          if (map[a.topic]) map[a.topic].total += 1;
        });

        const doneSet = new Set(recs.filter((r) => r.finished_at).map((r) => r.assignment_id));
        assignments.forEach((a) => {
          if (doneSet.has(a.id)) map[a.topic].done += 1;
        });

        setTotals(map);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [user, token]);

  if (!user || user.role !== 3) {
    if (typeof window !== "undefined") router.replace("/");
    return null;
  }

  if (!loading && Object.values(totals).every((v) => v.total === 0)) {
    return (
      <Container sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          {t("myPractice")}
        </Typography>
        <Typography>{t("noAssignments")}</Typography>
      </Container>
    );
  }

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        {t("myPractice")}
      </Typography>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>{t("topic")}</TableCell>
            <TableCell align="right">{t("progress")}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {TOPICS.map((topic) => (
            <TableRow
              key={topic}
              hover
              sx={{ cursor: totals[topic]?.total ? "pointer" : "default" }}
              onClick={() => totals[topic]?.total && router.push(`/patient/assignments/${topic}`)}
            >
              <TableCell>{t(`assignments.topic${topic}`)}</TableCell>
              <TableCell align="right">
                {totals[topic]?.total ? `${totals[topic].done}/${totals[topic].total}` : "-"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Container>
  );
} 