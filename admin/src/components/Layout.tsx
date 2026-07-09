import { ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Avatar,
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
  IconButton,
  Divider,
} from "@mui/material";
import AssignmentIcon from "@mui/icons-material/Assignment";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import PaymentsIcon from "@mui/icons-material/Payments";
import TuneIcon from "@mui/icons-material/Tune";
import MicIcon from "@mui/icons-material/Mic";
import CardGiftcardIcon from "@mui/icons-material/CardGiftcard";
import CasinoIcon from "@mui/icons-material/Casino";
import LogoutIcon from "@mui/icons-material/Logout";
import { useAuth } from "@/auth/AuthContext";

const DRAWER_WIDTH = 264;
const APPBAR_HEIGHT = 68;

const NAV_ITEMS = [
  { to: "/applications", label: "طلبات فتح الوكالات", icon: <AssignmentIcon /> },
  { to: "/topups", label: "طلبات تعبئة الرصيد", icon: <AccountBalanceWalletIcon /> },
  { to: "/withdrawals", label: "طلبات السحب", icon: <PaymentsIcon /> },
  { to: "/rooms", label: "الغرف الصوتية", icon: <MicIcon /> },
  { to: "/gifts", label: "كتالوج الهدايا", icon: <CardGiftcardIcon /> },
  { to: "/games", label: "ألعاب الرهان", icon: <CasinoIcon /> },
  { to: "/settings", label: "إعدادات العمولات", icon: <TuneIcon /> },
];

function initialsOf(name?: string): string {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <Drawer
        variant="permanent"
        anchor="right"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: DRAWER_WIDTH, boxSizing: "border-box", border: "none" },
        }}
      >
        <Box sx={{ height: APPBAR_HEIGHT, display: "flex", alignItems: "center", px: 3 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: "10px",
                background: "linear-gradient(135deg, #5b4cf5, #7c6cf9)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontWeight: 800,
                fontSize: 16,
              }}
            >
              C
            </Box>
            <Typography variant="h6" fontWeight={800}>
              Code
            </Typography>
          </Stack>
        </Box>
        <Divider />
        <List sx={{ px: 1, py: 2, flexGrow: 1 }}>
          {NAV_ITEMS.map((item) => (
            <ListItemButton
              key={item.to}
              component={NavLink}
              to={item.to}
              className={location.pathname === item.to ? "active" : undefined}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: 600, fontSize: 14 }} />
            </ListItemButton>
          ))}
        </List>
        <Divider />
        <Box sx={{ p: 2 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar sx={{ bgcolor: "primary.main", width: 36, height: 36, fontSize: 14, fontWeight: 700 }}>
              {initialsOf(user?.fullName)}
            </Avatar>
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography variant="body2" fontWeight={700} noWrap>
                {user?.fullName}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                {user?.globalRole === "OWNER" ? "المالك" : "مدير الشحن"}
              </Typography>
            </Box>
            <IconButton size="small" onClick={logout} title="تسجيل الخروج">
              <LogoutIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Box>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 4 }, bgcolor: "background.default" }}>
        {children}
      </Box>
    </Box>
  );
}
