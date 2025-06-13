"use client";

import { Box, Button, Container, Typography, List, ListItem, ListItemIcon, ListItemText } from "@mui/material";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useLanguage } from "../context/LanguageContext";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function Home() {
  const router = useRouter();
  const { t } = useLanguage();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  };

  const popUpVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
      },
    },
  };



  return (
    <Box>
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
                 <Box
           sx={{
             position: "relative",
             display: "flex",
             alignItems: "center",
             justifyContent: "center",
             minHeight: { xs: 600, md: 700 },
             overflow: "hidden",
             backgroundColor: "white",
           }}
         >
          
          {/* Static Background Logo */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          >
            <Image
              src="/AITW.png"
              alt="AITW"
              fill
              style={{ objectFit: "cover", opacity: 0.15 }}
              priority
            />
          </div>

          <Container sx={{ position: "relative", textAlign: "center", zIndex: 1 }}>
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate={isLoaded ? "visible" : "hidden"}
            >
                             <motion.div variants={itemVariants}>
                 <Typography 
                   variant="h2" 
                   component="h1" 
                   sx={{ 
                     fontWeight: "bold", 
                     mb: 2,
                     fontSize: { xs: "3rem", md: "4.5rem" },
                     color: "#3EB489",
                   }}
                 >
                   {t("landing.title")}
                 </Typography>
               </motion.div>
              
                             <motion.div variants={itemVariants}>
                 <Typography variant="h6" sx={{ maxWidth: 700, mx: "auto", mb: 4, whiteSpace: 'pre-line' }}>
                   {t("landing.subtitle")}
                 </Typography>
               </motion.div>

              {/* Features list with staggered animations */}
              <motion.div variants={itemVariants}>
                <Container maxWidth="sm">
                  <Typography variant="h5" gutterBottom>{t("landingFeatures.title")}</Typography>
                  <List>
                    {[1,2,3,4].map((i, index) => (
                      <motion.div
                        key={i}
                        variants={popUpVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ 
                          scale: 1.05,
                          transition: { duration: 0.2 }
                        }}
                      >
                        <ListItem sx={{ py: 0 }}>
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            <motion.div
                              animate={{ rotate: [0, 360] }}
                              transition={{ 
                                duration: 2, 
                                repeat: Infinity,
                                repeatDelay: 3,
                                ease: "easeInOut"
                              }}
                            >
                              <CheckCircleIcon color="primary" />
                            </motion.div>
                          </ListItemIcon>
                          <ListItemText primary={t(`landingFeatures.item${i}`)} />
                        </ListItem>
                      </motion.div>
                    ))}
                  </List>
                </Container>
              </motion.div>
            </motion.div>
          </Container>
        </Box>
      </motion.div>

      {/* Getting Started Section with scroll animation */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <Container sx={{ py: 8, textAlign: "center" }}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Typography variant="h4" gutterBottom>
              {t("landingSteps.title")}
            </Typography>
          </motion.div>
          
          <List sx={{ maxWidth: 500, mx: "auto", mb:4 }}>
            {[1,2,3,4].map((i, index) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ 
                  delay: index * 0.2,
                  duration: 0.6,
                  ease: "easeOut"
                }}
                whileHover={{ 
                  scale: 1.03,
                  backgroundColor: "rgba(99, 102, 241, 0.05)",
                  borderRadius: "8px",
                  transition: { duration: 0.2 }
                }}
              >
                <ListItem>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <motion.div
                      whileHover={{ scale: 1.2, rotate: 15 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <CheckCircleIcon color="secondary" />
                    </motion.div>
                  </ListItemIcon>
                  <ListItemText primary={t(`landingSteps.step${i}`)} />
                </ListItem>
              </motion.div>
            ))}
          </List>
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button 
              variant="contained" 
              size="large" 
              onClick={() => router.push("/register")}
              sx={{
                background: "linear-gradient(45deg, #6366f1, #8b5cf6)",
                boxShadow: "0 4px 20px rgba(99, 102, 241, 0.3)",
                "&:hover": {
                  background: "linear-gradient(45deg, #5854eb, #7c3aed)",
                  boxShadow: "0 6px 25px rgba(99, 102, 241, 0.4)",
                },
              }}
            > 
              {t("landing.getStartedButton")}
            </Button>
          </motion.div>
        </Container>
      </motion.div>

      {/* About Section with animated background */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <Box sx={{ position: "relative", py: 8, overflow: "hidden" }}>
          {/* Animated gradient background */}
          <motion.div
            animate={{
              background: [
                "linear-gradient(135deg, #f5f5f5, #e3f2fd, #f5f5f5)",
                "linear-gradient(135deg, #e3f2fd, #f3e5f5, #e3f2fd)",
                "linear-gradient(135deg, #f3e5f5, #f5f5f5, #f3e5f5)",
                "linear-gradient(135deg, #f5f5f5, #e3f2fd, #f5f5f5)",
              ],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "linear",
            }}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          />
          
          <Container sx={{ textAlign: "center", maxWidth: 800, position: "relative", zIndex: 1 }}>
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <Typography variant="h4" gutterBottom>
                {t("landingMission")}
              </Typography>
            </motion.div>
            
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Typography sx={{ mb: 4 }}>{t("landing.aboutDesc")}</Typography>
            </motion.div>
            
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                variant="outlined" 
                size="large" 
                onClick={() => router.push("/about")}
                sx={{
                  borderColor: "#6366f1",
                  color: "#6366f1",
                  "&:hover": {
                    borderColor: "#5854eb",
                    backgroundColor: "rgba(99, 102, 241, 0.05)",
                  },
                }}
              > 
                {t("landing.aboutButton")}
              </Button>
            </motion.div>
          </Container>
                 </Box>
       </motion.div>

       {/* Footer */}
       <Box sx={{ backgroundColor: "#f9f9f9", py: 3, mt: 4 }}>
         <Container sx={{ textAlign: "center" }}>
           <Typography variant="body2" color="text.secondary">
             © {new Date().getFullYear()} AIT-W. All rights reserved.
           </Typography>
         </Container>
       </Box>
     </Box>
   );
 }
