import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, Box, Button, Grid, Paper, TextField, Typography } from "@mui/material";
import { apiClient } from "@/api/client";
import { CommissionSettings } from "@/api/types";

export function SettingsPage() {
  const queryClient = useQueryClient();
  const { data: settings } = useQuery({
    queryKey: ["commission-settings"],
    queryFn: async () => (await apiClient.get<CommissionSettings>("/recharge-agency/admin/settings")).data,
  });

  const [form, setForm] = useState({
    agentCommissionRate: "",
    agencyCommissionRate: "",
    dailyChargeLimit: "",
    dailyWithdrawLimit: "",
    largeTransactionAlert: "",
    goldPerCurrencyUnit: "",
  });

  useEffect(() => {
    if (settings) {
      setForm({
        agentCommissionRate: settings.agentCommissionRate,
        agencyCommissionRate: settings.agencyCommissionRate,
        dailyChargeLimit: settings.dailyChargeLimit,
        dailyWithdrawLimit: settings.dailyWithdrawLimit,
        largeTransactionAlert: settings.largeTransactionAlert,
        goldPerCurrencyUnit: settings.goldPerCurrencyUnit,
      });
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async () =>
      apiClient.patch("/recharge-agency/admin/settings", {
        agentCommissionRate: Number(form.agentCommissionRate),
        agencyCommissionRate: Number(form.agencyCommissionRate),
        dailyChargeLimit: Number(form.dailyChargeLimit),
        dailyWithdrawLimit: Number(form.dailyWithdrawLimit),
        largeTransactionAlert: Number(form.largeTransactionAlert),
        goldPerCurrencyUnit: Number(form.goldPerCurrencyUnit),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["commission-settings"] }),
  });

  function setField(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <Box>
      <Typography variant="h5" mb={2}>
        إعدادات العمولات والحدود
      </Typography>
      <Paper sx={{ p: 3, maxWidth: 600 }}>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <TextField
              fullWidth
              label="عمولة الوكيل %"
              type="number"
              value={form.agentCommissionRate}
              onChange={(e) => setField("agentCommissionRate", e.target.value)}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              label="عمولة الوكالة الرئيسية %"
              type="number"
              value={form.agencyCommissionRate}
              onChange={(e) => setField("agencyCommissionRate", e.target.value)}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              label="حد الشحن اليومي"
              type="number"
              value={form.dailyChargeLimit}
              onChange={(e) => setField("dailyChargeLimit", e.target.value)}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              label="حد السحب اليومي"
              type="number"
              value={form.dailyWithdrawLimit}
              onChange={(e) => setField("dailyWithdrawLimit", e.target.value)}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              label="حد تنبيه العمليات الكبيرة"
              type="number"
              value={form.largeTransactionAlert}
              onChange={(e) => setField("largeTransactionAlert", e.target.value)}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              label="كمية الذهب لكل وحدة عملة عند الشحن"
              type="number"
              value={form.goldPerCurrencyUnit}
              onChange={(e) => setField("goldPerCurrencyUnit", e.target.value)}
            />
          </Grid>
        </Grid>
        {saveMutation.isSuccess && (
          <Alert severity="success" sx={{ mt: 2 }}>
            تم حفظ الإعدادات بنجاح
          </Alert>
        )}
        <Button variant="contained" sx={{ mt: 3 }} onClick={() => saveMutation.mutate()}>
          حفظ التغييرات
        </Button>
      </Paper>
    </Box>
  );
}
