import { useQuery } from "@tanstack/react-query";
import { Box, Card, CircularProgress, Grid, Stack, Typography } from "@mui/material";
import GroupIcon from "@mui/icons-material/Group";
import MicIcon from "@mui/icons-material/Mic";
import CardGiftcardIcon from "@mui/icons-material/CardGiftcard";
import CasinoIcon from "@mui/icons-material/Casino";
import { apiClient } from "@/api/client";
import { AdminStatsOverview } from "@/api/types";
import { PageHeader } from "@/components/PageHeader";

const GAME_LABEL: Record<string, string> = {
  DICE_GUESS: "النرد",
  LUCKY_WHEEL: "عجلة الحظ",
  SLOT_MACHINE: "سلوتس",
  CRASH_GUESS: "الصاروخ",
};

const ROLE_LABEL: Record<string, string> = {
  USER: "مستخدم",
  RECHARGE_MANAGER: "مدير شحن",
  OWNER: "مالك",
  ADMIN: "أدمن",
};

function StatCard({
  icon,
  color,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  color: string;
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <Card sx={{ p: 3, height: "100%" }}>
      <Stack direction="row" spacing={2} alignItems="center">
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: `${color}1a`,
            color,
          }}
        >
          {icon}
        </Box>
        <Box>
          <Typography variant="h5" fontWeight={800}>
            {value}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {label}
          </Typography>
        </Box>
      </Stack>
      {hint && (
        <Typography variant="caption" color="text.secondary" mt={1.5} display="block">
          {hint}
        </Typography>
      )}
    </Card>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card sx={{ p: 3, height: "100%" }}>
      <Typography variant="subtitle1" fontWeight={700} mb={2}>
        {title}
      </Typography>
      <Stack spacing={1.25}>{children}</Stack>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <Stack direction="row" justifyContent="space-between">
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={700}>
        {value}
      </Typography>
    </Stack>
  );
}

export function AdminDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-stats-overview"],
    queryFn: async () => (await apiClient.get<AdminStatsOverview>("/admin-stats/overview")).data,
  });

  if (isLoading || !data) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader title="لوحة المراقبة" subtitle="نظرة عامة للقراءة فقط على حالة المنصة الحالية" />

      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<GroupIcon />}
            color="#5b4cf5"
            label="إجمالي المستخدمين"
            value={data.users.total}
            hint={`${data.users.newLast7Days} جديد آخر 7 أيام`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<MicIcon />}
            color="#00b894"
            label="الغرف الصوتية"
            value={data.rooms.total}
            hint={`${data.rooms.active} نشطة`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<CardGiftcardIcon />}
            color="#f5a623"
            label="الهدايا المرسلة"
            value={data.gifts.totalSends}
            hint={`${data.gifts.sendsLast7Days} آخر 7 أيام`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<CasinoIcon />}
            color="#e04f8f"
            label="جولات الألعاب"
            value={data.games.totalRounds}
          />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6} lg={4}>
          <SectionCard title="المستخدمون حسب الدور">
            {Object.entries(data.users.byRole).map(([role, count]) => (
              <Row key={role} label={ROLE_LABEL[role] ?? role} value={count} />
            ))}
            <Row label="نشطون" value={data.users.active} />
          </SectionCard>
        </Grid>

        <Grid item xs={12} md={6} lg={4}>
          <SectionCard title="طلبات فتح الوكالات">
            {Object.keys(data.rechargeApplications).length === 0 && (
              <Typography variant="body2" color="text.secondary">
                لا توجد طلبات بعد
              </Typography>
            )}
            {Object.entries(data.rechargeApplications).map(([status, count]) => (
              <Row key={status} label={status} value={count} />
            ))}
          </SectionCard>
        </Grid>

        <Grid item xs={12} md={6} lg={4}>
          <SectionCard title="وكالات الشحن">
            {Object.keys(data.rechargeAgencies).length === 0 && (
              <Typography variant="body2" color="text.secondary">
                لا توجد وكالات بعد
              </Typography>
            )}
            {Object.entries(data.rechargeAgencies).map(([status, count]) => (
              <Row key={status} label={status} value={count} />
            ))}
          </SectionCard>
        </Grid>

        <Grid item xs={12} md={6} lg={4}>
          <SectionCard title="طلبات تعبئة الرصيد">
            {Object.entries(data.topUpRequests.byStatus).map(([status, count]) => (
              <Row key={status} label={status} value={count} />
            ))}
            <Row label="إجمالي المكتمل" value={data.topUpRequests.completedTotalAmount} />
          </SectionCard>
        </Grid>

        <Grid item xs={12} md={6} lg={4}>
          <SectionCard title="طلبات السحب">
            {Object.entries(data.withdrawalRequests.byStatus).map(([status, count]) => (
              <Row key={status} label={status} value={count} />
            ))}
            <Row label="إجمالي المكتمل" value={data.withdrawalRequests.completedTotalAmount} />
          </SectionCard>
        </Grid>

        <Grid item xs={12} md={6} lg={4}>
          <SectionCard title="إيرادات المنصة">
            <Row label="حصة المنصة (SUCCESS)" value={data.platformRevenue.totalPlatformShare} />
          </SectionCard>
        </Grid>

        <Grid item xs={12} md={6} lg={4}>
          <SectionCard title="الألعاب حسب النوع">
            {data.games.byType.map((row) => (
              <Row
                key={row.gameType}
                label={GAME_LABEL[row.gameType] ?? row.gameType}
                value={`${row.rounds} جولة (${row.wins} فوز)`}
              />
            ))}
            <Row label="إجمالي الرهانات" value={data.games.totalBetAmount} />
            <Row label="إجمالي الأرباح المدفوعة" value={data.games.totalPayout} />
          </SectionCard>
        </Grid>

        <Grid item xs={12} md={6} lg={4}>
          <SectionCard title="وكالات المضيفين">
            <Row label="إجمالي الوكالات" value={data.hostAgencies.total} />
            <Row label="نشطة" value={data.hostAgencies.active} />
            <Row label="إجمالي الأعضاء" value={data.hostAgencies.totalMembers} />
          </SectionCard>
        </Grid>

        <Grid item xs={12} md={6} lg={4}>
          <SectionCard title="اقتصاد المحافظ">
            <Row label="إجمالي الذهب المتداول" value={data.wallet.totalGold} />
            <Row label="إجمالي الألماس المتداول" value={data.wallet.totalDiamonds} />
          </SectionCard>
        </Grid>
      </Grid>
    </Box>
  );
}
