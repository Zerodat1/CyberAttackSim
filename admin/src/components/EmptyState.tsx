import { Box, Typography } from "@mui/material";
import InboxIcon from "@mui/icons-material/InboxOutlined";

interface Props {
  message: string;
}

export function EmptyState({ message }: Props) {
  return (
    <Box sx={{ textAlign: "center", py: 6, color: "text.secondary" }}>
      <InboxIcon sx={{ fontSize: 40, mb: 1, opacity: 0.5 }} />
      <Typography variant="body2">{message}</Typography>
    </Box>
  );
}
