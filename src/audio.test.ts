import { describe, expect, it } from "vitest";
import {
  DEFAULT_TELNYX_AUDIO_MODEL,
  resolveTelnyxAudioModel,
  transcribeTelnyxAudio,
} from "./audio.js";

function withFetchPreconnect<T extends typeof fetch>(fn: T) {
  return Object.assign(fn, {
    preconnect: (_url: string | URL) => {},
    __openclawAcceptsDispatcher: true as const,
  });
}

function resolveRequestUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") {
    return input;
  }
  if (input instanceof URL) {
    return input.toString();
  }
  return input.url;
}

function createAuthCaptureJsonFetch(responseBody: unknown) {
  let seenAuth: string | null = null;
  const fetchFn = withFetchPreconnect(async (_input: RequestInfo | URL, init?: RequestInit) => {
    const headers = new Headers(init?.headers);
    seenAuth = headers.get("authorization");
    return new Response(JSON.stringify(responseBody), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  });
  return {
    fetchFn,
    getAuthHeader: () => seenAuth,
  };
}

function createRequestCaptureJsonFetch(responseBody: unknown) {
  let seenUrl: string | null = null;
  let seenInit: RequestInit | undefined;
  const fetchFn = withFetchPreconnect(async (input: RequestInfo | URL, init?: RequestInit) => {
    seenUrl = resolveRequestUrl(input);
    seenInit = init;
    return new Response(JSON.stringify(responseBody), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  });
  return {
    fetchFn,
    getRequest: () => ({ url: seenUrl, init: seenInit }),
  };
}

describe("resolveTelnyxAudioModel", () => {
  it("falls back to the default model when empty", () => {
    expect(resolveTelnyxAudioModel("")).toBe(DEFAULT_TELNYX_AUDIO_MODEL);
    expect(resolveTelnyxAudioModel("  ")).toBe(DEFAULT_TELNYX_AUDIO_MODEL);
    expect(resolveTelnyxAudioModel(undefined)).toBe(DEFAULT_TELNYX_AUDIO_MODEL);
  });

  it("strips the telnyx/ prefix when present", () => {
    expect(resolveTelnyxAudioModel("telnyx/openai/whisper-large-v3-turbo")).toBe(
      "openai/whisper-large-v3-turbo",
    );
  });
});

describe("transcribeTelnyxAudio", () => {
  it("respects lowercase authorization header overrides", async () => {
    const { fetchFn, getAuthHeader } = createAuthCaptureJsonFetch({ text: "ok" });

    const result = await transcribeTelnyxAudio({
      buffer: Buffer.from("audio"),
      fileName: "note.mp3",
      apiKey: "test-key",
      timeoutMs: 1000,
      headers: { authorization: "Bearer override" },
      fetchFn,
    });

    expect(getAuthHeader()).toBe("Bearer override");
    expect(result.text).toBe("ok");
  });

  it("builds the expected multipart request payload", async () => {
    const { fetchFn, getRequest } = createRequestCaptureJsonFetch({ text: "hello" });

    const result = await transcribeTelnyxAudio({
      buffer: Buffer.from("audio-bytes"),
      fileName: "voice.aac",
      apiKey: "test-key",
      timeoutMs: 1234,
      baseUrl: "https://example.com/v2/ai/",
      model: " telnyx/openai/whisper-large-v3-turbo ",
      language: " en ",
      mime: "audio/aac",
      headers: { "X-Custom": "1" },
      prompt: " expect OpenClaw names ",
      query: {
        temperature: 0,
        timestamps: true,
      },
      fetchFn,
    });
    const { url: seenUrl, init: seenInit } = getRequest();

    expect(result.model).toBe("openai/whisper-large-v3-turbo");
    expect(result.text).toBe("hello");
    expect(seenUrl).toBe("https://example.com/v2/ai/audio/transcriptions");
    expect(seenInit?.method).toBe("POST");
    expect(seenInit?.signal).toBeInstanceOf(AbortSignal);

    const headers = new Headers(seenInit?.headers);
    expect(headers.get("authorization")).toBe("Bearer test-key");
    expect(headers.get("x-custom")).toBe("1");

    const form = seenInit?.body as FormData;
    expect(form).toBeInstanceOf(FormData);
    expect(form.get("model")).toBe("openai/whisper-large-v3-turbo");
    expect(form.get("language")).toBe("en");
    expect(form.get("prompt")).toBe("expect OpenClaw names");
    expect(form.get("temperature")).toBe("0");
    expect(form.get("timestamps")).toBe("true");
    const file = form.get("file");
    expect(file).toBeInstanceOf(File);
    expect((file as File).name).toBe("voice.m4a");
  });

  it("throws when the provider returns an error status", async () => {
    const fetchFn = withFetchPreconnect(async () =>
      new Response(JSON.stringify({ error: "bad request" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      }),
    );

    await expect(
      transcribeTelnyxAudio({
        buffer: Buffer.from("audio-bytes"),
        fileName: "voice.wav",
        apiKey: "test-key",
        timeoutMs: 1234,
        fetchFn,
      }),
    ).rejects.toThrow("Audio transcription failed");
  });

  it("throws when the provider response omits transcript", async () => {
    const { fetchFn } = createRequestCaptureJsonFetch({ text: "" });

    await expect(
      transcribeTelnyxAudio({
        buffer: Buffer.from("audio-bytes"),
        fileName: "voice.wav",
        apiKey: "test-key",
        timeoutMs: 1234,
        fetchFn,
      }),
    ).rejects.toThrow("Audio transcription response missing transcript");
  });
});
