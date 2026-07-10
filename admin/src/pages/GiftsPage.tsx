import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import CardGiftcardIcon from "@mui/icons-material/CardGiftcard";
import CasinoIcon from "@mui/icons-material/Casino";
import { apiClient } from "@/api/client";
import { Gift, GiftType } from "@/api/types";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";

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
      <PageHeader
        title="كتالوج الهدايا"
        subtitle="أدر الهدايا الثابتة والمحظوظة المتاحة للمستخدمين"
        action={
          <Button variant="contained" onClick={() => setCreating(true)}>
            + هدية جديدة
          </Button>
        }
      />

      {!isLoading && gifts?.length === 0 && <EmptyState message="لم تُنشئ أي هدايا بعد" />}

      <Grid container spacing={2}>
        {gifts?.map((gift) => (
          <Grid item xs={12} sm={6} md={4} key={gift.id}>
            <Card sx={{ p: 2.5, borderRadius: 3, opacity: gift.isActive ? 1 : 0.55 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: gift.type === "LUCKY" ? "warning.light" : "primary.light",
                    color: "#fff",
                  }}
                >
                  {gift.type === "LUCKY" ? <CasinoIcon /> : <CardGiftcardIcon />}
                </Box>
                <Switch
                  checked={gift.isActive}
                  onChange={(e) => toggleActiveMutation.mutate({ id: gift.id, isActive: e.target.checked })}
                />
              </Stack>
              <Typography variant="subtitle1" fontWeight={700} mb={0.5}>
                {gift.name}
              </Typography>
              <Stack direction="row" spacing={1} mb={1.5}>
                <Chip
                  label={gift.type === "LUCKY" ? "محظوظة" : "ثابتة"}
                  color={gift.type === "LUCKY" ? "warning" : "default"}
                  size="small"
                />
                <Chip label={gift.isActive ? "مفعّلة" : "معطّلة"} color={gift.isActive ? "success" : "error"} size="small" variant="outlined" />
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  السعر
                </Typography>
                <Typography variant="body2" fontWeight={700}>
                  {gift.price} ذهب
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  نسبة الألماس للمستقبل
                </Typography>
                <Typography variant="body2" fontWeight={700}>
                  {gift.diamondShareRate}%
                </Typography>
              </Stack>
            </Card>
          </Grid>
        ))}
      </Grid>

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
