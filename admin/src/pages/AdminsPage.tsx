import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
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
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";
import { apiClient } from "@/api/client";
import { AdminUser } from "@/api/types";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";

type DialogMode = "email" | "password" | "revoke" | null;

export function AdminsPage() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);

  const [target, setTarget] = useState<AdminUser | null>(null);
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [fieldValue, setFieldValue] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  const { data: admins, isLoading } = useQuery({
    queryKey: ["admins"],
    queryFn: async () => (await apiClient.get<AdminUser[]>("/admin-users/admins")).data,
  });

  const createMutation = useMutation({
    mutationFn: async () => apiClient.post("/admin-users/admins", { email, password, fullName, username }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admins"] });
      setCreateOpen(false);
      setEmail("");
      setPassword("");
      setFullName("");
      setUsername("");
      setCreateError(null);
    },
    onError: (err: any) =>
      setCreateError(err?.response?.data?.message ?? "تعذر إنشاء حساب الأدمن"),
  });

  const updateEmailMutation = useMutation({
    mutationFn: async () => apiClient.patch(`/admin-users/${target?.id}/email`, { email: fieldValue }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admins"] });
      closeDialog();
    },
    onError: (err: any) => setActionError(err?.response?.data?.message ?? "تعذر تغيير البريد الإلكتروني"),
  });

  const updatePasswordMutation = useMutation({
    mutationFn: async () => apiClient.patch(`/admin-users/${target?.id}/password`, { password: fieldValue }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admins"] });
      closeDialog();
    },
    onError: (err: any) => setActionError(err?.response?.data?.message ?? "تعذر تغيير كلمة المرور"),
  });

  const revokeMutation = useMutation({
    mutationFn: async () => apiClient.patch(`/admin-users/${target?.id}/revoke-admin`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admins"] });
      closeDialog();
    },
    onError: (err: any) => setActionError(err?.response?.data?.message ?? "تعذر إلغاء صلاحية الأدمن"),
  });

  function closeDialog() {
    setTarget(null);
    setDialogMode(null);
    setFieldValue("");
    setActionError(null);
  }

  function openDialog(admin: AdminUser, mode: DialogMode) {
    setTarget(admin);
    setDialogMode(mode);
    setFieldValue(mode === "email" ? admin.email ?? "" : "");
    setActionError(null);
  }

  function handleCreateSubmit(e: FormEvent) {
    e.preventDefault();
    createMutation.mutate();
  }

  return (
    <Box>
      <PageHeader
        title="إدارة الأدمن"
        subtitle="أنشئ حساب أدمن مباشرة بتحديد البريد الإلكتروني وكلمة المرور، أو عدّل بيانات أدمن حالي"
        action={
          <Button
            variant="contained"
            startIcon={<PersonAddAlt1Icon />}
            onClick={() => {
              setCreateOpen(true);
              setCreateError(null);
            }}
          >
            إنشاء حساب أدمن
          </Button>
        }
      />

      <Paper sx={{ borderRadius: 3, overflow: "hidden" }}>
        {isLoading && <LinearProgress />}
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>الأدمن</TableCell>
                <TableCell>البريد الإلكتروني</TableCell>
                <TableCell>تاريخ الإنشاء</TableCell>
                <TableCell align="left">إجراء</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {admins?.map((admin) => (
                <TableRow key={admin.id} hover>
                  <TableCell>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Avatar src={admin.avatarUrl ?? undefined} sx={{ width: 34, height: 34, fontSize: 13 }}>
                        {admin.fullName.slice(0, 1)}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {admin.fullName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          @{admin.username}
                        </Typography>
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell sx={{ color: "text.secondary" }}>{admin.email ?? "—"}</TableCell>
                  <TableCell sx={{ color: "text.secondary" }}>
                    {new Date(admin.createdAt).toLocaleString("ar")}
                  </TableCell>
                  <TableCell align="left">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Button size="small" onClick={() => openDialog(admin, "email")}>
                        تغيير البريد
                      </Button>
                      <Button size="small" onClick={() => openDialog(admin, "password")}>
                        تغيير كلمة المرور
                      </Button>
                      <Button size="small" color="error" onClick={() => openDialog(admin, "revoke")}>
                        إلغاء الأدمن
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        {!isLoading && admins?.length === 0 && <EmptyState message="لا يوجد أدمنز حتى الآن" />}
      </Paper>

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} fullWidth maxWidth="xs">
        <form onSubmit={handleCreateSubmit}>
          <DialogTitle>إنشاء حساب أدمن جديد</DialogTitle>
          <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            <TextField
              label="الاسم الكامل"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              fullWidth
            />
            <TextField
              label="اسم المستخدم"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              fullWidth
            />
            <TextField
              label="البريد الإلكتروني"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              fullWidth
            />
            <TextField
              label="كلمة المرور"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              fullWidth
            />
            {createError && <Alert severity="error">{createError}</Alert>}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateOpen(false)}>إلغاء</Button>
            <Button type="submit" variant="contained" disabled={createMutation.isPending}>
              إنشاء
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog open={dialogMode === "email"} onClose={closeDialog} fullWidth maxWidth="xs">
        <DialogTitle>تغيير بريد {target?.fullName}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <TextField
            label="البريد الإلكتروني الجديد"
            type="email"
            value={fieldValue}
            onChange={(e) => setFieldValue(e.target.value)}
            fullWidth
          />
          {actionError && <Alert severity="error">{actionError}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>إلغاء</Button>
          <Button
            variant="contained"
            disabled={!fieldValue || updateEmailMutation.isPending}
            onClick={() => updateEmailMutation.mutate()}
          >
            حفظ
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={dialogMode === "password"} onClose={closeDialog} fullWidth maxWidth="xs">
        <DialogTitle>تغيير كلمة مرور {target?.fullName}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            سيتم تسجيل خروج هذا الأدمن من جميع أجهزته فورًا، وسيحتاج لتسجيل الدخول بكلمة المرور الجديدة.
          </Typography>
          <TextField
            label="كلمة المرور الجديدة"
            type="password"
            value={fieldValue}
            onChange={(e) => setFieldValue(e.target.value)}
            fullWidth
          />
          {actionError && <Alert severity="error">{actionError}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>إلغاء</Button>
          <Button
            variant="contained"
            disabled={!fieldValue || updatePasswordMutation.isPending}
            onClick={() => updatePasswordMutation.mutate()}
          >
            حفظ
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={dialogMode === "revoke"} onClose={closeDialog} fullWidth maxWidth="xs">
        <DialogTitle>إلغاء صلاحية الأدمن عن {target?.fullName}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            سيتحول هذا الحساب إلى مستخدم عادي فورًا، وسيتم تسجيل خروجه من جميع أجهزته.
          </Typography>
          {actionError && <Alert severity="error">{actionError}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>إلغاء</Button>
          <Button variant="contained" color="error" onClick={() => revokeMutation.mutate()}>
            تأكيد الإلغاء
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
