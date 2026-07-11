import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Button,
  Chip,
  LinearProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { apiClient } from "@/api/client";
import { WithdrawalRequest } from "@/api/types";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "قيد المراجعة",
  APPROVED: "مقبول",
  COMPLETED: "مكتمل",
  REJECTED: "مرفوض",
};

const STATUS_COLOR: Record<string, "warning" | "success" | "error" | "info"> = {
  PENDING: "warning",
  APPROVED: "success",
  COMPLETED: "success",
  REJECTED: "error",
};

export function WithdrawalRequestsPage() {
  const queryClient = useQueryClient();

  const { data: requests, isLoading } = useQuery({
    queryKey: ["withdrawal-requests"],
    queryFn: async () =>
      (await apiClient.get<WithdrawalRequest[]>("/recharge-agency/admin/withdrawal-requests")).data,
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ id, approve }: { id: string; approve: boolean }) =>
      apiClient.patch(`/recharge-agency/admin/withdrawal-requests/${id}/review`, { approve }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["withdrawal-requests"] }),
  });

  return (
    <Box>
      <PageHeader title="طلبات سحب الأرباح" subtitle="راجع طلبات سحب أرباح الوكلاء ووافق أو ارفض" />
      <Paper sx={{ borderRadius: 3, overflow: "hidden" }}>
        {isLoading && <LinearProgress />}
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>الوكيل</TableCell>
                <TableCell>المبلغ</TableCell>
                <TableCell>طريقة السحب</TableCell>
                <TableCell>رقم الحساب</TableCell>
                <TableCell>الحالة</TableCell>
                <TableCell align="left">إجراء</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {requests?.map((req) => (
                <TableRow key={req.id} hover>
                  <TableCell>{req.agent?.user.username}</TableCell>
                  <TableCell>
                    <Typography fontWeight={700} color="warning.main" component="span">
                      {req.amount}$
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ color: "text.secondary" }}>{req.method}</TableCell>
                  <TableCell sx={{ color: "text.secondary" }}>{req.accountNumber}</TableCell>
                  <TableCell>
                    <Chip label={STATUS_LABEL[req.status]} color={STATUS_COLOR[req.status]} size="small" />
                  </TableCell>
                  <TableCell align="left">
                    {req.status === "PENDING" && (
                      <>
                        <Button
                          size="small"
                          color="success"
                          onClick={() => reviewMutation.mutate({ id: req.id, approve: true })}
                        >
                          قبول
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          onClick={() => reviewMutation.mutate({ id: req.id, approve: false })}
                        >
                          رفض
                        </Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        {!isLoading && requests?.length === 0 && <EmptyState message="لا توجد طلبات سحب حتى الآن" />}
      </Paper>
    </Box>
  );
}
