"use client";

import { Container, Typography, Table, TableHead, TableRow, TableCell, TableBody, Button } from "@mui/material";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import { useLanguage } from "../../../context/LanguageContext";
import LaunchIcon from "@mui/icons-material/Launch";

const topics = Array.from({ length: 9 }, (_, i) => i + 1);

export default function DoctorAssignmentsHome() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  if (!user || user.role !== 2) {
    if (typeof window !== "undefined") router.replace("/");
    return null;
  }

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        {t("assignments")}
      </Typography>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>{t("topic")}</TableCell>
            <TableCell align="right">{t("actions")}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {topics.map((topic) => (
            <TableRow key={topic}>
              <TableCell>{t(`assignments.topic${topic}`)}</TableCell>
              <TableCell align="right">
                <Button
                  size="small"
                  variant="outlined"
                  endIcon={<LaunchIcon/>}
                  sx={{ textTransform: "none", borderRadius: 2 }}
                  onClick={() => router.push(`/doctor/assignments/${topic}`)}
                >{t("open")}</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Container>
  );
} 