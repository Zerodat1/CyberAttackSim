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
import { TopUpRequest } from "@/api/types";

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
      <Typography variant="h5" mb={2}>
        طلبات تعبئة الرصيد
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>الوكيل</TableCell>
              <TableCell>المبلغ</TableCell>
              <TableCell>طريقة الدفع</TableCell>
              <TableCell>الحالة</TableCell>
              <TableCell>إجراء</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={5}>جارٍ التحميل...</TableCell>
              </TableRow>
            )}
            {requests?.map((req) => (
              <TableRow key={req.id}>
                <TableCell>{req.agent?.user.username}</TableCell>
                <TableCell>{req.amount}$</TableCell>
                <TableCell>{req.paymentMethod}</TableCell>
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
