import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Alert, Box, Button, CircularProgress, Paper, Stack, TextField, Typography } from "@mui/material";
import { apiClient } from "@/api/client";
import { AuthUser } from "@/api/types";
import { useAuth } from "@/auth/AuthContext";

type ValidationState = "checking" | "valid" | "invalid";

export function AdminRegisterPage() {
  const { token } = useParams<{ token: string }>();
  const { setSession } = useAuth();
  const navigate = useNavigate();

  const [validation, setValidation] = useState<ValidationState>("checking");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) return;
    apiClient
      .get(`/admin-invites/${token}/validate`)
      .then(() => setValidation("valid"))
      .catch(() => setValidation("invalid"));
  }, [token]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const response = await apiClient.post(`/admin-invites/${token}/register`, {
        fullName,
        username,
        email: email || undefined,
        password,
      });
      const user: AuthUser = response.data.user;
      setSession(response.data.accessToken, user);
      navigate("/admin-dashboard");
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      setError(
        status === 409
          ? "اسم المستخدم أو البريد الإلكتروني مستخدم بالفعل، جرّب بيانات أخرى"
          : "تعذر إنشاء الحساب، حاول مرة أخرى",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #efeeff 0%, #f4f5fb 55%, #eafaf5 100%)",
        p: 2,
      }}
    >
      <Paper
        sx={{
          p: 5,
          width: 440,
          maxWidth: "100%",
          borderRadius: 4,
          boxShadow: "0 20px 60px rgba(91, 76, 245, 0.15)",
        }}
        elevation={0}
      >
        <Stack alignItems="center" spacing={1} mb={4}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: "16px",
              background: "linear-gradient(135deg, #5b4cf5, #7c6cf9)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: 800,
              fontSize: 24,
              mb: 1,
              boxShadow: "0 8px 20px rgba(91, 76, 245, 0.35)",
            }}
          >
            C
          </Box>
          <Typography variant="h5">دعوة أدمن</Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center">
            أنشئ حسابك للحصول على صلاحيات أدمن (مراقبة فقط) في لوحة إدارة Code
          </Typography>
        </Stack>

        {validation === "checking" && (
          <Stack alignItems="center" py={3}>
            <CircularProgress size={28} />
          </Stack>
        )}

        {validation === "invalid" && (
          <Alert severity="error">
            رابط الدعوة غير صالح — قد يكون مستخدمًا من قبل أو منتهي الصلاحية أو ملغى.
          </Alert>
        )}

        {validation === "valid" && (
          <form onSubmit={handleSubmit}>
            <Stack spacing={2.5}>
              <TextField
                fullWidth
                label="الاسم الكامل"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
              <TextField
                fullWidth
                label="اسم المستخدم"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
              <TextField
                fullWidth
                type="email"
                label="البريد الإلكتروني"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <TextField
                fullWidth
                type="password"
                label="كلمة المرور"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {error && <Alert severity="error">{error}</Alert>}
              <Button fullWidth type="submit" variant="contained" size="large" disabled={submitting}>
                إنشاء الحساب والدخول
              </Button>
            </Stack>
          </form>
        )}
      </Paper>
    </Box>
  );
}
