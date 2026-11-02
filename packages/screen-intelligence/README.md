# Screen intelligence

```js
import { createScreenObserver } from './packages/screen-intelligence/index.mjs';
const observer = createScreenObserver({ dataDir: options.dataDir });
// Apply the owner's saved opt-in preference before calling start().
observer.start();
const status = observer.getStatus();
const context = observer.queryContext('current window');
await observer.stop();
await observer.destroy();
```

Construction is idle. `dataDir` stores `screen-observations.sqlite`; `dbPath` overrides it, including explicit `:memory:` for tests. The default directory is `ZERO_DATA_DIR` or `.zero-data` resolved against the working directory. `observationStore` in status and query results reports the actual path, mode, persistence, open state, retention and row count. `getCanonicalScreenObserver({ dataDir })` initializes the optional singleton before first use; `canonicalScreenObserver` supports existing method/property access lazily. Importing the module does not open a database. Hosts may instead own an independent factory instance.

`start({ intervalMs })` schedules an immediate first capture and waits the interval **after completion** before another. Manual `captureTick()` calls share an in-flight operation; there is no queue. `stop()` immediately disables ingestion from the loop, invalidates its generation and aborts OCR, then returns a promise for the outstanding operation. A shared CUA SDK call may finish before it observes cancellation; its result cannot be ingested after stop/restart/destroy. `destroy()` closes persistence and clears the buffer immediately; its returned promise can be awaited for drain. Explicit synchronous `ingestFrame()` remains available independently of the loop.

Captures use the existing CUA desktop driver, with an unwrapped native Windows fallback that requires `livePixels: true`. Geometry comes from the actual PNG header, never a 1920×1080 default. Foreground metadata is sampled separately and timestamped: it is not an atomic claim about the screenshot. Unknown display identity stays unknown. Missing pixels and malformed/oversized/non-PNG captures fail; unsupported metadata is explicitly unavailable. Capture failures emit `capture-error`, update counters and health, and do not fabricate a frame. The optional EventEmitter `error` event is emitted only when a listener exists.

PowerShell receives complete images over stdin (no command-line base64/truncation), recognizes them with `Windows.Media.Ocr.OcrEngine`, and disposes WinRT streams/bitmaps. OCR input/output and runtime are bounded (8 MiB, 12,000 characters, 15 seconds by default). Empty recognized text is valid; missing language packs, decoding errors, timeouts and aborts are unavailable with reasons. WinRT has no recognition-confidence API, so confidence is `null`. Local vision is explicitly unavailable: summaries describe observed metadata/OCR and never claim model inference. Full encoded-image SHA-256, window metadata and OCR changes gate persistence; this is not a perceptual score.

Retention defaults to five minutes, 250 MiB and 4,096 frames. The budget includes owned image allocations plus a conservative metadata estimate; this is **not a ceiling on total Node/SDK/PowerShell working memory**. Strings and frame count are bounded, subarrays are copied into owned allocations, and all buffer reads/pushes expire old entries. Semantic SQLite rows persist without image bytes, preserve OCR provenance and capture metadata, and default to seven days of retention (pruned during inserts at most once per minute). The schema migrates without replacing existing rows. SQLite cache/WAL sizes are bounded; freed semantic pages are reused. Status `current` requires a running observer, a fresh successful capture and available metadata. A stopped observer's persisted records remain historical; active-window fields are null.

Run only isolated, targeted checks:

```powershell
node --test packages/screen-intelligence/screen-intelligence.test.mjs test/phase8-screen-intelligence.test.mjs
node scripts/screen-intelligence-real-os.mjs
node scripts/screen-intelligence-endurance.mjs --duration-seconds 60 --sample-ms 2000
node scripts/screen-intelligence-endurance.mjs --hours 24
```

The real-OS integration script requires an interactive Windows desktop and an English OCR language pack; missing prerequisites fail explicitly. It writes a live desktop PNG, actual driver shape, OCR result, isolated SQLite DB and report beneath `artifacts/screen-intelligence/`. Separately, a rendered known-text fixture proves WinRT recognition; that fixture is labeled separately from the live capture.

The endurance CLI is explicit opt-in, independent of host auto-start preferences. Its output directory contains `manifest.json`, an atomically refreshed `summary.json`, streaming `samples.jsonl`, streaming `capture-events.jsonl` and an isolated semantic DB. It measures monotonic elapsed duration, capture/OCR/metadata success and failure, concurrency, bounded latency buckets, retained buffer bytes, Node RSS, CPU time, event-loop delay, sampling gaps and success gaps, plus DB reopen verification at shutdown. It retains only fixed-size metric windows in RAM. Samples label Node RSS separately from native/SDK working memory. Long-run output contains desktop-derived OCR in SQLite, but no accumulating screenshots.

`--output-dir PATH`, `--interval-ms`, `--sample-ms`, `--max-memory-mib`, `--max-rss-mib`, and `--max-gap-ms` adjust limits. Defaults are 2-second post-capture interval, 10-second samples, 250 MiB image/metadata budget, 1 GiB Node RSS check and 60-second maximum evidence gaps. An over-budget sample, capture/OCR/metadata failure, overlap, excessive gap or failed DB reopen makes the final verdict fail. RSS is sampled, so transient peaks between samples may be missed; first/last fixed RSS windows are evidence, not proof of a leak-free process. Creating an empty `STOP` file in the run directory or sending SIGINT/SIGTERM ends it early. A short or interrupted run never sets `completed24Hours`; a running summary remains `in-progress`. Certification requires at least 24 measured hours, the requested duration, continuous evidence within the gap threshold, healthy counters and DB reopen verification. Process death leaves the last running summary as incomplete evidence.
