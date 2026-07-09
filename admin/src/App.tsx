import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { Layout } from "@/components/Layout";
import { LoginPage } from "@/pages/LoginPage";
import { ApplicationsPage } from "@/pages/ApplicationsPage";
import { TopUpRequestsPage } from "@/pages/TopUpRequestsPage";
import { WithdrawalRequestsPage } from "@/pages/WithdrawalRequestsPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { RoomsPage } from "@/pages/RoomsPage";

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!user || (user.globalRole !== "OWNER" && user.globalRole !== "RECHARGE_MANAGER")) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
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
      <Route path="*" element={<Navigate to="/applications" replace />} />
    </Routes>
  );
}
