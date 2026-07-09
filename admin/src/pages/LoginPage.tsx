import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Box, Button, Paper, Stack, TextField, Typography } from "@mui/material";
import { useAuth } from "@/auth/AuthContext";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login(identifier, password);
      navigate("/applications");
    } catch {
      setError("بيانات الدخول غير صحيحة");
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
          width: 420,
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
          <Typography variant="h5">لوحة إدارة Code</Typography>
          <Typography variant="body2" color="text.secondary">
            سجّل الدخول لإدارة وكالات الشحن والغرف والهدايا
          </Typography>
        </Stack>
        <form onSubmit={handleSubmit}>
          <Stack spacing={2.5}>
            <TextField
              fullWidth
              label="البريد الإلكتروني أو اسم المستخدم"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
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
              دخول
            </Button>
          </Stack>
        </form>
      </Paper>
    </Box>
  );
}
