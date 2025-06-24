"use client";

import React from "react";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import LanguageIcon from "@mui/icons-material/Language";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import AssignmentIcon from "@mui/icons-material/Assignment";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import PeopleIcon from "@mui/icons-material/People";
import LoginIcon from "@mui/icons-material/Login";
import LogoutIcon from "@mui/icons-material/Logout";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import EditIcon from "@mui/icons-material/Edit";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import Image from "next/image";
import Box from "@mui/material/Box";
import { useThemeMode } from "../context/ThemeContext";

const Navbar = () => {
  const { user, logout } = useAuth();
  const { locale, setLocale, t } = useLanguage();
  const router = useRouter();
  const { mode, toggle: toggleTheme } = useThemeMode();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const toggleLanguage = () => {
    setLocale(locale === "ja" ? "en" : "ja");
  };

  return (
    <AppBar position="static" color="transparent" elevation={0} sx={{ borderBottom: 1, borderColor: "divider" }}>
      <Toolbar>
        <Box sx={{ display: "flex", alignItems: "center", flexGrow: 1, cursor: "pointer" }} onClick={() => router.push("/")}> 
          <Image src="/AITW.png" alt="AITW Logo" width={40} height={40} style={{ marginRight: 8 }} />
          <Typography variant="h6" sx={{ fontWeight: "bold", color: "primary.main" }}>
            AMPHASIA IMPROVE TEST
          </Typography>
        </Box>

        {!user && (
          <>
            <IconButton color="inherit" size="large" onClick={toggleLanguage} title={locale === "ja" ? "English" : "日本語"}>
              <LanguageIcon />
            </IconButton>
            <IconButton color="inherit" size="large" onClick={toggleTheme} title="Toggle theme">
              {mode === "light" ? <Brightness4Icon /> : <Brightness7Icon />}
            </IconButton>
            <Button startIcon={<PersonAddIcon />} onClick={() => router.push("/register")}>{t("navbar.register")}</Button>
            <Button startIcon={<LoginIcon />} onClick={() => router.push("/login")}>{t("navbar.login")}</Button>
          </>
        )}

        {user && (
          <>
            <Typography sx={{ mr: 2 }}>
              {t("navbar.welcome")}, {user.role === 1 ? t("navbar.admin") : user.role === 2 ? t("navbar.doctor") : ""} {user.username}
            </Typography>
            {user.role === 1 && (
              <>
                <Button startIcon={<AssignmentIcon />} onClick={() => router.push("/admin/assignments")}>{t("navbar.manageAssignments")}</Button>
                <Button startIcon={<ManageAccountsIcon />} onClick={() => router.push("/admin/users")}>{t("navbar.manageUsers")}</Button>
              </>
            )}
            {user.role === 2 && (
              <>
                <Button startIcon={<AssignmentIcon />} onClick={()=>router.push("/doctor/assignments")}>{t("navbar.assignments")}</Button>
                <Button startIcon={<PeopleIcon />} onClick={() => router.push("/doctor/patients")}>{t("navbar.patients")}</Button>
                <Button startIcon={<EditIcon />} onClick={()=>router.push("/doctor/reviews")}>{t("review")}</Button>
              </>
            )}
            {user.role === 3 && (
              <Button startIcon={<AssignmentIcon />} onClick={() => router.push("/patient/assignments")}>{t("navbar.startPractice")}</Button>
            )}
            <IconButton color="inherit" size="large" onClick={toggleLanguage} title={locale === "ja" ? "English" : "日本語"}>
              <LanguageIcon />
            </IconButton>
            <IconButton color="inherit" size="large" onClick={toggleTheme} title="Toggle theme">
              {mode === "light" ? <Brightness4Icon /> : <Brightness7Icon />}
            </IconButton>
            <Button startIcon={<LogoutIcon />} onClick={handleLogout}>{t("navbar.logout")}</Button>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar; 