# telnyx-openclaw-stt

Telnyx speech-to-text provider for [OpenClaw](https://github.com/openclaw/openclaw) audio transcription.

Registers Telnyx as a first-class `mediaUnderstandingProviders` backend so inbound voice notes, audio uploads, and recordings can be transcribed through Telnyx STT instead of Deepgram.

## Features

- **Provider ID:** `telnyx`
- **Plugin ID:** `telnyx-stt`
- **Default model:** `openai/whisper-large-v3-turbo`
- **Auto-select priority:** 25
- **Auth:** `TELNYX_API_KEY` env var or provider config
- **Transport:** multipart upload to `POST /v2/ai/audio/transcriptions`

## Prerequisites

- Node.js `>=22.14.0`
- OpenClaw `>=2026.4.0`
- A valid `TELNYX_API_KEY`

## Install

```bash
openclaw plugins install team-telnyx/telnyx-openclaw-stt
```

## Configuration

### Minimal (env var)

```bash
export TELNYX_API_KEY=KEY...
```

### Enable Telnyx for audio transcription

In `openclaw.json`:

```json
{
  "tools": {
    "media": {
      "audio": {
        "enabled": true,
        "models": [
          {
            "provider": "telnyx",
            "model": "openai/whisper-large-v3-turbo"
          }
        ]
      }
    }
  }
}
```

### Optional language hint and provider flags

```json
{
  "tools": {
    "media": {
      "audio": {
        "prompt": "Expect OpenClaw and Telnyx product names",
        "providerOptions": {
          "telnyx": {
            "temperature": 0,
            "timestamps": true
          }
        },
        "models": [
          {
            "provider": "telnyx",
            "model": "openai/whisper-large-v3-turbo",
            "language": "en"
          }
        ]
      }
    }
  }
}
```

## Local development

```bash
git clone https://github.com/team-telnyx/telnyx-openclaw-stt.git
cd telnyx-openclaw-stt
npm install
npm test
npm run lint
```

## Live smoke test

```bash
export TELNYX_API_KEY=KEY...
node --input-type=module <<'EOF'
const sampleUrl = 'https://static.deepgram.com/examples/Bueller-Life-moves-pretty-fast.wav';
const res = await fetch(sampleUrl);
if (!res.ok) throw new Error(`sample fetch failed ${res.status}`);
const sample = await res.arrayBuffer();
const form = new FormData();
form.set('model', 'openai/whisper-large-v3-turbo');
form.set('file', new Blob([sample], { type: 'audio/wav' }), 'sample.wav');
const out = await fetch('https://api.telnyx.com/v2/ai/audio/transcriptions', {
  method: 'POST',
  headers: { Authorization: `Bearer ${process.env.TELNYX_API_KEY}` },
  body: form,
});
if (!out.ok) throw new Error(`Telnyx API error ${out.status}: ${await out.text()}`);
const data = await out.json();
console.log(data.text);
EOF
```

This downloads a public WAV sample, sends it to Telnyx STT, and prints the transcript.
The sample currently comes from a public Deepgram-hosted test file, so the smoke test depends on that URL remaining reachable.

## Unit Tests

```bash
npm install
npm test
npm run lint
```

## How it works

- builds multipart form data with `model`, `language`, `prompt`, and extra provider flags
- uploads audio to Telnyx STT
- reads `text` from the response payload
- returns the transcript through OpenClaw’s media-understanding contract

## Files

- `index.ts` — plugin entry
- `src/audio.ts` — transcription transport logic
- `src/media-understanding-provider.ts` — provider registration object
- `src/audio.test.ts` — unit tests
- README live smoke-test snippet — manual end-to-end verification

## License

MIT
