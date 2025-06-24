"use client";

import { Container, Typography, Table, TableHead, TableRow, TableCell, TableBody, Button } from "@mui/material";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import { useLanguage } from "../../../context/LanguageContext";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";

const topics = Array.from({ length: 9 }, (_, i) => i + 1);

const AdminAssignmentsHome = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  if (!user || user.role !== 1) {
    if (typeof window !== "undefined") router.replace("/");
    return null;
  }

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        {t("manageAssignments")}
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
                  endIcon={<ManageAccountsIcon/>}
                  sx={{ textTransform:"none", borderRadius:2 }}
                  onClick={()=>router.push(`/admin/assignments/${topic}`)}
                >{t("manage")}</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Container>
  );
};

export default AdminAssignmentsHome; 