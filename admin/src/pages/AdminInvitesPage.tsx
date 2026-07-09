import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Box,
  Button,
  Chip,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AddLinkIcon from "@mui/icons-material/AddLink";
import { apiClient } from "@/api/client";
import { AdminInvite } from "@/api/types";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";

function inviteStatus(invite: AdminInvite): { label: string; color: "success" | "warning" | "error" | "default" } {
  if (invite.revokedAt) return { label: "ملغى", color: "error" };
  if (invite.usedById) return { label: "مستخدم", color: "success" };
  if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) return { label: "منتهي", color: "default" };
  return { label: "بانتظار الاستخدام", color: "warning" };
}

function inviteLink(token: string): string {
  return `${window.location.origin}/admin-register/${token}`;
}

export function AdminInvitesPage() {
  const queryClient = useQueryClient();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data: invites, isLoading } = useQuery({
    queryKey: ["admin-invites"],
    queryFn: async () => (await apiClient.get<AdminInvite[]>("/admin-invites")).data,
  });

  const createMutation = useMutation({
    mutationFn: async () => apiClient.post<AdminInvite>("/admin-invites", {}),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["admin-invites"] });
      copyLink(res.data);
    },
  });

  const revokeMutation = useMutation({
    mutationFn: async (id: string) => apiClient.delete(`/admin-invites/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-invites"] }),
  });

  function copyLink(invite: AdminInvite) {
    navigator.clipboard.writeText(inviteLink(invite.token)).then(() => {
      setCopiedId(invite.id);
      setTimeout(() => setCopiedId((prev) => (prev === invite.id ? null : prev)), 2000);
    });
  }

  return (
    <Box>
      <PageHeader
        title="دعوات الأدمن"
        subtitle="أنشئ رابط دعوة لمنح شخص صلاحيات أدمن محدودة (مراقبة فقط) عبر لوحة تحكم مخصصة"
        action={
          <Button
            variant="contained"
            startIcon={<AddLinkIcon />}
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending}
          >
            إنشاء رابط دعوة جديد
          </Button>
        }
      />

      {createMutation.isSuccess && (
        <Alert severity="success" sx={{ mb: 2 }}>
          تم إنشاء رابط الدعوة ونسخه إلى الحافظة. أرسله للشخص الذي تريد منحه صلاحية الأدمن.
        </Alert>
      )}

      <Paper sx={{ borderRadius: 3, overflow: "hidden" }}>
        {isLoading && <LinearProgress />}
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>الرابط</TableCell>
                <TableCell>الحالة</TableCell>
                <TableCell>استُخدم بواسطة</TableCell>
                <TableCell>تاريخ الإنشاء</TableCell>
                <TableCell align="left">إجراء</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invites?.map((invite) => {
                const status = inviteStatus(invite);
                return (
                  <TableRow key={invite.id} hover>
                    <TableCell sx={{ maxWidth: 280 }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="body2" sx={{ fontFamily: "monospace" }} noWrap>
                          {inviteLink(invite.token)}
                        </Typography>
                        <Tooltip title={copiedId === invite.id ? "تم النسخ" : "نسخ الرابط"}>
                          <IconButton size="small" onClick={() => copyLink(invite)}>
                            <ContentCopyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip label={status.label} color={status.color} size="small" />
                    </TableCell>
                    <TableCell sx={{ color: "text.secondary" }}>
                      {invite.usedBy ? `${invite.usedBy.fullName} (@${invite.usedBy.username})` : "—"}
                    </TableCell>
                    <TableCell sx={{ color: "text.secondary" }}>
                      {new Date(invite.createdAt).toLocaleString("ar")}
                    </TableCell>
                    <TableCell align="left">
                      {!invite.usedById && !invite.revokedAt && (
                        <Tooltip title="إلغاء الرابط">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => revokeMutation.mutate(invite.id)}
                          >
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
        {!isLoading && invites?.length === 0 && <EmptyState message="لا توجد دعوات بعد" />}
      </Paper>
    </Box>
  );
}
