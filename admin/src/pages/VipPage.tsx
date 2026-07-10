import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Box,
  Button,
  Card,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { apiClient } from "@/api/client";
import { VipLevel } from "@/api/types";
import { PageHeader } from "@/components/PageHeader";

interface FormState {
  level: number;
  name: string;
  priceGold: string;
  durationDays: string;
  badgeColor: string;
  frameColorHex: string;
  frameEmoji: string;
  entranceText: string;
  entranceColorHex: string;
}

export function VipPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: levels, isLoading } = useQuery({
    queryKey: ["admin-vip-levels"],
    queryFn: async () => (await apiClient.get<VipLevel[]>("/vip-admin/levels")).data,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!form) return;
      return apiClient.patch(`/vip-admin/levels/${form.level}`, {
        name: form.name,
        priceGold: Number(form.priceGold),
        durationDays: Number(form.durationDays),
        badgeColor: form.badgeColor,
        frameColorHex: form.frameColorHex,
        frameEmoji: form.frameEmoji,
        entranceText: form.entranceText,
        entranceColorHex: form.entranceColorHex,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-vip-levels"] });
      setForm(null);
      setError(null);
    },
    onError: () => setError("تحقق من صحة البيانات المدخلة"),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ level, isActive }: { level: number; isActive: boolean }) =>
      apiClient.patch(`/vip-admin/levels/${level}`, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-vip-levels"] }),
  });

  function openEdit(level: VipLevel) {
    setForm({
      level: level.level,
      name: level.name,
      priceGold: level.priceGold,
      durationDays: level.durationDays.toString(),
      badgeColor: level.badgeColor,
      frameColorHex: level.frameColorHex,
      frameEmoji: level.frameEmoji,
      entranceText: level.entranceText,
      entranceColorHex: level.entranceColorHex,
    });
  }

  return (
    <Box>
      <PageHeader
        title="مستويات VIP"
        subtitle="تحكم بأسعار ومدد ومزايا مستويات VIP من 1 إلى 7 (شارة، إطار حصري، دخولية حصرية)"
      />

      <Grid container spacing={2}>
        {!isLoading &&
          levels?.map((level) => (
            <Grid item xs={12} sm={6} md={4} key={level.level}>
              <Card
                sx={{ p: 2.5, borderRadius: 3, opacity: level.isActive ? 1 : 0.55, cursor: "pointer" }}
                onClick={() => openEdit(level)}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: alpha(level.badgeColor, 0.18),
                      fontSize: 22,
                    }}
                  >
                    {level.frameEmoji}
                  </Box>
                  <Switch
                    checked={level.isActive}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => toggleActiveMutation.mutate({ level: level.level, isActive: e.target.checked })}
                  />
                </Stack>
                <Typography variant="subtitle1" fontWeight={700} mb={1} sx={{ color: level.badgeColor }}>
                  {level.name}
                </Typography>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    السعر
                  </Typography>
                  <Typography variant="body2" fontWeight={700}>
                    {level.priceGold} ذهب
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    المدة
                  </Typography>
                  <Typography variant="body2" fontWeight={700}>
                    {level.durationDays} يوم
                  </Typography>
                </Stack>
                <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                  دخولية: {level.entranceText}
                </Typography>
              </Card>
            </Grid>
          ))}
      </Grid>

      <Dialog open={!!form} onClose={() => setForm(null)} fullWidth maxWidth="sm">
        <DialogTitle>تعديل {form?.name}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <TextField label="الاسم" value={form?.name ?? ""} onChange={(e) => setForm((f) => (f ? { ...f, name: e.target.value } : f))} />
          <Stack direction="row" spacing={2}>
            <TextField
              label="السعر (ذهب)"
              type="number"
              value={form?.priceGold ?? ""}
              onChange={(e) => setForm((f) => (f ? { ...f, priceGold: e.target.value } : f))}
              sx={{ flex: 1 }}
            />
            <TextField
              label="المدة (أيام)"
              type="number"
              value={form?.durationDays ?? ""}
              onChange={(e) => setForm((f) => (f ? { ...f, durationDays: e.target.value } : f))}
              sx={{ flex: 1 }}
            />
          </Stack>
          <Stack direction="row" spacing={2}>
            <TextField
              label="لون الشارة (Hex)"
              value={form?.badgeColor ?? ""}
              onChange={(e) => setForm((f) => (f ? { ...f, badgeColor: e.target.value } : f))}
              sx={{ flex: 1 }}
            />
            <TextField
              label="لون الإطار (Hex)"
              value={form?.frameColorHex ?? ""}
              onChange={(e) => setForm((f) => (f ? { ...f, frameColorHex: e.target.value } : f))}
              sx={{ flex: 1 }}
            />
            <TextField
              label="رمز الإطار (Emoji)"
              value={form?.frameEmoji ?? ""}
              onChange={(e) => setForm((f) => (f ? { ...f, frameEmoji: e.target.value } : f))}
              sx={{ flex: 1 }}
            />
          </Stack>
          <TextField
            label="نص الدخولية"
            value={form?.entranceText ?? ""}
            onChange={(e) => setForm((f) => (f ? { ...f, entranceText: e.target.value } : f))}
          />
          <TextField
            label="لون الدخولية (Hex)"
            value={form?.entranceColorHex ?? ""}
            onChange={(e) => setForm((f) => (f ? { ...f, entranceColorHex: e.target.value } : f))}
          />
          {error && <Alert severity="error">{error}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setForm(null)}>إلغاء</Button>
          <Button variant="contained" onClick={() => saveMutation.mutate()}>
            حفظ
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
