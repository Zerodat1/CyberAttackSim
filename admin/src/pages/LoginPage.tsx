import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Box, Button, Paper, TextField, Typography } from "@mui/material";
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
        bgcolor: "#f4f5fb",
      }}
    >
      <Paper sx={{ p: 4, width: 380 }} elevation={3}>
        <Typography variant="h5" mb={3} textAlign="center">
          تسجيل الدخول — لوحة إدارة Code
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="البريد الإلكتروني أو اسم المستخدم"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            type="password"
            label="كلمة المرور"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin="normal"
            required
          />
          {error && (
            <Alert severity="error" sx={{ mt: 1 }}>
              {error}
            </Alert>
          )}
          <Button fullWidth type="submit" variant="contained" sx={{ mt: 3 }} disabled={submitting}>
            دخول
          </Button>
        </form>
      </Paper>
    </Box>
  );
}
