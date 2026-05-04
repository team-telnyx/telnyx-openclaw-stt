import type {
  AudioTranscriptionRequest,
  AudioTranscriptionResult,
} from "openclaw/plugin-sdk/media-understanding";
import {
  assertOkOrThrowHttpError,
  buildAudioTranscriptionFormData,
  postMultipartRequest,
  requireTranscriptionText,
  resolveProviderHttpRequestConfig,
} from "openclaw/plugin-sdk/provider-http";

export const DEFAULT_TELNYX_AUDIO_BASE_URL = "https://api.telnyx.com/v2/ai";
export const DEFAULT_TELNYX_AUDIO_MODEL = "openai/whisper-large-v3-turbo";

type TelnyxTranscriptResponse = {
  text?: string;
};

export function resolveTelnyxAudioModel(model?: string): string {
  const trimmed = model?.trim();
  if (!trimmed) {
    return DEFAULT_TELNYX_AUDIO_MODEL;
  }
  return trimmed.replace(/^telnyx\//i, "") || DEFAULT_TELNYX_AUDIO_MODEL;
}

function resolveFormFields(params: AudioTranscriptionRequest, model: string) {
  const fields: Record<string, string | number | boolean | undefined> = {
    model,
  };

  if (params.language?.trim()) {
    fields.language = params.language.trim();
  }
  if (params.prompt?.trim()) {
    fields.prompt = params.prompt.trim();
  }
  for (const [key, value] of Object.entries(params.query ?? {})) {
    if (value === undefined) {
      continue;
    }
    fields[key] = value;
  }
  return fields;
}

export async function transcribeTelnyxAudio(
  params: AudioTranscriptionRequest,
): Promise<AudioTranscriptionResult> {
  const fetchFn = params.fetchFn ?? fetch;
  const model = resolveTelnyxAudioModel(params.model);
  const { baseUrl, allowPrivateNetwork, headers, dispatcherPolicy } =
    resolveProviderHttpRequestConfig({
      baseUrl: params.baseUrl,
      defaultBaseUrl: DEFAULT_TELNYX_AUDIO_BASE_URL,
      headers: params.headers,
      request: params.request,
      defaultHeaders: {
        authorization: `Bearer ${params.apiKey}`,
      },
      provider: "telnyx",
      capability: "audio",
      transport: "media-understanding",
    });

  const form = buildAudioTranscriptionFormData({
    buffer: params.buffer,
    fileName: params.fileName,
    mime: params.mime,
    fields: resolveFormFields(params, model),
  });

  const { response: res, release } = await postMultipartRequest({
    url: `${baseUrl}/audio/transcriptions`,
    headers,
    body: form,
    timeoutMs: params.timeoutMs,
    fetchFn,
    allowPrivateNetwork,
    dispatcherPolicy,
  });

  try {
    await assertOkOrThrowHttpError(res, "Audio transcription failed");
    const payload = (await res.json()) as TelnyxTranscriptResponse;
    const transcript = requireTranscriptionText(
      payload.text,
      "Audio transcription response missing transcript",
    );
    return { text: transcript, model };
  } finally {
    await release();
  }
}
