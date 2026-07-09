import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Button,
  Chip,
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
      <Typography variant="h5" mb={2}>
        طلبات سحب الأرباح
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>الوكيل</TableCell>
              <TableCell>المبلغ</TableCell>
              <TableCell>طريقة السحب</TableCell>
              <TableCell>رقم الحساب</TableCell>
              <TableCell>الحالة</TableCell>
              <TableCell>إجراء</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={6}>جارٍ التحميل...</TableCell>
              </TableRow>
            )}
            {requests?.map((req) => (
              <TableRow key={req.id}>
                <TableCell>{req.agent?.user.username}</TableCell>
                <TableCell>{req.amount}$</TableCell>
                <TableCell>{req.method}</TableCell>
                <TableCell>{req.accountNumber}</TableCell>
                <TableCell>
                  <Chip label={req.status} color={STATUS_COLOR[req.status]} size="small" />
                </TableCell>
                <TableCell>
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
    </Box>
  );
}
