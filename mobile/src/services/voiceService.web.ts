/**
 * Web build of the voice service. Agora's RTC SDK is native-only, and the
 * native module is never imported here so the web bundler doesn't try to
 * pull in react-native-agora's iOS/Android bridge code. Voice transport is
 * simply unavailable on web; every export below is an inert no-op so
 * RoomScreen behaves identically minus real audio.
 */

export async function joinVoiceChannel(_roomId: string, _canPublish: boolean): Promise<void> {}

export async function leaveVoiceChannel(): Promise<void> {}

export async function setVoiceMuted(_muted: boolean): Promise<void> {}
