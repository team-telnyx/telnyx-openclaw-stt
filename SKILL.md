---
name: telnyx-openclaw-stt
description: Add Telnyx as an OpenClaw audio transcription provider with TELNYX_API_KEY auth and multipart speech-to-text support.
homepage: https://github.com/team-telnyx/telnyx-openclaw-stt
metadata:
  {
    "openclaw": {
      "emoji": "🎙️",
      "requires": { "env": ["TELNYX_API_KEY"] },
      "install": [
        {
          "id": "github",
          "kind": "github",
          "package": "team-telnyx/telnyx-openclaw-stt",
          "label": "Install the Telnyx STT OpenClaw plugin"
        }
      ]
    }
  }
---

# Telnyx OpenClaw STT

Use Telnyx as your OpenClaw audio transcription provider.

## What it provides

- Telnyx media-understanding provider registration for OpenClaw
- Auto-selection when `TELNYX_API_KEY` is configured
- Multipart audio upload to Telnyx STT
- Support for language hints, prompt hints, and provider-specific form flags

## Install

```bash
openclaw plugins install team-telnyx/telnyx-openclaw-stt
```

## Setup

Set your Telnyx API key:

```bash
export TELNYX_API_KEY="KEY..."
```

## Verify

After install, configure OpenClaw to use provider `telnyx` for media audio transcription.
Then run a live smoke test using the README snippet with `TELNYX_API_KEY` set.
