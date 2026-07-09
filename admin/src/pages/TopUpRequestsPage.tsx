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
import { TopUpRequest } from "@/api/types";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "قيد المراجعة",
  APPROVED: "مقبول",
  REJECTED: "مرفوض",
};

const STATUS_COLOR: Record<string, "warning" | "success" | "error"> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "error",
};

export function TopUpRequestsPage() {
  const queryClient = useQueryClient();

  const { data: requests, isLoading } = useQuery({
    queryKey: ["topup-requests"],
    queryFn: async () =>
      (await apiClient.get<TopUpRequest[]>("/recharge-agency/admin/topup-requests")).data,
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ id, approve }: { id: string; approve: boolean }) =>
      apiClient.patch(`/recharge-agency/admin/topup-requests/${id}/review`, { approve }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["topup-requests"] }),
  });

  return (
    <Box>
      <PageHeader title="طلبات تعبئة الرصيد" subtitle="راجع طلبات الوكلاء لتعبئة أرصدتهم ووافق أو ارفض" />
      <Paper sx={{ borderRadius: 3, overflow: "hidden" }}>
        {isLoading && <LinearProgress />}
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>الوكيل</TableCell>
                <TableCell>المبلغ</TableCell>
                <TableCell>طريقة الدفع</TableCell>
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
                  <TableCell sx={{ color: "text.secondary" }}>{req.paymentMethod}</TableCell>
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
        {!isLoading && requests?.length === 0 && <EmptyState message="لا توجد طلبات تعبئة رصيد حتى الآن" />}
      </Paper>
    </Box>
  );
}
