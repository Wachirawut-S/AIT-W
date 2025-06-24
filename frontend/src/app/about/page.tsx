"use client";

import { Box, Container, Typography, Paper } from "@mui/material";
import Image from "next/image";
import { useTheme } from "@mui/material/styles";

export default function AboutPage() {
  const theme = useTheme();

  return (
    <Box>
      {/* Hero section with background logo */}
      <Box
        sx={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: { xs: 400, md: 500 },
          overflow: "hidden",
          backgroundColor: theme.palette.mode === "light" ? "#ffffff" : theme.palette.background.default,
        }}
      >
        {/* Background logo */}
        <Image
          src="/AITW.png"
          alt="AITW Background"
          fill
          style={{ objectFit: "cover", opacity: theme.palette.mode === "light" ? 0.1 : 0.04 }}
          priority
        />

        <Container sx={{ position: "relative", textAlign: "center", zIndex: 1 }}>
          <Typography variant="h3" sx={{ fontWeight: "bold", mb: 2 }}>
            Project Aphasia Improve Test – Web Application
          </Typography>
          {/* logos */}
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 6, flexWrap: "wrap", mb: 3 }}>
            <Image src="/KMITL.png" alt="KMITL" width={160} height={160} style={{ objectFit: "contain" }} />
            <Image src="/NITSENDAI.png" alt="Sendai College" width={160} height={160} style={{ objectFit: "contain" }} />
          </Box>
        </Container>
      </Box>

      {/* Details section */}
      <Container sx={{ my: 6, maxWidth: 800 }}>
        <Paper elevation={1} sx={{ p: 4, borderRadius: 3 }}>
          <Typography variant="h5" gutterBottom>
            Summer Training Project
          </Typography>
          <Typography paragraph>
            Developer: Wachirawut Suttitanon (Robotics &amp; AI Engineering, King Mongkut&apos;s Institute of Technology
            Ladkrabang)
          </Typography>
          <Typography paragraph>
            Supervisor: Dr. Mio Sakuma (Department of General Engineering, National Institute of Technology Sendai College)
          </Typography>
          <Typography paragraph>
            This web application is part of the Aphasia Improve Test (AIT) initiative. It brings together FastAPI, PostgreSQL, Next.js and
            Material-UI to deliver a modern, responsive platform for conducting language-rehabilitation assignments. Patients can practise
            customised exercises assigned by doctors, receive instant feedback on automatically graded questions, and track their progress
            over time. Doctors benefit from a dedicated dashboard to assign work, review manual-graded answers and monitor each patient&apos;s
            performance. Admins manage content and users through an intuitive interface.
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3, mt: 3 }}>
            {[{
              title: "Accessible Web Therapy",
              desc: "Train anywhere, on any device – phone, tablet or PC.",
            }, {
              title: "Real-time Insights",
              desc: "Doctors track progress instantly and focus on what matters.",
            }].map((f)=> (
              <Paper key={f.title} elevation={0} sx={{ flex:"1 1 220px", p:2, border: `1px solid ${theme.palette.divider}`, borderRadius:2, transition:"box-shadow .2s", '&:hover':{ boxShadow:3 } }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>{f.title}</Typography>
                <Typography variant="body2" color="text.secondary">{f.desc}</Typography>
              </Paper>
            ))}
          </Box>
        </Paper>
      </Container>
    </Box>
  );
} 