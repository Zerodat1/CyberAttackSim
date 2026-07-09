import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { Layout } from "@/components/Layout";
import { LoginPage } from "@/pages/LoginPage";
import { ApplicationsPage } from "@/pages/ApplicationsPage";
import { TopUpRequestsPage } from "@/pages/TopUpRequestsPage";
import { WithdrawalRequestsPage } from "@/pages/WithdrawalRequestsPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { RoomsPage } from "@/pages/RoomsPage";
import { GiftsPage } from "@/pages/GiftsPage";
import { GamesPage } from "@/pages/GamesPage";
import { AdminDashboardPage } from "@/pages/AdminDashboardPage";
import { AdminInvitesPage } from "@/pages/AdminInvitesPage";
import { AdminRegisterPage } from "@/pages/AdminRegisterPage";
import { GlobalRole } from "@/api/types";

const MANAGEMENT_ROLES: GlobalRole[] = ["OWNER", "RECHARGE_MANAGER"];

function ProtectedLayout({
  children,
  allow = MANAGEMENT_ROLES,
}: {
  children: React.ReactNode;
  allow?: GlobalRole[];
}) {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allow.includes(user.globalRole)) {
    return <Navigate to={user.globalRole === "ADMIN" ? "/admin-dashboard" : "/login"} replace />;
  }

  return <Layout>{children}</Layout>;
}

function DefaultRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.globalRole === "ADMIN" ? "/admin-dashboard" : "/applications"} replace />;
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/admin-register/:token" element={<AdminRegisterPage />} />
      <Route
        path="/admin-dashboard"
        element={
          <ProtectedLayout allow={["OWNER", "RECHARGE_MANAGER", "ADMIN"]}>
            <AdminDashboardPage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/admin-invites"
        element={
          <ProtectedLayout allow={["OWNER"]}>
            <AdminInvitesPage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/applications"
        element={
          <ProtectedLayout>
            <ApplicationsPage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/topups"
        element={
          <ProtectedLayout>
            <TopUpRequestsPage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/withdrawals"
        element={
          <ProtectedLayout>
            <WithdrawalRequestsPage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedLayout>
            <SettingsPage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/rooms"
        element={
          <ProtectedLayout>
            <RoomsPage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/gifts"
        element={
          <ProtectedLayout>
            <GiftsPage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/games"
        element={
          <ProtectedLayout>
            <GamesPage />
          </ProtectedLayout>
        }
      />
      <Route path="*" element={<DefaultRedirect />} />
    </Routes>
  );
}
