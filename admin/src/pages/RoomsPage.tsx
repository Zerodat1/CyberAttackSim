import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Button,
  Chip,
  LinearProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import MicIcon from "@mui/icons-material/Mic";
import LockIcon from "@mui/icons-material/Lock";
import { apiClient } from "@/api/client";
import { RoomSummary } from "@/api/types";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";

export function RoomsPage() {
  const queryClient = useQueryClient();

  const { data: rooms, isLoading } = useQuery({
    queryKey: ["admin-rooms"],
    queryFn: async () => (await apiClient.get<RoomSummary[]>("/rooms")).data,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => apiClient.delete(`/rooms-admin/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-rooms"] }),
  });

  return (
    <Box>
      <PageHeader title="الغرف الصوتية" subtitle="راقب الغرف النشطة واحذف أي غرفة مخالفة" />
      <Paper sx={{ borderRadius: 3, overflow: "hidden" }}>
        {isLoading && <LinearProgress />}
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>الغرفة</TableCell>
                <TableCell>المالك</TableCell>
                <TableCell>عدد الأعضاء</TableCell>
                <TableCell>المقاعد</TableCell>
                <TableCell>الحماية</TableCell>
                <TableCell align="left">إجراء</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rooms?.map((room) => (
                <TableRow key={room.id} hover>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <MicIcon fontSize="small" color="primary" />
                      <Typography variant="body2" fontWeight={600}>
                        {room.name}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell sx={{ color: "text.secondary" }}>{room.owner.fullName}</TableCell>
                  <TableCell>{room._count.members}</TableCell>
                  <TableCell>{room.seatCount}</TableCell>
                  <TableCell>
                    {room.isPasswordProtected ? (
                      <Chip icon={<LockIcon />} label="محمية" size="small" color="warning" />
                    ) : (
                      <Chip label="عامة" size="small" />
                    )}
                  </TableCell>
                  <TableCell align="left">
                    <Button size="small" color="error" onClick={() => deleteMutation.mutate(room.id)}>
                      حذف الغرفة
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        {!isLoading && rooms?.length === 0 && <EmptyState message="لا توجد غرف نشطة حاليًا" />}
      </Paper>
    </Box>
  );
}
