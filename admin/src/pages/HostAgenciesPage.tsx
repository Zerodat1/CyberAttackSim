import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  Paper,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { apiClient } from "@/api/client";
import {
  AgencyWithdrawalRequest,
  HostAgencyAdminOverview,
  HostAgencyDashboard,
  HostWithdrawalRequest,
} from "@/api/types";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "قيد المراجعة",
  COMPLETED: "مكتملة",
  REJECTED: "مرفوضة",
};

const STATUS_COLOR: Record<string, "warning" | "success" | "error" | "default"> = {
  PENDING: "warning",
  COMPLETED: "success",
  REJECTED: "error",
};

export function HostAgenciesPage() {
  const queryClient = useQueryClient();
  const [targetDialog, setTargetDialog] = useState<HostAgencyAdminOverview | null>(null);
  const [targetValue, setTargetValue] = useState("");
  const [detailAgencyId, setDetailAgencyId] = useState<string | null>(null);

  const { data: agencies, isLoading } = useQuery({
    queryKey: ["admin-host-agencies"],
    queryFn: async () => (await apiClient.get<HostAgencyAdminOverview[]>("/host-agencies-admin/agencies")).data,
  });

  const { data: detail } = useQuery({
    queryKey: ["admin-host-agency-detail", detailAgencyId],
    queryFn: async () =>
      (await apiClient.get<HostAgencyDashboard>(`/host-agencies-admin/agencies/${detailAgencyId}`)).data,
    enabled: !!detailAgencyId,
  });

  const { data: hostWithdrawals, isLoading: hostWithdrawalsLoading } = useQuery({
    queryKey: ["admin-host-withdrawals"],
    queryFn: async () =>
      (await apiClient.get<HostWithdrawalRequest[]>("/host-agencies-admin/host-withdrawals")).data,
  });

  const { data: agencyWithdrawals, isLoading: agencyWithdrawalsLoading } = useQuery({
    queryKey: ["admin-agency-withdrawals"],
    queryFn: async () =>
      (await apiClient.get<AgencyWithdrawalRequest[]>("/host-agencies-admin/agency-withdrawals")).data,
  });

  const togglePremiumMutation = useMutation({
    mutationFn: async ({ id, isPremium }: { id: string; isPremium: boolean }) =>
      apiClient.patch(`/host-agencies-admin/agencies/${id}`, { isPremium }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-host-agencies"] }),
  });

  const saveTargetMutation = useMutation({
    mutationFn: async () =>
      apiClient.patch(`/host-agencies-admin/agencies/${targetDialog?.id}`, {
        monthlyTargetDiamonds: targetValue ? Number(targetValue) : null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-host-agencies"] });
      setTargetDialog(null);
    },
  });

  const reviewHostWithdrawalMutation = useMutation({
    mutationFn: async ({ id, approve }: { id: string; approve: boolean }) =>
      apiClient.patch(`/host-agencies-admin/host-withdrawals/${id}/review`, { approve }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-host-withdrawals"] }),
  });

  const reviewAgencyWithdrawalMutation = useMutation({
    mutationFn: async ({ id, approve }: { id: string; approve: boolean }) =>
      apiClient.patch(`/host-agencies-admin/agency-withdrawals/${id}/review`, { approve }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-agency-withdrawals"] }),
  });

  return (
    <Box>
      <PageHeader
        title="وكالات المضيفين"
        subtitle="راقب أداء وكالات المضيفين، فعّل الوكالات المميزة، وحدد التارجت الشهري لفتح نسبة العمولة الأعلى"
      />

      <Paper sx={{ borderRadius: 3, overflow: "hidden", mb: 4 }}>
        {isLoading && <LinearProgress />}
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>الوكالة</TableCell>
                <TableCell>المضيفون</TableCell>
                <TableCell>ألماس الشهر</TableCell>
                <TableCell>التارجت الشهري</TableCell>
                <TableCell>رصيد العمولة</TableCell>
                <TableCell>مميزة</TableCell>
                <TableCell align="left">إجراء</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {agencies?.map((agency) => (
                <TableRow key={agency.id} hover>
                  <TableCell>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Avatar src={agency.owner.avatarUrl ?? undefined} sx={{ width: 32, height: 32, fontSize: 12 }}>
                        {agency.name.slice(0, 1)}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {agency.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          المالك: {agency.owner.fullName}
                        </Typography>
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell>{agency._count.members}</TableCell>
                  <TableCell>{Number(agency.monthlyDiamonds).toLocaleString("en")}</TableCell>
                  <TableCell sx={{ color: "text.secondary" }}>
                    {agency.monthlyTargetDiamonds ? Number(agency.monthlyTargetDiamonds).toLocaleString("en") : "—"}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "success.main" }}>
                    {Number(agency.commissionBalance).toFixed(2)}$
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={agency.isPremium}
                      onChange={(e) => togglePremiumMutation.mutate({ id: agency.id, isPremium: e.target.checked })}
                    />
                  </TableCell>
                  <TableCell align="left">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Button size="small" onClick={() => setDetailAgencyId(agency.id)}>
                        التفاصيل
                      </Button>
                      <Button
                        size="small"
                        onClick={() => {
                          setTargetDialog(agency);
                          setTargetValue(agency.monthlyTargetDiamonds ?? "");
                        }}
                      >
                        تحديد التارجت
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        {!isLoading && agencies?.length === 0 && <EmptyState message="لا توجد وكالات مضيفين بعد" />}
      </Paper>

      <PageHeader title="طلبات فك ألماس المضيفين" subtitle="راجع طلبات تحويل الألماس إلى أموال لكل مضيف" />
      <Paper sx={{ borderRadius: 3, overflow: "hidden", mb: 4 }}>
        {hostWithdrawalsLoading && <LinearProgress />}
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>المضيف</TableCell>
                <TableCell>الألماس</TableCell>
                <TableCell>المبلغ ($)</TableCell>
                <TableCell>طريقة الاستلام</TableCell>
                <TableCell>الحالة</TableCell>
                <TableCell align="left">إجراء</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {hostWithdrawals?.map((req) => (
                <TableRow key={req.id} hover>
                  <TableCell>{req.host?.fullName ?? req.hostId}</TableCell>
                  <TableCell>{Number(req.diamondsAmount).toLocaleString("en")}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{req.usdAmount}$</TableCell>
                  <TableCell sx={{ color: "text.secondary" }}>
                    {req.method} / {req.accountNumber}
                  </TableCell>
                  <TableCell>
                    <Chip label={STATUS_LABEL[req.status] ?? req.status} color={STATUS_COLOR[req.status] ?? "default"} size="small" />
                  </TableCell>
                  <TableCell align="left">
                    {req.status === "PENDING" && (
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Button
                          size="small"
                          color="success"
                          onClick={() => reviewHostWithdrawalMutation.mutate({ id: req.id, approve: true })}
                        >
                          قبول
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          onClick={() => reviewHostWithdrawalMutation.mutate({ id: req.id, approve: false })}
                        >
                          رفض
                        </Button>
                      </Stack>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        {!hostWithdrawalsLoading && hostWithdrawals?.length === 0 && (
          <EmptyState message="لا توجد طلبات فك بعد" />
        )}
      </Paper>

      <PageHeader title="طلبات سحب عمولة الوكالات" subtitle="راجع طلبات سحب رصيد العمولة المتراكم لكل وكالة" />
      <Paper sx={{ borderRadius: 3, overflow: "hidden" }}>
        {agencyWithdrawalsLoading && <LinearProgress />}
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>الوكالة</TableCell>
                <TableCell>المبلغ ($)</TableCell>
                <TableCell>طريقة الاستلام</TableCell>
                <TableCell>الحالة</TableCell>
                <TableCell align="left">إجراء</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {agencyWithdrawals?.map((req) => (
                <TableRow key={req.id} hover>
                  <TableCell>{req.agency?.name ?? req.agencyId}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{req.usdAmount}$</TableCell>
                  <TableCell sx={{ color: "text.secondary" }}>
                    {req.method} / {req.accountNumber}
                  </TableCell>
                  <TableCell>
                    <Chip label={STATUS_LABEL[req.status] ?? req.status} color={STATUS_COLOR[req.status] ?? "default"} size="small" />
                  </TableCell>
                  <TableCell align="left">
                    {req.status === "PENDING" && (
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Button
                          size="small"
                          color="success"
                          onClick={() => reviewAgencyWithdrawalMutation.mutate({ id: req.id, approve: true })}
                        >
                          قبول
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          onClick={() => reviewAgencyWithdrawalMutation.mutate({ id: req.id, approve: false })}
                        >
                          رفض
                        </Button>
                      </Stack>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        {!agencyWithdrawalsLoading && agencyWithdrawals?.length === 0 && (
          <EmptyState message="لا توجد طلبات سحب بعد" />
        )}
      </Paper>

      <Dialog open={!!targetDialog} onClose={() => setTargetDialog(null)} fullWidth maxWidth="xs">
        <DialogTitle>تحديد التارجت الشهري لـ {targetDialog?.name}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            عند تجاوز الوكالة لهذا الرقم من إجمالي الألماس خلال الشهر، ترتفع نسبة عمولتها تلقائيًا. اتركه فارغًا لتعطيل
            هذه الميزة.
          </Typography>
          <TextField
            label="عتبة الألماس الشهرية"
            type="number"
            value={targetValue}
            onChange={(e) => setTargetValue(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTargetDialog(null)}>إلغاء</Button>
          <Button variant="contained" onClick={() => saveTargetMutation.mutate()}>
            حفظ
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!detailAgencyId} onClose={() => setDetailAgencyId(null)} fullWidth maxWidth="sm">
        <DialogTitle>{detail?.name}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 1.5, pt: 1 }}>
          {detail && (
            <>
              <Stack direction="row" justifyContent="space-between">
                <Typography color="text.secondary">نسبة العمولة الحالية</Typography>
                <Typography fontWeight={700}>{detail.effectiveCommissionRate}%</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography color="text.secondary">أرباح اليوم</Typography>
                <Typography fontWeight={700}>{detail.dailyProfitUsd.toFixed(2)}$</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography color="text.secondary">أرباح الشهر</Typography>
                <Typography fontWeight={700}>{detail.monthlyProfitUsd.toFixed(2)}$</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography color="text.secondary">رصيد العمولة القابل للسحب</Typography>
                <Typography fontWeight={700}>{detail.commissionBalance.toFixed(2)}$</Typography>
              </Stack>
              <Typography variant="subtitle2" fontWeight={700} mt={2}>
                دخل كل مضيف هذا الشهر
              </Typography>
              {detail.hosts.map((host) => (
                <Stack key={host.userId} direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2">{host.fullName}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {host.monthlyDiamonds.toLocaleString("en")} ألماسة
                  </Typography>
                </Stack>
              ))}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailAgencyId(null)}>إغلاق</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
