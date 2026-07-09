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
import { RoomSummary } from "@/api/types";

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
      <Typography variant="h5" mb={2}>
        الغرف الصوتية
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>اسم الغرفة</TableCell>
              <TableCell>المالك</TableCell>
              <TableCell>عدد الأعضاء</TableCell>
              <TableCell>المقاعد</TableCell>
              <TableCell>الحماية</TableCell>
              <TableCell>إجراء</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={6}>جارٍ التحميل...</TableCell>
              </TableRow>
            )}
            {rooms?.map((room) => (
              <TableRow key={room.id}>
                <TableCell>{room.name}</TableCell>
                <TableCell>{room.owner.fullName}</TableCell>
                <TableCell>{room._count.members}</TableCell>
                <TableCell>{room.seatCount}</TableCell>
                <TableCell>
                  {room.isPasswordProtected ? (
                    <Chip label="محمية بكلمة مرور" size="small" color="warning" />
                  ) : (
                    <Chip label="عامة" size="small" />
                  )}
                </TableCell>
                <TableCell>
                  <Button size="small" color="error" onClick={() => deleteMutation.mutate(room.id)}>
                    حذف الغرفة
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
