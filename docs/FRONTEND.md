# Frontend integration

How to run the Next.js UI (`web/`) against the PhishSignal FastAPI + ML API from this repo (same contract as [upstream](https://github.com/theoneandonlyrahi/PhishSignal)).

## Run locally

**Terminal A — API (repo root)**

```bash
python -m venv .venv
.\.venv\Scripts\pip.exe install -r requirements.txt
.\.venv\Scripts\uvicorn.exe api:app --host 127.0.0.1 --port 8000
```

Default boot loads `model.pkl`. Set `TRAIN_MODEL=1` only if you need to retrain.

Check:

```bash
curl "http://127.0.0.1:8000/health"
curl "http://127.0.0.1:8000/analyze?url=https://example.com"
```

OpenAPI: `http://127.0.0.1:8000/docs`

**Terminal B — web**

```bash
cd web
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Env

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | API base used by the browser. Unset defaults to `https://phishsignal.onrender.com`. |
| `PHISHSIGNAL_API_PROXY` | Rewrite target (default `http://127.0.0.1:8000`). Server-side only. |

```bash
# web/.env.local — hosted API (same as unset default)
# NEXT_PUBLIC_API_BASE_URL=https://phishsignal.onrender.com

# Local FastAPI via Next rewrite
NEXT_PUBLIC_API_BASE_URL=/backend
```

- Unset: UI calls `https://phishsignal.onrender.com/health` and `/analyze?url=`
- With `/backend`, Next proxies to local FastAPI (`web/next.config.mjs`) — avoids CORS during local dev.
- Direct: `NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000`
- `mock`: UI uses offline `mockAnalyze()`; header shows mock mode.

Restart `npm run dev` after env changes.

## Analyze contract

| Method | Path | Input | Response |
|---|---|---|---|
| `GET` | `/analyze` | Query `url` | `{ url, score, signals }` |
| `GET` | `/health` | — | `{ status: "ok" }` |

```json
{
  "url": "https://example.com/path",
  "score": 42,
  "signals": [
    "Uses a suspicious top-level domain like .xyz, .top, or .ru"
  ]
}
```

- `score` — integer 0–100 (≈ phishing probability × 100)
- `signals` — human-readable reasons
- Band label (SAFE → PHISHING) is **not** from the API; the UI maps it in `web/src/lib/bands.ts`

| Score | Band |
|---|---|
| 0–19 | SAFE |
| 20–39 | CLEAR |
| 40–59 | UNCERTAIN |
| 60–79 | SUSPICIOUS |
| 80–100 | PHISHING |

Same bands as the root README / upstream product copy.

## UI mapping

| UI | Source |
|---|---|
| Confidence donut | `score` |
| Band label | `bandFromScore(score)` |
| Flag Breakdown | `signals[]` |
| Recent History | localStorage (`phishsignal.history.v1`) after a successful scan |
| Report taps | localStorage (`phishsignal.feedback.v1`) per URL |
| Scan Overview | Derived from local history |

Paste URL → hold **ANALYZE** → gate (throttle + token bucket) → `analyzeUrl` → results + history.

Login is not required for analyze. History stays in the browser for the MVP.

## Key files (`web/src`)

| Path | Role |
|---|---|
| `lib/types.ts` | `AnalyzeResponse`, `ScanResult` |
| `lib/bands.ts` | Score → band |
| `lib/api.ts` | `analyzeUrl`, `checkHealth`, hosted default vs mock |
| `lib/url-input.ts` | Sanitize / serialize paste |
| `lib/analyze-gate.ts` | Single-flight + throttle + token bucket |
| `lib/history-store.ts` | localStorage history |
| `lib/feedback-store.ts` | localStorage misclassification reports |
| `lib/mock-dashboard.ts` | Offline analyze when `NEXT_PUBLIC_API_BASE_URL=mock` |
| `components/Dashboard.tsx` | Orchestrates analyze → panels |
| `components/InspectLink.tsx` | URL input + Hold Confirm |
| `components/ResultsPanel.tsx` | Score + band + report taps |
| `components/ReportFeedback.tsx` | Looks right / Report issue |
| `components/FlagBreakdown.tsx` | Signal list |
| `next.config.mjs` | `/backend/*` → FastAPI rewrite |

## Smoke check

1. Hosted or local `/health` → ok; header chip shows **API live**. No working banner on the dashboard.
2. Hold ANALYZE on a URL → donut, band, and flags match `curl` JSON
3. History prepends the URL
4. Stop the API → next analyze shows an error without crashing the page

## Scripts (`web/`)

| Command | Purpose |
|---|---|
| `npm run dev` | Dev server |
| `npm test` | Vitest |
| `npm run build` | Production build |

UI third-party credits: [`UI_SOURCES.md`](./UI_SOURCES.md).
