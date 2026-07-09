import { createTheme } from "@mui/material/styles";

const BRAND_PURPLE = "#5b4cf5";
const BRAND_TEAL = "#00b894";
const BRAND_GOLD = "#f5a623";

export const theme = createTheme({
  direction: "rtl",
  shape: {
    borderRadius: 14,
  },
  palette: {
    mode: "light",
    primary: { main: BRAND_PURPLE, contrastText: "#ffffff" },
    secondary: { main: BRAND_TEAL, contrastText: "#ffffff" },
    warning: { main: BRAND_GOLD },
    background: {
      default: "#f4f5fb",
      paper: "#ffffff",
    },
    text: {
      primary: "#1a1d29",
      secondary: "#6b7280",
    },
    divider: "rgba(26, 29, 41, 0.08)",
  },
  typography: {
    fontFamily: "'Segoe UI', Tahoma, Arial, sans-serif",
    h5: { fontWeight: 800 },
    h6: { fontWeight: 700 },
    button: { textTransform: "none", fontWeight: 700 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: "#f4f5fb" },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderLeft: "none",
          backgroundColor: "#ffffff",
          boxShadow: "-1px 0 0 rgba(26, 29, 41, 0.06)",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
        elevation1: {
          boxShadow: "0 1px 3px rgba(26, 29, 41, 0.06), 0 1px 2px rgba(26, 29, 41, 0.04)",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          paddingInline: 18,
        },
        contained: {
          boxShadow: "0 4px 12px rgba(91, 76, 245, 0.25)",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 700 },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 700,
          color: "#6b7280",
          backgroundColor: "#f9fafc",
          borderBottom: "1px solid rgba(26, 29, 41, 0.08)",
        },
        root: {
          borderBottom: "1px solid rgba(26, 29, 41, 0.06)",
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          marginInline: 8,
          marginBottom: 4,
          "&.active": {
            backgroundColor: "rgba(91, 76, 245, 0.1)",
            color: BRAND_PURPLE,
            "& .MuiListItemIcon-root": { color: BRAND_PURPLE },
          },
        },
      },
    },
  },
});

export const brandColors = { purple: BRAND_PURPLE, teal: BRAND_TEAL, gold: BRAND_GOLD };
