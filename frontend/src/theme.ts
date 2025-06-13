import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#3EB489", // mint green
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#98FF98", // lighter mint
      contrastText: "#ffffff",
    },
    background: {
      default: "#ffffff",
      paper: "#ffffff",
    },
  },
  shape: {
    borderRadius: 12, // rounded squares
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: "none",
        },
      },
    },
  },
});

export default theme; 