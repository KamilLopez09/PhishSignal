# PhishSignal — Frontend ↔ Backend Integration Plan

**Contract:** FastAPI `GET /analyze` + `GET /health` → `{ url, score, signals }`.  
**Frontend:** types, bands, client, gate, and Dashboard in `web/src/lib/*` / `Dashboard.tsx`.  
**Related:** [`FRONTEND_ANALYSIS.md`](./FRONTEND_ANALYSIS.md) · [`TECH_STACK.md`](./TECH_STACK.md) · [`PRD.md`](./PRD.md) · [`UI_COMPONENTS.md`](./UI_COMPONENTS.md)

---

## 1. As-built API (source of truth)

| Method | Path | Input | Response |
|---|---|---|---|
| `GET` | `/analyze` | Query `url` (string) | `{ url, score, signals }` |
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

| Field | Meaning | UI owner |
|---|---|---|
| `score` | ≈ P(phishing) × 100, integer 0–100 | Donut + band mapping |
| `signals` | Human-readable reasons | Flag Breakdown list |
| Band label | **Not returned by API** | `lib/bands.ts` (PRD §7) |

OpenAPI when API is running: `http://localhost:8000/docs`.

---

## 2. Already implemented in `web/` (no Python changes)

| Piece | Path | Role |
|---|---|---|
| Response types | `web/src/lib/types.ts` | `AnalyzeResponse`, `ScanResult` |
| Band map | `web/src/lib/bands.ts` | SAFE → PHISHING thresholds |
| HTTP client | `web/src/lib/api.ts` | `analyzeUrl`, `checkHealth`, `getApiBaseUrl` |
| Offline fallback | `web/src/lib/mock-dashboard.ts` | `mockAnalyze` when env unset |
| Env template | `web/.env.example` | `NEXT_PUBLIC_API_BASE_URL` |
| State owner | `web/src/components/Dashboard.tsx` | loading / error / history |

**Runtime switch**

| Env | Behavior |
|---|---|
| `NEXT_PUBLIC_API_BASE_URL` unset | Header shows **Mock data**; `mockAnalyze(url)` |
| Set to `http://localhost:8000` | Header shows **API live**; `GET {base}/analyze?url=` |

```bash
# web/.env.local
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

---

## 3. Integration phases

### Phase A — Local live analyze (MVP) ✅ wired

**Goal:** Paste URL → Hold ANALYZE → FastAPI score/signals render.

1. Start API (repo root):
   ```bash
   .\.venv\Scripts\uvicorn.exe api:app --host 127.0.0.1 --port 8000
   ```
2. `web/.env.local` sets `NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000`.
3. Restart `npm run dev` in `web/` after env changes.
4. Header dropdown shows **API live** when `/health` is ok; banner warns if unreachable.
5. Analyze a URL; donut, band (`lib/bands.ts`), and Flag Breakdown use live JSON.

**Shipped with Phase A**

- [x] `lib/api.ts` — timeout, `normalizeUrl`, live `analyzeUrl` / `checkHealth`  
- [x] Dashboard health check + `ApiStatusBanner`  
- [x] Env template + local env  
- [x] Optional Next rewrite `/backend/*` → FastAPI (`next.config.mjs`)  

**CORS:** as-built FastAPI allows all origins in dev. Direct `127.0.0.1:8000` works; `/backend` proxy available as alternative.

---

### Phase B — Dev ergonomics (frontend-only) ✅ mostly shipped

| Task | Approach | Status |
|---|---|---|
| Proxy | `next.config.mjs` rewrite `/backend/:path*` → FastAPI | Done — default `.env.local` uses `/backend` |
| Loading UX | Disable input + ANALYZE while `status === "loading"` | Done |
| Abort / timeout | 15s analyze / 4s health via `AbortController` | Done |
| URL normalize | `normalizeUrl()` adds `https://` when scheme missing | Done |
| Health banner | `ApiStatusBanner` when configured but unreachable | Done |

---

### Phase C — Product completeness (still no Python required)

| Task | Depends on API? | Status / plan |
|---|---|---|
| History persistence | No | **Done** — `lib/history-store.ts` (localStorage) |
| Overview stats | No (local) | **Done** — derived from history; demo placeholders until first scan |
| Rate-limit UX | No | **Done** — token bucket + throttle + single-flight (`lib/analyze-gate.ts`) |
| Input serialization | No | **Done** — `lib/url-input.ts` |
| Settings / History routes | No | Next — `app/history/page.tsx` |
| Report incorrect result | **Yes (new endpoint)** | Out of scope until crowdsource API (see AUTH_AND_STORAGE) |
| Login | Optional later | **Decision:** not required for analyze — [`AUTH_AND_STORAGE.md`](./AUTH_AND_STORAGE.md) |

---

### Phase D — Contract evolution (Python later — out of scope here)

Documented for planning only; **do not implement in Python in this workstream**:

| Future change | Why | Frontend impact |
|---|---|---|
| `POST /v1/analyze` JSON body | Long URLs hit GET limits | Swap `analyzeUrl` method; keep response type |
| Analytics aggregates | Real Scan Overview | Replace `OVERVIEW_STATS` |

**Shipped on API:** pickle boot, `CORS_ORIGINS`, server `/analyze` rate limit, URL validation.

---

## 4. Mapping: API → UI

| UI surface | Field | Transform |
|---|---|---|
| Confidence donut | `score` | clamp 0–100 |
| Band label | — | `bandFromScore(score)` |
| Flag Breakdown | `signals[]` | render as list (no inventing trust/risk split) |
| Recent History | `url`, `score` | prepend on success; relative time client-side |
| Scan Overview | — | **not** from `/analyze` until aggregates exist |
| Disclaimer | static copy | PRD FR-8 |

### Band table (must stay in sync with PRD §7)

| Score | Band |
|---|---|
| 0–19 | SAFE |
| 20–39 | CLEAR |
| 40–59 | UNCERTAIN |
| 60–79 | SUSPICIOUS |
| 80–100 | PHISHING |

---

## 5. Error & empty states

| Case | UI |
|---|---|
| Env unset | Mock mode (explicit chip) |
| Network / CORS failure | `ResultsPanel` error text; keep last good result |
| Non-JSON / shape mismatch | Throw in `analyzeUrl`; surface message |
| Empty `signals` | “No signals returned for this URL.” |
| Health fail on boot | Optional banner: “API unreachable” |

---

## 6. Security & ops notes (frontend)

- Never put secrets in `NEXT_PUBLIC_*` — API key (if added later) belongs in a BFF route, not the browser.
- Prefer same-site proxy or locked CORS when not on localhost.
- Treat score as a **risk indicator**, not a legal verdict (copy already in Results panel).

---

## 7. Verification checklist

```bash
# Terminal A — API (repo root)
uvicorn api:app --reload --port 8000
curl "http://localhost:8000/health"
curl "http://localhost:8000/analyze?url=https://example.com"

# Terminal B — web
cd web
cp .env.example .env.local   # edit if needed
npm run dev
```

Manual UI:

1. Chip shows **API live**  
2. Hold ANALYZE on a URL  
3. Score/band/signals match curl JSON  
4. History prepends the URL  
5. Stop API → next analyze shows error without crashing  

---

## 8. Explicit non-goals (this plan)

- Editing `api.py` / `model.py` / retraining  
- Page crawling or content phishing  
- Crowdsource report persistence (needs new backend)  
- Replacing GodUI motion policy (single Container Scroll + Morphing Dialog + Hold Confirm)
