import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { telnyxMediaUnderstandingProvider } from "./src/media-understanding-provider.js";

export default definePluginEntry({
  id: "telnyx-stt",
  name: "Telnyx Speech-to-Text Provider",
  description: "Media-understanding provider using Telnyx STT for OpenClaw audio transcription.",
  register(api) {
    api.registerMediaUnderstandingProvider(telnyxMediaUnderstandingProvider);
  },
});
