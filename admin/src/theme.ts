import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  direction: "rtl",
  palette: {
    mode: "light",
    primary: { main: "#5b4cf5" },
    secondary: { main: "#00b894" },
  },
  typography: {
    fontFamily: "'Segoe UI', Tahoma, Arial, sans-serif",
  },
});
