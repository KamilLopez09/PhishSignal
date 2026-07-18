# PhishSignal — Tech Stack Documentation

**Scope:** As-built stack on `master`.

---

## 1. As-built stack (current repository)

### 1.1 Runtime & language

| Layer | Choice | Version / notes |
|---|---|---|
| Language | Python 3.11+ | API + ML |
| API framework | FastAPI | `/analyze`, `/health` |
| ASGI server | Uvicorn | Local API process |
| Frontend | Next.js 14 (`web/`) | Analyzer UI |
| ML | scikit-learn `RandomForestClassifier` | Served from `model.pkl` |
| Data | pandas + numpy | Train path only |
| Serialization | pickle | `{ model, scaler, features }` |
| HTTP client | requests | RDAP domain-age lookup |
| Domain intel | RDAP (`rdap.org`) | Timed thread; age `-1` on failure |
| CORS | env `CORS_ORIGINS` | Empty → `*` (local); set origins when needed |
| Rate limit | in-process token bucket | `/analyze` per client IP |

### 1.2 Repository layout

```
PhishSignal/
├── api.py              # FastAPI (CORS + rate limit + validate)
├── model.py            # Load pickle (default) / optional train + analyze()
├── model.pkl           # Trained model + StandardScaler + feature list
├── apidataset.csv      # Training data (~11k rows)
├── requirements.txt
├── deploy/             # Platform config artifacts (docker / railway / vercel)
├── web/                # Next.js analyzer
├── docs/               # PRD / stack / flows / integration
└── README.md
```

### 1.3 Dependencies (`requirements.txt`)

```
fastapi
uvicorn
scikit-learn
pandas
numpy
requests
```

Frontend deps live under `web/package.json`. No database or auth library in MVP.

### 1.4 Data & model artifacts

| Artifact | Size (approx.) | Role |
|---|---|---|
| `apidataset.csv` | ~3.7 MB | Crowdsourced/labeled URL feature table; `status` ∈ {legitimate, phishing} |
| `model.pkl` | ~29 MB | RandomForest + StandardScaler + selected feature names |

**Training selection:** binary map `phishing→1`, `legitimate→0`; keep URL-computable feature set `REALFEATURES`; correlation filter `|r| > 0.1` vs status; 75/25 train/test split; StandardScaler; RandomForest fit; dump pickle.

**Inference:** `extractFeatures(url)` → DataFrame aligned to `selectedFeatures` → `scaler.transform` → `predict_proba` → `score = round(P_phish * 100)`.

### 1.5 External services (runtime)

| Service | Purpose | Failure mode in code |
|---|---|---|
| `https://rdap.org/domain/{domain}` | Domain registration date → age in days | Timeout 3s / errors → age `-1`, `dns_record=0`, signal appended |
| Local health | `GET /health` | Process liveness check |

### 1.6 Residual smells

1. **Coupled module:** training helpers still live in `model.py` (boot defaults to pickle load).  
2. **GET with URL query** — very long URLs may hit length limits; POST JSON later.  
3. **In-process rate limit** — resets per replica; edge WAF still recommended for public.

---

## 2. Recommended stack for the larger site

Designed to wrap the existing Python ML API rather than rewrite it.

### 2.1 Proposed system layers

```
┌─────────────────────────────────────────────────────────┐
│  Clients: Web app · (later) Extension · Integrators     │
└───────────────────────────┬─────────────────────────────┘
                            │ HTTPS JSON
┌───────────────────────────▼─────────────────────────────┐
│  Edge: CDN / WAF / rate limits                          │
└───────────────────────────┬─────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌───────────────┐  ┌─────────────────┐  ┌──────────────────┐
│ Web frontend  │  │ Analyze API     │  │ Feedback API     │
│ (SSR/SPA)     │  │ FastAPI + RF    │  │ reports + review │
└───────────────┘  └────────┬────────┘  └────────┬─────────┘
                            │                    │
                            ▼                    ▼
                     model.pkl            Postgres / SQLite
                     RDAP cache           object storage (opt)
```

### 2.2 Frontend (greenfield)

| Concern | Recommendation | Rationale |
|---|---|---|
| Framework | Next.js (React) or plain Vite + React | Fast analyzer UX |
| Styling | Project design system / CSS variables | Match product branding; avoid generic AI-slop look |
| API client | `fetch` / typed client from OpenAPI | Single contract with FastAPI |

### 2.3 Backend / API

