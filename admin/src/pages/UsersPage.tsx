import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
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
import SearchIcon from "@mui/icons-material/Search";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import BlockIcon from "@mui/icons-material/Block";
import { apiClient } from "@/api/client";
import { AdminUser, AdminUserList, BannedIp } from "@/api/types";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";

export function UsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [banTarget, setBanTarget] = useState<AdminUser | null>(null);
  const [banReason, setBanReason] = useState("");
  const [ipDialogOpen, setIpDialogOpen] = useState(false);
  const [newIp, setNewIp] = useState("");
  const [newIpReason, setNewIpReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data: userList, isLoading } = useQuery({
    queryKey: ["admin-users", search],
    queryFn: async () =>
      (await apiClient.get<AdminUserList>("/admin-users", { params: { search: search || undefined } })).data,
  });

  const { data: bannedIps, isLoading: ipsLoading } = useQuery({
    queryKey: ["admin-banned-ips"],
    queryFn: async () => (await apiClient.get<BannedIp[]>("/admin-users/banned-ips")).data,
  });

  const banMutation = useMutation({
    mutationFn: async () => apiClient.patch(`/admin-users/${banTarget?.id}/ban`, { reason: banReason || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setBanTarget(null);
      setBanReason("");
      setError(null);
    },
    onError: (err: any) => setError(err?.response?.data?.message ?? "تعذر حظر المستخدم"),
  });

  const unbanMutation = useMutation({
    mutationFn: async (id: string) => apiClient.patch(`/admin-users/${id}/unban`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  const banIpMutation = useMutation({
    mutationFn: async () => apiClient.post("/admin-users/banned-ips", { ipAddress: newIp, reason: newIpReason || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-banned-ips"] });
      setIpDialogOpen(false);
      setNewIp("");
      setNewIpReason("");
      setError(null);
    },
    onError: (err: any) => setError(err?.response?.data?.message ?? "تعذر حظر عنوان IP"),
  });

  const unbanIpMutation = useMutation({
    mutationFn: async (id: string) => apiClient.delete(`/admin-users/banned-ips/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-banned-ips"] }),
  });

  return (
    <Box>
      <PageHeader title="إدارة المستخدمين" subtitle="ابحث عن مستخدم واحظره، أو احظر عنوان IP بالكامل من الوصول للمنصة" />

      <Paper sx={{ p: 2, mb: 3, borderRadius: 3 }}>
        <TextField
          fullWidth
          placeholder="ابحث بالاسم، اسم المستخدم، البريد الإلكتروني، أو رقم الهاتف"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      <Paper sx={{ borderRadius: 3, overflow: "hidden", mb: 4 }}>
        {isLoading && <LinearProgress />}
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>المستخدم</TableCell>
                <TableCell>البريد / الهاتف</TableCell>
                <TableCell>الدور</TableCell>
                <TableCell>الحالة</TableCell>
                <TableCell align="left">إجراء</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {userList?.items.map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Avatar src={user.avatarUrl ?? undefined} sx={{ width: 34, height: 34, fontSize: 13 }}>
                        {user.fullName.slice(0, 1)}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {user.fullName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          @{user.username}
                        </Typography>
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell sx={{ color: "text.secondary" }}>{user.email ?? user.phone ?? "—"}</TableCell>
                  <TableCell>
                    <Chip label={user.globalRole} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    {user.isActive ? (
                      <Chip label="نشط" color="success" size="small" />
                    ) : (
                      <Chip label={user.bannedReason ? `محظور: ${user.bannedReason}` : "محظور"} color="error" size="small" />
                    )}
                  </TableCell>
                  <TableCell align="left">
                    {user.isActive ? (
                      <Button
                        size="small"
                        color="error"
                        startIcon={<BlockIcon fontSize="small" />}
                        onClick={() => {
                          setBanTarget(user);
                          setBanReason("");
                          setError(null);
                        }}
                        disabled={user.globalRole === "OWNER"}
                      >
                        حظر
                      </Button>
                    ) : (
                      <Button size="small" onClick={() => unbanMutation.mutate(user.id)}>
                        إلغاء الحظر
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        {!isLoading && userList?.items.length === 0 && <EmptyState message="لا يوجد مستخدمون مطابقون" />}
      </Paper>

      <PageHeader
        title="عناوين IP المحظورة"
        subtitle="أي طلب قادم من عنوان IP محظور سيُرفض تلقائيًا قبل الوصول لأي جزء من المنصة"
        action={
          <Button
            variant="contained"
            onClick={() => {
              setIpDialogOpen(true);
              setError(null);
            }}
          >
            + حظر عنوان IP
          </Button>
        }
      />

      <Paper sx={{ borderRadius: 3, overflow: "hidden" }}>
        {ipsLoading && <LinearProgress />}
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>عنوان IP</TableCell>
                <TableCell>السبب</TableCell>
                <TableCell>حُظر بواسطة</TableCell>
                <TableCell align="left">إجراء</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {bannedIps?.map((entry) => (
                <TableRow key={entry.id} hover>
                  <TableCell sx={{ fontFamily: "monospace" }}>{entry.ipAddress}</TableCell>
                  <TableCell sx={{ color: "text.secondary" }}>{entry.reason ?? "—"}</TableCell>
                  <TableCell sx={{ color: "text.secondary" }}>{entry.bannedBy?.username ?? "—"}</TableCell>
                  <TableCell align="left">
                    <IconButton size="small" color="error" onClick={() => unbanIpMutation.mutate(entry.id)}>
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        {!ipsLoading && bannedIps?.length === 0 && <EmptyState message="لا توجد عناوين IP محظورة حاليًا" />}
      </Paper>

      <Dialog open={!!banTarget} onClose={() => setBanTarget(null)} fullWidth maxWidth="xs">
        <DialogTitle>حظر {banTarget?.fullName}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            سيتم تسجيل خروج المستخدم من جميع أجهزته فورًا ومنعه من تسجيل الدخول مجددًا حتى يتم إلغاء الحظر.
          </Typography>
          <TextField
            label="سبب الحظر (اختياري)"
            multiline
            minRows={2}
            value={banReason}
            onChange={(e) => setBanReason(e.target.value)}
          />
          {error && <Alert severity="error">{error}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBanTarget(null)}>إلغاء</Button>
          <Button variant="contained" color="error" onClick={() => banMutation.mutate()}>
            تأكيد الحظر
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={ipDialogOpen} onClose={() => setIpDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>حظر عنوان IP</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <TextField
            label="عنوان IP"
            placeholder="مثال: 203.0.113.42"
            value={newIp}
            onChange={(e) => setNewIp(e.target.value)}
          />
          <TextField
            label="سبب الحظر (اختياري)"
            multiline
            minRows={2}
            value={newIpReason}
            onChange={(e) => setNewIpReason(e.target.value)}
          />
          {error && <Alert severity="error">{error}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIpDialogOpen(false)}>إلغاء</Button>
          <Button variant="contained" disabled={!newIp} onClick={() => banIpMutation.mutate()}>
            حظر
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
