import { ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  AppBar,
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  IconButton,
} from "@mui/material";
import AssignmentIcon from "@mui/icons-material/Assignment";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import PaymentsIcon from "@mui/icons-material/Payments";
import TuneIcon from "@mui/icons-material/Tune";
import MicIcon from "@mui/icons-material/Mic";
import LogoutIcon from "@mui/icons-material/Logout";
import { useAuth } from "@/auth/AuthContext";

const DRAWER_WIDTH = 240;

const NAV_ITEMS = [
  { to: "/applications", label: "طلبات فتح الوكالات", icon: <AssignmentIcon /> },
  { to: "/topups", label: "طلبات تعبئة الرصيد", icon: <AccountBalanceWalletIcon /> },
  { to: "/withdrawals", label: "طلبات السحب", icon: <PaymentsIcon /> },
  { to: "/rooms", label: "الغرف الصوتية", icon: <MicIcon /> },
  { to: "/settings", label: "إعدادات العمولات", icon: <TuneIcon /> },
];

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <Box sx={{ display: "flex" }}>
      <AppBar position="fixed" sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}>
        <Toolbar sx={{ justifyContent: "space-between" }}>
          <Typography variant="h6" noWrap>
            Code — لوحة إدارة وكالات الشحن
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="body2">{user?.fullName}</Typography>
            <IconButton color="inherit" onClick={logout} title="تسجيل الخروج">
              <LogoutIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        anchor="right"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: DRAWER_WIDTH, boxSizing: "border-box" },
        }}
      >
        <Toolbar />
        <List>
          {NAV_ITEMS.map((item) => (
            <ListItemButton key={item.to} onClick={() => navigate(item.to)} component={NavLink} to={item.to}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          ))}
        </List>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}