| Concern | Recommendation | Rationale |
|---|---|---|
| Keep | FastAPI + Uvicorn | Already matches `/analyze` + `/health` |
| Split | `train.py` vs `serve/` package | No retrain on boot |
| Validation | Pydantic models for request/response | Better errors than bare `url: str` |
| Cache | In-memory / Redis for RDAP + analyze results | Cut latency & RDAP load |
| Rate limit | SlowAPI / reverse-proxy limits | Abuse control |
| Docs | FastAPI `/docs` + this `docs/` set | Integrator-ready |

### 2.4 Crowdsourcing & ops data

| Concern | Recommendation |
|---|---|
| DB | Postgres or SQLite for early MVP |
| Tables | `analyses`, `reports`, `reviewed_samples` |
| Jobs | Cron/worker for export → retrain → artifact publish |
| Secrets | Env vars — never commit keys |

### 2.5 MLOps (lightweight)

| Step | Tooling |
|---|---|
| Train offline | `python train.py` in CI or local |
| Evaluate | accuracy + confusion matrix + band calibration |
| Artifact store | Git LFS / release asset / object storage — versioned `model.pkl` |
| Serve | Load pickle once at startup; hot-reload optional |
| Monitor | Score histogram, RDAP fail %, user report rate |

---

## 3. API surface (current contract)

### `GET /analyze`

**Query:** `url` (string)  
**Response JSON:**

```json
{
  "url": "https://example.com/path",
  "score": 42,
  "signals": [
    "Uses a suspicious top-level domain like .xyz, .top, or .ru"
  ]
}
```

**Semantics:**

- `score`: integer 0–100 ≈ phishing class probability × 100  
- `signals`: human-readable reasons; frontend owns labeling  
- Does **not** return the band label itself — UI maps bands

### `GET /health`

```json
{ "status": "ok" }
```

### Suggested additive endpoints (site PRD)

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/v1/analyze` | Body `{ "url": "..." }` — preferred for site |
| `POST` | `/v1/reports` | Crowdsource incorrect result |
| `GET` | `/v1/meta` | Model version, feature count, trained_at |

---

## 4. Feature engineering reference

`REALFEATURES` (candidates before correlation filter) in `model.py`:

`length_url`, `length_hostname`, `ip`, `nb_dots`, `nb_hyphens`, `nb_at`, `nb_qm`, `nb_and`, `nb_eq`, `nb_slash`, `nb_semicolumn`, `nb_www`, `nb_com`, `https_token`, `ratio_digits_url`, `ratio_digits_host`, `nb_subdomains`, `tld_in_subdomain`, `abnormal_subdomain`, `prefix_suffix`, `shortening_service`, `length_words_raw`, `shortest_word_host`, `longest_words_raw`, `longest_word_host`, `longest_word_path`, `avg_words_raw`, `avg_word_host`, `avg_word_path`, `phish_hints`, `suspecious_tld`, `domain_age`, `dns_record`

Selected subset is whatever survives `|corr| > 0.1` and is stored inside `model.pkl` under `"features"`.

---

## 5. Local runbook (as-built)

```bash
python -m venv .venv
# Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Default: load model.pkl (set TRAIN_MODEL=1 only to retrain)
uvicorn api:app --reload --host 0.0.0.0 --port 8000

# Example
curl "http://localhost:8000/analyze?url=https://example.com"
curl "http://localhost:8000/health"
```

OpenAPI UI (when server running): `http://localhost:8000/docs`

---

## 6. Frontend UI component sources

Pre-existing third-party UI (GodUI, Uiverse, Chakra Charts, shadcn) is cataloged with **docs URLs, registry URLs, local paths, and wiring** in:

**[`docs/UI_COMPONENTS.md`](./UI_COMPONENTS.md)**

**Product shell:** GPTZero-inspired analyzer workspace — brand header (`PhishSignal`), one Container Scroll detector canvas, calm secondary cards, Morphing Dialog for metric details. Motion policy and source URLs live in that doc.

**Frontend analysis + API wiring plan (Python unchanged):**

- [`docs/FRONTEND_ANALYSIS.md`](./FRONTEND_ANALYSIS.md)
- [`docs/BACKEND_INTEGRATION.md`](./BACKEND_INTEGRATION.md)
- [`docs/AUTH_AND_STORAGE.md`](./AUTH_AND_STORAGE.md) — history + login decisions

---

## 7. Decision log (recommended defaults for the larger project)

| Decision | Choice | Why |
|---|---|---|
| Keep ML in Python | Yes | sklearn RandomForest + existing pickle |
| Frontend language | TypeScript/React | Fast UI iteration for analyzer site |
| Don’t crawl pages in MVP | Yes | Privacy + latency + current model design |
| Crowdsource storage | Postgres | Durable reports for retrain loop |
| Default git branch | Align to code-bearing branch | Avoid empty `main` surprise |
