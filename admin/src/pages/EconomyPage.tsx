import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
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
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { apiClient } from "@/api/client";
import { HostEconomySettings, HostTargetTier, RechargePackage } from "@/api/types";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";

interface PackageForm {
  id?: string;
  priceUsd: string;
  baseGold: string;
  bonusPercent: string;
  sortOrder: string;
}

interface TierForm {
  id?: string;
  thresholdDiamonds: string;
  salaryUsd: string;
  sortOrder: string;
}

const EMPTY_PACKAGE_FORM: PackageForm = { priceUsd: "", baseGold: "", bonusPercent: "0", sortOrder: "0" };
const EMPTY_TIER_FORM: TierForm = { thresholdDiamonds: "", salaryUsd: "", sortOrder: "0" };

export function EconomyPage() {
  const queryClient = useQueryClient();

  // --- Settings ---
  const { data: settings } = useQuery({
    queryKey: ["host-economy-settings"],
    queryFn: async () => (await apiClient.get<HostEconomySettings>("/host-agencies-admin/economy-settings")).data,
  });
  const [settingsForm, setSettingsForm] = useState({
    giftHostShareRate: "",
    agencyBaseRate: "",
    agencyTargetRate: "",
    agencyPremiumRate: "",
    diamondToUsdRate: "",
  });

  useEffect(() => {
    if (settings) {
      setSettingsForm({
        giftHostShareRate: settings.giftHostShareRate,
        agencyBaseRate: settings.agencyBaseRate,
        agencyTargetRate: settings.agencyTargetRate,
        agencyPremiumRate: settings.agencyPremiumRate,
        diamondToUsdRate: settings.diamondToUsdRate,
      });
    }
  }, [settings]);

  const saveSettingsMutation = useMutation({
    mutationFn: async () =>
      apiClient.patch("/host-agencies-admin/economy-settings", {
        giftHostShareRate: Number(settingsForm.giftHostShareRate),
        agencyBaseRate: Number(settingsForm.agencyBaseRate),
        agencyTargetRate: Number(settingsForm.agencyTargetRate),
        agencyPremiumRate: Number(settingsForm.agencyPremiumRate),
        diamondToUsdRate: Number(settingsForm.diamondToUsdRate),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["host-economy-settings"] }),
  });

  // --- Recharge Packages ---
  const { data: packages, isLoading: packagesLoading } = useQuery({
    queryKey: ["admin-recharge-packages"],
    queryFn: async () => (await apiClient.get<RechargePackage[]>("/recharge-agency/admin/packages")).data,
  });
  const [packageForm, setPackageForm] = useState<PackageForm | null>(null);
  const [packageError, setPackageError] = useState<string | null>(null);

  const savePackageMutation = useMutation({
    mutationFn: async () => {
      if (!packageForm) return;
      const payload = {
        priceUsd: Number(packageForm.priceUsd),
        baseGold: Number(packageForm.baseGold),
        bonusPercent: Number(packageForm.bonusPercent),
        sortOrder: Number(packageForm.sortOrder),
      };
      return packageForm.id
        ? apiClient.patch(`/recharge-agency/admin/packages/${packageForm.id}`, payload)
        : apiClient.post("/recharge-agency/admin/packages", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-recharge-packages"] });
      setPackageForm(null);
      setPackageError(null);
    },
    onError: () => setPackageError("تحقق من صحة البيانات المدخلة"),
  });

  const togglePackageActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiClient.patch(`/recharge-agency/admin/packages/${id}`, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-recharge-packages"] }),
  });

  const deletePackageMutation = useMutation({
    mutationFn: async (id: string) => apiClient.delete(`/recharge-agency/admin/packages/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-recharge-packages"] }),
  });

  // --- Host Target Tiers ---
  const { data: tiers, isLoading: tiersLoading } = useQuery({
    queryKey: ["admin-host-target-tiers"],
    queryFn: async () => (await apiClient.get<HostTargetTier[]>("/host-agencies-admin/target-tiers")).data,
  });
  const [tierForm, setTierForm] = useState<TierForm | null>(null);
  const [tierError, setTierError] = useState<string | null>(null);

  const saveTierMutation = useMutation({
    mutationFn: async () => {
      if (!tierForm) return;
      const payload = {
        thresholdDiamonds: Number(tierForm.thresholdDiamonds),
        salaryUsd: Number(tierForm.salaryUsd),
        sortOrder: Number(tierForm.sortOrder),
      };
      return tierForm.id
        ? apiClient.patch(`/host-agencies-admin/target-tiers/${tierForm.id}`, payload)
        : apiClient.post("/host-agencies-admin/target-tiers", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-host-target-tiers"] });
      setTierForm(null);
      setTierError(null);
    },
    onError: () => setTierError("تحقق من صحة البيانات المدخلة"),
  });

  const deleteTierMutation = useMutation({
    mutationFn: async (id: string) => apiClient.delete(`/host-agencies-admin/target-tiers/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-host-target-tiers"] }),
  });

  return (
    <Box>
      <PageHeader
        title="الاقتصاد"
        subtitle="أسعار الشحن والبونصات، نسبة تحويل الهدايا، عمولات الوكالات، وجدول التاركت الشهري للمضيفين"
      />

      <Paper sx={{ p: 3, mb: 4, borderRadius: 3 }}>
        <Typography variant="subtitle1" fontWeight={700} mb={2}>
          إعدادات الاقتصاد العامة
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={6} md={4}>
            <TextField
              fullWidth
              label="نسبة المضيف من الهدية %"
              type="number"
              value={settingsForm.giftHostShareRate}
              onChange={(e) => setSettingsForm((f) => ({ ...f, giftHostShareRate: e.target.value }))}
            />
          </Grid>
          <Grid item xs={6} md={4}>
            <TextField
              fullWidth
              label="عمولة الوكالة الأساسية %"
              type="number"
              value={settingsForm.agencyBaseRate}
              onChange={(e) => setSettingsForm((f) => ({ ...f, agencyBaseRate: e.target.value }))}
            />
          </Grid>
          <Grid item xs={6} md={4}>
            <TextField
              fullWidth
              label="عمولة الوكالة عند تحقيق التارجت %"
              type="number"
              value={settingsForm.agencyTargetRate}
              onChange={(e) => setSettingsForm((f) => ({ ...f, agencyTargetRate: e.target.value }))}
            />
          </Grid>
          <Grid item xs={6} md={4}>
            <TextField
              fullWidth
              label="عمولة الوكالات المميزة %"
              type="number"
              value={settingsForm.agencyPremiumRate}
              onChange={(e) => setSettingsForm((f) => ({ ...f, agencyPremiumRate: e.target.value }))}
            />
          </Grid>
          <Grid item xs={6} md={4}>
            <TextField
              fullWidth
              label="قيمة الألماسة الواحدة بالدولار (عند الفك)"
              type="number"
              value={settingsForm.diamondToUsdRate}
              onChange={(e) => setSettingsForm((f) => ({ ...f, diamondToUsdRate: e.target.value }))}
            />
          </Grid>
        </Grid>
        {saveSettingsMutation.isSuccess && (
          <Alert severity="success" sx={{ mt: 2 }}>
            تم حفظ الإعدادات بنجاح
          </Alert>
        )}
        <Button variant="contained" sx={{ mt: 3 }} onClick={() => saveSettingsMutation.mutate()}>
          حفظ الإعدادات
        </Button>
      </Paper>

      <PageHeader
        title="باقات الشحن"
        subtitle="حدد سعر كل باقة وكمية الذهب الأساسية ونسبة البونص — يظهر البونص تلقائيًا للمستخدم عند الشحن"
        action={
          <Button variant="contained" onClick={() => setPackageForm(EMPTY_PACKAGE_FORM)}>
            + باقة جديدة
          </Button>
        }
      />
      <Paper sx={{ borderRadius: 3, overflow: "hidden", mb: 4 }}>
        {packagesLoading && <LinearProgress />}
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>السعر ($)</TableCell>
                <TableCell>الذهب الأساسي</TableCell>
                <TableCell>البونص %</TableCell>
                <TableCell>إجمالي الذهب</TableCell>
                <TableCell>فعّالة</TableCell>
                <TableCell align="left">إجراء</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {packages?.map((pkg) => (
                <TableRow key={pkg.id} hover>
                  <TableCell>{pkg.priceUsd}$</TableCell>
                  <TableCell>{Number(pkg.baseGold).toLocaleString("en")}</TableCell>
                  <TableCell>{pkg.bonusPercent}%</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "success.main" }}>
                    {Number(pkg.totalGold).toLocaleString("en")}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={pkg.isActive}
                      onChange={(e) => togglePackageActiveMutation.mutate({ id: pkg.id, isActive: e.target.checked })}
                    />
                  </TableCell>
                  <TableCell align="left">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Button
                        size="small"
                        onClick={() =>
                          setPackageForm({
                            id: pkg.id,
                            priceUsd: pkg.priceUsd,
                            baseGold: pkg.baseGold,
                            bonusPercent: pkg.bonusPercent,
                            sortOrder: String(pkg.sortOrder),
                          })
                        }
                      >
                        تعديل
                      </Button>
                      <IconButton size="small" color="error" onClick={() => deletePackageMutation.mutate(pkg.id)}>
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        {!packagesLoading && packages?.length === 0 && <EmptyState message="لا توجد باقات شحن بعد" />}
      </Paper>

      <PageHeader
        title="جدول التاركت الشهري للمضيفين"
        subtitle="كل مستوى يمثل إجمالي ألماس مستلم خلال الشهر مقابل راتب ثابت بالدولار — لا يتأثر بعمليات الفك"
        action={
          <Button variant="contained" onClick={() => setTierForm(EMPTY_TIER_FORM)}>
            + مستوى جديد
          </Button>
        }
      />
      <Paper sx={{ borderRadius: 3, overflow: "hidden" }}>
        {tiersLoading && <LinearProgress />}
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>عتبة الألماس الشهرية</TableCell>
                <TableCell>الراتب ($)</TableCell>
                <TableCell>الترتيب</TableCell>
                <TableCell align="left">إجراء</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tiers?.map((tier) => (
                <TableRow key={tier.id} hover>
                  <TableCell>{Number(tier.thresholdDiamonds).toLocaleString("en")}</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "success.main" }}>{tier.salaryUsd}$</TableCell>
                  <TableCell>{tier.sortOrder}</TableCell>
                  <TableCell align="left">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Button
                        size="small"
                        onClick={() =>
                          setTierForm({
                            id: tier.id,
                            thresholdDiamonds: tier.thresholdDiamonds,
                            salaryUsd: tier.salaryUsd,
                            sortOrder: String(tier.sortOrder),
                          })
                        }
                      >
                        تعديل
                      </Button>
                      <IconButton size="small" color="error" onClick={() => deleteTierMutation.mutate(tier.id)}>
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        {!tiersLoading && tiers?.length === 0 && <EmptyState message="لا توجد مستويات تاركت بعد" />}
      </Paper>

      <Dialog open={!!packageForm} onClose={() => setPackageForm(null)} fullWidth maxWidth="xs">
        <DialogTitle>{packageForm?.id ? "تعديل الباقة" : "باقة شحن جديدة"}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <TextField
            label="السعر ($)"
            type="number"
            value={packageForm?.priceUsd ?? ""}
            onChange={(e) => setPackageForm((f) => (f ? { ...f, priceUsd: e.target.value } : f))}
          />
          <TextField
            label="الذهب الأساسي"
            type="number"
            value={packageForm?.baseGold ?? ""}
            onChange={(e) => setPackageForm((f) => (f ? { ...f, baseGold: e.target.value } : f))}
          />
          <TextField
            label="نسبة البونص %"
            type="number"
            value={packageForm?.bonusPercent ?? ""}
            onChange={(e) => setPackageForm((f) => (f ? { ...f, bonusPercent: e.target.value } : f))}
          />
          <TextField
            label="ترتيب الظهور"
            type="number"
            value={packageForm?.sortOrder ?? ""}
            onChange={(e) => setPackageForm((f) => (f ? { ...f, sortOrder: e.target.value } : f))}
          />
          {packageError && <Alert severity="error">{packageError}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPackageForm(null)}>إلغاء</Button>
          <Button variant="contained" onClick={() => savePackageMutation.mutate()}>
            حفظ
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!tierForm} onClose={() => setTierForm(null)} fullWidth maxWidth="xs">
        <DialogTitle>{tierForm?.id ? "تعديل المستوى" : "مستوى تاركت جديد"}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <TextField
            label="عتبة الألماس الشهرية"
            type="number"
            value={tierForm?.thresholdDiamonds ?? ""}
            onChange={(e) => setTierForm((f) => (f ? { ...f, thresholdDiamonds: e.target.value } : f))}
          />
          <TextField
            label="الراتب ($)"
            type="number"
            value={tierForm?.salaryUsd ?? ""}
            onChange={(e) => setTierForm((f) => (f ? { ...f, salaryUsd: e.target.value } : f))}
          />
          <TextField
            label="الترتيب"
            type="number"
            value={tierForm?.sortOrder ?? ""}
            onChange={(e) => setTierForm((f) => (f ? { ...f, sortOrder: e.target.value } : f))}
          />
          {tierError && <Alert severity="error">{tierError}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTierForm(null)}>إلغاء</Button>
          <Button variant="contained" onClick={() => saveTierMutation.mutate()}>
            حفظ
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
