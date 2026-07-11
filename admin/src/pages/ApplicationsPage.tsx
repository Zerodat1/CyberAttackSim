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
  MenuItem,
  Paper,
  Stack,
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
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";

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
      <PageHeader
        title="طلبات فتح وكالات الشحن"
        subtitle="راجع الطلبات الواردة ووافق أو ارفض أو اطلب تعديل البيانات"
      />
      <Paper sx={{ borderRadius: 3, overflow: "hidden" }}>
        {isLoading && <LinearProgress />}
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>المتقدم</TableCell>
                <TableCell>اسم الوكالة</TableCell>
                <TableCell>رقم الهاتف</TableCell>
                <TableCell>الدولة/المدينة</TableCell>
                <TableCell>الحالة</TableCell>
                <TableCell align="left">إجراء</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {applications?.map((app) => (
                <TableRow key={app.id} hover>
                  <TableCell>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Avatar sx={{ width: 34, height: 34, fontSize: 13, bgcolor: "primary.main" }}>
                        {app.fullName.slice(0, 1)}
                      </Avatar>
                      <Typography variant="body2" fontWeight={600}>
                        {app.fullName}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>{app.agencyName}</TableCell>
                  <TableCell sx={{ color: "text.secondary" }} dir="ltr" align="right">
                    {app.phone}
                  </TableCell>
                  <TableCell sx={{ color: "text.secondary" }}>
                    {app.country} / {app.city}
                  </TableCell>
                  <TableCell>
                    <Chip label={STATUS_LABEL[app.status]} color={STATUS_COLOR[app.status]} size="small" />
                  </TableCell>
                  <TableCell align="left">
                    <Button size="small" onClick={() => setSelected(app)}>
                      مراجعة
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        {!isLoading && applications?.length === 0 && <EmptyState message="لا توجد طلبات حتى الآن" />}
      </Paper>

      <Dialog open={!!selected} onClose={() => setSelected(null)} fullWidth maxWidth="sm">
        <DialogTitle>مراجعة طلب: {selected?.agencyName}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          {selected?.idDocumentUrl && (
            <Box>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                صورة الهوية
              </Typography>
              <Box
                component="img"
                src={selected.idDocumentUrl}
                alt="ID document"
                sx={{
                  width: "100%",
                  maxHeight: 320,
                  objectFit: "contain",
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: "divider",
                  bgcolor: "action.hover",
                }}
              />
            </Box>
          )}
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
