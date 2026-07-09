import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Paper,
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
import { RechargeAgencyApplication } from "@/api/types";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "قيد المراجعة",
  APPROVED: "مقبولة",
  REJECTED: "مرفوضة",
  CHANGES_REQUESTED: "بانتظار تعديل",
  SUSPENDED: "معلّقة",
};

const STATUS_COLOR: Record<string, "warning" | "success" | "error" | "info" | "default"> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "error",
  CHANGES_REQUESTED: "info",
  SUSPENDED: "default",
};

export function ApplicationsPage() {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<RechargeAgencyApplication | null>(null);
  const [action, setAction] = useState("APPROVE");
  const [notes, setNotes] = useState("");

  const { data: applications, isLoading } = useQuery({
    queryKey: ["applications"],
    queryFn: async () => (await apiClient.get<RechargeAgencyApplication[]>("/recharge-agency/applications")).data,
  });

  const reviewMutation = useMutation({
    mutationFn: async () =>
      apiClient.patch(`/recharge-agency/applications/${selected?.id}/review`, { action, notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      setSelected(null);
      setNotes("");
    },
  });

  return (
    <Box>
      <Typography variant="h5" mb={2}>
        طلبات فتح وكالات الشحن
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>اسم الوكالة</TableCell>
              <TableCell>المتقدم</TableCell>
              <TableCell>الدولة/المدينة</TableCell>
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
            {applications?.map((app) => (
              <TableRow key={app.id}>
                <TableCell>{app.agencyName}</TableCell>
                <TableCell>{app.fullName}</TableCell>
                <TableCell>
                  {app.country} / {app.city}
                </TableCell>
                <TableCell>
                  <Chip label={STATUS_LABEL[app.status]} color={STATUS_COLOR[app.status]} size="small" />
                </TableCell>
                <TableCell>
                  <Button size="small" onClick={() => setSelected(app)}>
                    مراجعة
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={!!selected} onClose={() => setSelected(null)} fullWidth maxWidth="sm">
        <DialogTitle>مراجعة طلب: {selected?.agencyName}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <TextField select label="الإجراء" value={action} onChange={(e) => setAction(e.target.value)}>
            <MenuItem value="APPROVE">قبول</MenuItem>
            <MenuItem value="REJECT">رفض</MenuItem>
            <MenuItem value="REQUEST_CHANGES">طلب تعديل البيانات</MenuItem>
            <MenuItem value="SUSPEND">تعليق الوكالة</MenuItem>
          </TextField>
          <TextField
            label="ملاحظات"
            multiline
            minRows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelected(null)}>إلغاء</Button>
          <Button variant="contained" onClick={() => reviewMutation.mutate()}>
            تأكيد
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
