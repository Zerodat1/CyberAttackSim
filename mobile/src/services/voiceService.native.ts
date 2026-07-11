import { apiClient } from "@/api/client";

/**
 * Thin wrapper around the Agora RTC SDK for in-room voice chat (iOS/Android).
 *
 * HARD LIMITATION: react-native-agora ships native code and only links inside
 * a custom dev client built via `expo prebuild` + EAS Build (or a bare
 * workflow) — it cannot run inside Expo Go. When the native module isn't
 * linked (e.g. Expo Go), every method below no-ops after logging a single
 * warning, so the rest of the app (seat management, chat, gifts, games)
 * keeps working exactly as it does today — voice transport is the only
 * thing that's inert. The web build never even imports this file — see
 * voiceService.web.ts.
 */

type ClientRole = "publisher" | "audience";

interface VoiceEngine {
  joinChannel(token: string, channelName: string, userAccount: string, role: ClientRole): Promise<void>;
  leaveChannel(): Promise<void>;
  setMuted(muted: boolean): Promise<void>;
}

let warnedUnavailable = false;

function warnOnce() {
  if (warnedUnavailable) return;
  warnedUnavailable = true;
  console.warn(
    "[voiceService] react-native-agora native module is not available in this runtime " +
      "(Expo Go / web preview). Voice transport is disabled; run `expo prebuild` and a " +
      "custom dev client build to enable real audio.",
  );
}

function loadNativeEngine(): VoiceEngine | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Agora = require("react-native-agora");
    const engine = Agora.createAgoraRtcEngine();
    engine.initialize({ appId: process.env.EXPO_PUBLIC_AGORA_APP_ID ?? "" });
    engine.enableAudio();

    return {
      async joinChannel(token, channelName, userAccount, role) {
        engine.setClientRole(
          role === "publisher" ? Agora.ClientRoleType.ClientRoleBroadcaster : Agora.ClientRoleType.ClientRoleAudience,
        );
        // Matches the backend's RtcTokenBuilder.buildTokenWithUserAccount, which mints
        // tokens for string user accounts rather than numeric UIDs.
        engine.joinChannelWithUserAccount(token, channelName, userAccount, {});
      },
      async leaveChannel() {
        engine.leaveChannel();
      },
      async setMuted(muted: boolean) {
        engine.muteLocalAudioStream(muted);
      },
    };
  } catch {
    return null;
  }
}

let engine: VoiceEngine | null | undefined;

function getEngine(): VoiceEngine | null {
  if (engine === undefined) {
    engine = loadNativeEngine();
    if (!engine) warnOnce();
  }
  return engine;
}

let currentChannel: string | null = null;

/** Fetches a fresh Agora RTC token from the backend and joins the room's voice channel. */
export async function joinVoiceChannel(roomId: string, canPublish: boolean): Promise<void> {
  const active = getEngine();
  if (!active) return;

  try {
    const { data } = await apiClient.get<{ token: string; appId: string; channelName: string; uid: string }>(
      `/rooms/${roomId}/agora-token`,
    );
    await active.joinChannel(data.token, data.channelName, data.uid, canPublish ? "publisher" : "audience");
    currentChannel = data.channelName;
  } catch {
    // Agora not configured on the backend (503) or network error — voice stays inert.
  }
}

export async function leaveVoiceChannel(): Promise<void> {
  const active = getEngine();
  if (!active || !currentChannel) return;
  try {
    await active.leaveChannel();
  } finally {
    currentChannel = null;
  }
}

export async function setVoiceMuted(muted: boolean): Promise<void> {
  const active = getEngine();
  if (!active) return;
  await active.setMuted(muted);
}
