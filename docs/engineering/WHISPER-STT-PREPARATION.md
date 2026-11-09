# Offline STT preparation

The optional Windows x64 installer downloads official whisper.cpp 1.8.3 CPU binaries and the multilingual base model. It does not change the selected voice backend. Human microphone recognition remains unresolved; a successful synthesized-speech decode is not evidence of a human conversation.

Sources: [upstream](https://github.com/ggml-org/whisper.cpp), [pinned release](https://github.com/ggml-org/whisper.cpp/releases/tag/v1.8.3), [model repository](https://huggingface.co/ggerganov/whisper.cpp). Version 1.8.3 is a pinned binary release, not a claim to be the latest source version. The model revision, sizes and SHA-256 values are fixed in the installer. Each required native dependency is checked against the release-derived digest map. Existing mismatched files are preserved and rejected. Upstream MIT license is in `docs/third-party/whisper.cpp-LICENSE.txt`.

Run `node scripts/install-local-stt.mjs`. Then set `ZERO_WHISPER_TESTS=1` and run `node --test test/whisper-native-real.test.mjs`. The opt-in REAL_OS/INTEGRATION test creates genuine Windows TTS, invokes the real CPU decoder, requires every word to match, records PASS or FAIL, and removes its temporary public-audio fixture. It does not record microphone audio or play sound. See verification/2026-11-10/whisper-public-tts.json.

The shared download helper now supports pinned non-GGUF binary assets. The GGUF wrapper still forces its magic header regardless of caller options. Actual loopback HTTP transfer tests cover generic binary acceptance and mandatory GGUF rejection along with existing corruption, truncation, oversize, cancellation and file preservation checks. These are INTEGRATION checks, not external service or inference proof.

Remaining work: integrate explicitly selectable recognition backend, validate cancellation and restart behavior, run actual headset microphone recognition and genuine voice conversation. No improved human-speech accuracy claim is made by asset provisioning.
