import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Paper,
  Switch,
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
import { Gift, GiftType } from "@/api/types";

const DEFAULT_LUCKY_ODDS = JSON.stringify(
  [
    { multiplier: 0, weight: 50 },
    { multiplier: 1, weight: 30 },
    { multiplier: 5, weight: 15 },
    { multiplier: 50, weight: 5 },
  ],
  null,
  2,
);

export function GiftsPage() {
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [type, setType] = useState<GiftType>("STATIC");
  const [diamondShareRate, setDiamondShareRate] = useState("50");
  const [luckyOdds, setLuckyOdds] = useState(DEFAULT_LUCKY_ODDS);
  const [error, setError] = useState<string | null>(null);

  const { data: gifts, isLoading } = useQuery({
    queryKey: ["admin-gifts"],
    queryFn: async () => (await apiClient.get<Gift[]>("/gifts-admin")).data,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {
        name,
        price: Number(price),
        type,
        diamondShareRate: Number(diamondShareRate),
      };
      if (type === "LUCKY") {
        payload.luckyOdds = JSON.parse(luckyOdds);
      }
      return apiClient.post("/gifts-admin", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-gifts"] });
      setCreating(false);
      setName("");
      setPrice("");
      setError(null);
    },
    onError: () => setError("تحقق من صحة البيانات (خصوصًا صيغة JSON لاحتمالات الهدية المحظوظة)"),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiClient.patch(`/gifts-admin/${id}`, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-gifts"] }),
  });

  return (
    <Box>
      <Typography variant="h5" mb={2}>
        كتالوج الهدايا
      </Typography>
      <TableContainer component={Paper} sx={{ mb: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>الاسم</TableCell>
              <TableCell>السعر (ذهب)</TableCell>
              <TableCell>النوع</TableCell>
              <TableCell>نسبة الألماس للمستقبل %</TableCell>
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
            {gifts?.map((gift) => (
              <TableRow key={gift.id}>
                <TableCell>{gift.name}</TableCell>
                <TableCell>{gift.price}</TableCell>
                <TableCell>
                  <Chip
                    label={gift.type === "LUCKY" ? "محظوظة" : "ثابتة"}
                    color={gift.type === "LUCKY" ? "warning" : "default"}
                    size="small"
                  />
                </TableCell>
                <TableCell>{gift.diamondShareRate}%</TableCell>
                <TableCell>
                  <Chip label={gift.isActive ? "مفعّلة" : "معطّلة"} color={gift.isActive ? "success" : "error"} size="small" />
                </TableCell>
                <TableCell>
                  <Switch
                    checked={gift.isActive}
                    onChange={(e) => toggleActiveMutation.mutate({ id: gift.id, isActive: e.target.checked })}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Button variant="contained" onClick={() => setCreating(true)}>
        + هدية جديدة
      </Button>

      <Dialog open={creating} onClose={() => setCreating(false)} fullWidth maxWidth="sm">
        <DialogTitle>إنشاء هدية جديدة</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <TextField label="اسم الهدية" value={name} onChange={(e) => setName(e.target.value)} />
          <TextField
            label="السعر (بالذهب)"
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
          <TextField select label="النوع" value={type} onChange={(e) => setType(e.target.value as GiftType)}>
            <MenuItem value="STATIC">ثابتة</MenuItem>
            <MenuItem value="LUCKY">محظوظة (رهان)</MenuItem>
          </TextField>
          <TextField
            label="نسبة الألماس للمستقبل %"
            type="number"
            value={diamondShareRate}
            onChange={(e) => setDiamondShareRate(e.target.value)}
          />
          {type === "LUCKY" && (
            <TextField
              label="احتمالات المضاعف (JSON: multiplier/weight)"
              multiline
              minRows={5}
              value={luckyOdds}
              onChange={(e) => setLuckyOdds(e.target.value)}
            />
          )}
          {error && <Alert severity="error">{error}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreating(false)}>إلغاء</Button>
          <Button variant="contained" disabled={!name || !price} onClick={() => createMutation.mutate()}>
            إنشاء
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
