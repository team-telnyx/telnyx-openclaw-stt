import type { MediaUnderstandingProvider } from "openclaw/plugin-sdk/media-understanding";
import { DEFAULT_TELNYX_AUDIO_MODEL, transcribeTelnyxAudio } from "./audio.js";

export const telnyxMediaUnderstandingProvider: MediaUnderstandingProvider = {
  id: "telnyx",
  capabilities: ["audio"],
  defaultModels: { audio: DEFAULT_TELNYX_AUDIO_MODEL },
  autoPriority: { audio: 25 },
  transcribeAudio: transcribeTelnyxAudio,
};
