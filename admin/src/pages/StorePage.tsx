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
import { alpha } from "@mui/material/styles";
import { apiClient } from "@/api/client";
import { StoreItem, StoreItemCategory } from "@/api/types";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";

const CATEGORY_LABEL: Record<StoreItemCategory, string> = {
  FRAME: "إطار صورة",
  ENTRANCE: "دخولية",
  BUBBLE: "فقاعة دردشة",
  MIC_EFFECT: "تأثير مايك",
};

interface FormState {
  id: string | null;
  category: StoreItemCategory;
  name: string;
  emoji: string;
  colorHex: string;
  priceGold: string;
  durationDays: string;
}

const EMPTY_FORM: FormState = {
  id: null,
  category: "FRAME",
  name: "",
  emoji: "⭐",
  colorHex: "#7c6cf9",
  priceGold: "",
  durationDays: "",
};

export function StorePage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: items, isLoading } = useQuery({
    queryKey: ["admin-store-items"],
    queryFn: async () => (await apiClient.get<StoreItem[]>("/store-admin/items")).data,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!form) return;
      const payload = {
        category: form.category,
        name: form.name,
        emoji: form.emoji,
        colorHex: form.colorHex,
        priceGold: Number(form.priceGold),
        durationDays: form.durationDays ? Number(form.durationDays) : undefined,
      };
      return form.id
        ? apiClient.patch(`/store-admin/items/${form.id}`, payload)
        : apiClient.post("/store-admin/items", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-store-items"] });
      setForm(null);
      setError(null);
    },
    onError: () => setError("تحقق من صحة البيانات المدخلة"),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiClient.patch(`/store-admin/items/${id}`, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-store-items"] }),
  });

  function openEdit(item: StoreItem) {
    setForm({
      id: item.id,
      category: item.category,
      name: item.name,
      emoji: item.emoji,
      colorHex: item.colorHex,
      priceGold: item.priceGold,
      durationDays: item.durationDays?.toString() ?? "",
    });
  }

  return (
    <Box>
      <PageHeader
        title="متجر المظاهر"
        subtitle="أدر إطارات الصور، الدخوليات، فقاعات الدردشة، وتأثيرات المايك القابلة للشراء بالذهب"
        action={
          <Button variant="contained" onClick={() => setForm(EMPTY_FORM)}>
            + عنصر جديد
          </Button>
        }
      />

      {!isLoading && items?.length === 0 && <EmptyState message="لم تُنشئ أي عناصر متجر بعد" />}

      <Grid container spacing={2}>
        {items?.map((item) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={item.id}>
            <Card
              sx={{ p: 2.5, borderRadius: 3, opacity: item.isActive ? 1 : 0.55, cursor: "pointer" }}
              onClick={() => openEdit(item)}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: alpha(item.colorHex, 0.18),
                    fontSize: 20,
                  }}
                >
                  {item.emoji}
                </Box>
                <Switch
                  checked={item.isActive}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => toggleActiveMutation.mutate({ id: item.id, isActive: e.target.checked })}
                />
              </Stack>
              <Typography variant="subtitle1" fontWeight={700} mb={0.5}>
                {item.name}
              </Typography>
              <Chip label={CATEGORY_LABEL[item.category]} size="small" sx={{ mb: 1.5 }} />
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  السعر
                </Typography>
                <Typography variant="body2" fontWeight={700}>
                  {item.priceGold} ذهب
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  المدة
                </Typography>
                <Typography variant="body2" fontWeight={700}>
                  {item.durationDays ? `${item.durationDays} يوم` : "دائم"}
                </Typography>
              </Stack>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={!!form} onClose={() => setForm(null)} fullWidth maxWidth="sm">
        <DialogTitle>{form?.id ? "تعديل العنصر" : "عنصر متجر جديد"}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <TextField
            select
            label="القسم"
            value={form?.category ?? "FRAME"}
            onChange={(e) => setForm((f) => (f ? { ...f, category: e.target.value as StoreItemCategory } : f))}
          >
            {Object.entries(CATEGORY_LABEL).map(([value, label]) => (
              <MenuItem key={value} value={value}>
                {label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="الاسم"
            value={form?.name ?? ""}
            onChange={(e) => setForm((f) => (f ? { ...f, name: e.target.value } : f))}
          />
          <Stack direction="row" spacing={2}>
            <TextField
              label="الرمز التعبيري (Emoji)"
              value={form?.emoji ?? ""}
              onChange={(e) => setForm((f) => (f ? { ...f, emoji: e.target.value } : f))}
              sx={{ flex: 1 }}
            />
            <TextField
              label="اللون (Hex)"
              value={form?.colorHex ?? ""}
              onChange={(e) => setForm((f) => (f ? { ...f, colorHex: e.target.value } : f))}
              sx={{ flex: 1 }}
            />
          </Stack>
          <Stack direction="row" spacing={2}>
            <TextField
              label="السعر (ذهب)"
              type="number"
              value={form?.priceGold ?? ""}
              onChange={(e) => setForm((f) => (f ? { ...f, priceGold: e.target.value } : f))}
              sx={{ flex: 1 }}
            />
            <TextField
              label="مدة الملكية (أيام، اتركه فارغًا للدوام)"
              type="number"
              value={form?.durationDays ?? ""}
              onChange={(e) => setForm((f) => (f ? { ...f, durationDays: e.target.value } : f))}
              sx={{ flex: 1 }}
            />
          </Stack>
          {error && <Alert severity="error">{error}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setForm(null)}>إلغاء</Button>
          <Button
            variant="contained"
            disabled={!form?.name || !form?.priceGold}
            onClick={() => saveMutation.mutate()}
          >
            حفظ
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
