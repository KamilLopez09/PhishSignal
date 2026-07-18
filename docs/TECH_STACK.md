# PhishSignal — Tech Stack Documentation

**Scope:** As-built stack in `theoneandonlyrahi/PhishSignal` (`master`) plus recommended stack for the larger phishing-detector site.

---

## 1. As-built stack (current repository)

### 1.1 Runtime & language

| Layer | Choice | Version / notes |
|---|---|---|
| Language | Python 3 | Bytecode in history suggests 3.11 |
| API framework | FastAPI | Declarative routes + automatic OpenAPI |
| ASGI server | Uvicorn | Implied by FastAPI ecosystem / Railway deploys |
| ML | scikit-learn `RandomForestClassifier` | `n_estimators=200`, `n_jobs=-1`, `random_state=42` |
| Data | pandas + numpy | CSV load, correlation, vectors |
| Serialization | pickle | `model.pkl` = `{ model, scaler, features }` |
| HTTP client | requests | RDAP domain-age lookup |
| Domain intel | RDAP (`rdap.org`) + `python-whois` (dep present) | Live path uses RDAP in a timed thread |
| CORS | `fastapi.middleware.cors` | Dev: allow all origins/methods/headers |

### 1.2 Repository layout

```
PhishSignal/
├── api.py              # FastAPI application (routes + CORS)
├── model.py            # Train + feature extract + analyze()  [coupled]
├── model.pkl           # Trained model + StandardScaler + feature list
├── apidataset.csv      # ~11,430 labeled URLs × ~89 columns
├── requirements.txt    # fastapi, uvicorn, sklearn, pandas, numpy, python-whois, requests
├── README.md           # Product semantics + crowdsourcing intent
└── docs/               # PRD / stack / flows (this documentation set)
```

### 1.3 Dependencies (`requirements.txt`)

```
fastapi
uvicorn
scikit-learn
pandas
numpy
python-whois
requests
```

No frontend package, no database driver, no auth library in-repo today.

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
| (Planned) Railway health checks | Hit `GET /health` | N/A |

### 1.6 Architectural smells to fix before scale

1. **Train-on-import:** importing `model` from `api` executes full CSV load + train + dump + reload.  
2. **Monolith module:** training, feature engineering, and serving share one file.  
3. **Wide-open CORS** unsuitable for production abuse control.  
4. **GET with URL query** — long/odd URLs may hit length limits; POST JSON is preferable for the site.  
5. **Branch divergence:** empty `main` vs code on `master`.

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
| Framework | Next.js (React) or plain Vite + React | Fast analyzer UX, easy deploy |
| Styling | Project design system / CSS variables | Match product branding; avoid generic AI-slop look |
| API client | `fetch` / typed client from OpenAPI | Single contract with FastAPI |
| Hosting | Vercel / Cloudflare Pages / Netlify | Static+SSR; API stays on Python host |

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
| DB | Postgres (Railway/Supabase/Neon) or SQLite for early MVP |
| Tables | `analyses`, `reports`, `reviewed_samples` |
| Jobs | Cron/worker for export → retrain → artifact publish |
| Secrets | Platform env vars — never commit keys |

### 2.5 MLOps (lightweight)

| Step | Tooling |
|---|---|
| Train offline | `python train.py` in CI or local |
| Evaluate | accuracy + confusion matrix + band calibration |
| Artifact store | Git LFS / release asset / S3 — versioned `model.pkl` |
| Serve | Load pickle once at startup; hot-reload optional |
| Monitor | Score histogram, RDAP fail %, user report rate |

### 2.6 Hosting topology (aligned with README)

| Service | Platform options |
|---|---|
| API | Railway, Fly.io, Render, Cloud Run |
| Frontend | Vercel / Pages |
| DB | Managed Postgres |
| Observability | Platform logs + optional Sentry |

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

# WARNING: importing model.py currently retrains then serves
uvicorn api:app --reload --host 0.0.0.0 --port 8000

# Example
curl "http://localhost:8000/analyze?url=https://example.com"
curl "http://localhost:8000/health"
```

OpenAPI UI (when server running): `http://localhost:8000/docs`

---

## 6. Decision log (recommended defaults for the larger project)

| Decision | Choice | Why |
|---|---|---|
| Keep ML in Python | Yes | sklearn RandomForest + existing pickle |
| Frontend language | TypeScript/React | Fast UI iteration for analyzer site |
| Don’t crawl pages in MVP | Yes | Privacy + latency + current model design |
| Crowdsource storage | Postgres | Durable reports for retrain loop |
| Default git branch | Align to code-bearing branch | Avoid empty `main` surprise |
