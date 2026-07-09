import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, Box, Button, Card, Grid, Stack, TextField, Typography } from "@mui/material";
import CasinoIcon from "@mui/icons-material/Casino";
import DonutLargeIcon from "@mui/icons-material/DonutLarge";
import ViewModuleIcon from "@mui/icons-material/ViewModule";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import { apiClient } from "@/api/client";
import { GameSettings } from "@/api/types";
import { PageHeader } from "@/components/PageHeader";

type GameKey = "dice" | "wheel" | "slots" | "crash";

const GAMES: { gameType: GameKey; label: string; icon: ReactNode; color: string; description: string }[] = [
  {
    gameType: "dice",
    label: "تخمين الرقم",
    icon: <CasinoIcon />,
    color: "#5b4cf5",
    description: "اللاعب يخمّن رقمًا من 0 إلى 9، والفوز يمنحه مضاعف الفوز الثابت",
  },
  {
    gameType: "wheel",
    label: "عجلة الحظ",
    icon: <DonutLargeIcon />,
    color: "#f5a623",
    description: 'إعدادات القطاعات (segments) بصيغة JSON: [{ "label": "x2", "multiplier": 2, "weight": 15 }, ...]',
  },
  {
    gameType: "slots",
    label: "ماكينة الحظ",
    icon: <ViewModuleIcon />,
    color: "#e0507a",
    description: 'إعدادات فئات الفوز (tiers) بصيغة JSON: [{ "label": "🍋 🍋 🍋", "multiplier": 1, "weight": 25 }, ...]',
  },
  {
    gameType: "crash",
    label: "الصاروخ",
    icon: <RocketLaunchIcon />,
    color: "#00b894",
    description: 'إعدادات هامش الربح والمضاعف الأقصى بصيغة JSON: { "houseEdge": 0.03, "maxMultiplier": 50 }',
  },
];

export function GamesPage() {
  return (
    <Box>
      <PageHeader title="ألعاب الرهان" subtitle="اضبط حدود الرهان واحتمالات الفوز لكل لعبة رهان في التطبيق" />
      <Grid container spacing={3}>
        {GAMES.map((game) => (
          <Grid item xs={12} md={6} key={game.gameType}>
            <GameSettingsCard {...game} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

function GameSettingsCard(
  game: { gameType: GameKey; label: string; icon: ReactNode; color: string; description: string },
) {
  const queryClient = useQueryClient();
  const { gameType } = game;

  const { data: settings, isLoading } = useQuery({
    queryKey: ["game-settings", gameType],
    queryFn: async () => (await apiClient.get<GameSettings>(`/games/${gameType}/settings`)).data,
  });

  const [minBet, setMinBet] = useState("");
  const [maxBet, setMaxBet] = useState("");
  const [dailyBetLimit, setDailyBetLimit] = useState("");
  const [winMultiplier, setWinMultiplier] = useState("");
  const [configJson, setConfigJson] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (settings) {
      setMinBet(settings.minBet);
      setMaxBet(settings.maxBet);
      setDailyBetLimit(settings.dailyBetLimit);
      setWinMultiplier(settings.winMultiplier);
      setConfigJson(JSON.stringify(settings.config ?? {}, null, 2));
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {
        minBet: Number(minBet),
        maxBet: Number(maxBet),
        dailyBetLimit: Number(dailyBetLimit),
      };
      if (gameType === "dice") {
        payload.winMultiplier = Number(winMultiplier);
      } else {
        payload.config = JSON.parse(configJson);
      }
      return apiClient.patch(`/games/${gameType}/settings`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["game-settings", gameType] });
      setError(null);
    },
    onError: () => setError("تحقق من صحة البيانات (خصوصًا صيغة JSON إن وُجدت)"),
  });

  return (
    <Card sx={{ p: 3, borderRadius: 3, height: "100%" }}>
      <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: game.color,
            color: "#fff",
          }}
        >
          {game.icon}
        </Box>
        <Box>
          <Typography variant="subtitle1" fontWeight={700}>
            {game.label}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {isLoading ? "جارِ التحميل..." : "متصل بالإعدادات الحية"}
          </Typography>
        </Box>
      </Stack>

      <Grid container spacing={2} mb={2}>
        <Grid item xs={4}>
          <TextField fullWidth size="small" label="أدنى رهان" type="number" value={minBet} onChange={(e) => setMinBet(e.target.value)} />
        </Grid>
        <Grid item xs={4}>
          <TextField fullWidth size="small" label="أقصى رهان" type="number" value={maxBet} onChange={(e) => setMaxBet(e.target.value)} />
        </Grid>
        <Grid item xs={4}>
          <TextField
            fullWidth
            size="small"
            label="الحد اليومي"
            type="number"
            value={dailyBetLimit}
            onChange={(e) => setDailyBetLimit(e.target.value)}
          />
        </Grid>
      </Grid>

      {gameType === "dice" ? (
        <TextField
          fullWidth
          size="small"
          label="مضاعف الفوز"
          type="number"
          value={winMultiplier}
          onChange={(e) => setWinMultiplier(e.target.value)}
          sx={{ mb: 2 }}
        />
      ) : (
        <TextField
          fullWidth
          multiline
          minRows={5}
          size="small"
          label={game.description}
          value={configJson}
          onChange={(e) => setConfigJson(e.target.value)}
          inputProps={{ dir: "ltr" }}
          sx={{ mb: 2, "& textarea": { fontFamily: "monospace", fontSize: 12, textAlign: "left" } }}
        />
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {saveMutation.isSuccess && !error && (
        <Alert severity="success" sx={{ mb: 2 }}>
          تم حفظ إعدادات {game.label}
        </Alert>
      )}

      <Button variant="contained" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
        حفظ إعدادات {game.label}
      </Button>
    </Card>
  );
}
