# PhishSignal — Product Requirements Document (PRD)

**Product:** PhishSignal — real-time phishing URL detector (site + API + ML model)  
**Authors (upstream):** Kamil Lopez, Mahdi Murshed, Rayyan Rahman, Rahidul Alam  
**Document purpose:** Expand the existing API/model into a full phishing-detector product surface  
**Status:** Draft based on current `master` codebase + README product intent  
**Date:** 2026-07-17

---

## 1. Problem

Users routinely encounter suspicious links in email, chat, SMS, and social media. Most people cannot reliably judge whether a URL is phishing from structure alone. Existing tools often:

- Require installing a browser extension, or
- Scan page content (privacy / latency cost), or
- Return opaque binary verdicts without explainability

PhishSignal addresses this with a **URL-structure + domain-registration** risk score and human-readable signals — without fetching or rendering destination page content.

---

## 2. Product vision

A consumer-facing website and public API that, given any URL, returns:

1. A **0–100 risk score** (model confidence that the URL matches phishing patterns)
2. A **label band** (SAFE → PHISHING)
3. An **explainable signal list** (why the score moved)

Longer term: crowdsourced feedback loops that improve training data, plus optional browser/email integrations that call the same API.

---

## 3. Goals & non-goals

### Goals (MVP site)

| ID | Goal | Success metric |
|---|---|---|
| G1 | Analyze a URL in under ~3s typical latency | p95 < 3s excluding cold RDAP failures |
| G2 | Show score, label, and signals clearly | Usability test: users understand next action |
| G3 | Never fetch destination HTML/JS | Zero outbound fetch of target page content |
| G4 | Support crowdsourced false-positive/negative reports | Report submission persists with URL + score snapshot |
| G5 | Expose a stable JSON API for the site and future clients | OpenAPI / documented contract |

### Non-goals (MVP)

- Full page / content phishing detection (DOM, forms, brand impersonation screenshots)
- Email body parsing or mailbox OAuth integration (post-MVP)
- Malware / file attachment scanning
- Guaranteed legal “safe / unsafe” certification — score is a **risk indicator**, not a verdict of truth

---

## 4. Personas

1. **Everyday user** — pastes a link from a text/email before clicking  
2. **Security-curious student / researcher** — inspects signals and score bands  
3. **Developer / integrator** — calls `/analyze` from another app  
4. **Model maintainer (team)** — reviews crowdsourced flags and retrains

---

## 5. Current system (as-built)

Primary components already in the repo (`master` branch):

| Component | File | Role |
|---|---|---|
| HTTP API | `api.py` | FastAPI app: `GET /analyze`, `GET /health`, open CORS |
| ML pipeline + inference | `model.py` | Train RandomForest, extract features, `analyze(url)` |
| Artifacts | `model.pkl`, `apidataset.csv` | Serialized model/scaler/features; ~11.4k labeled URLs |
| Product copy | `README.md` | Score bands, crowdsourcing intent, hosting note |

**Important branch note:** `origin/main` currently contains only a deleted README (empty tree). **All product code lives on `master`.** Product work should treat `master` as the source of truth until branches are reconciled.

---

## 6. Functional requirements

### 6.1 URL analysis (core — exists)

| ID | Requirement | Priority | Notes |
|---|---|---|---|
| FR-1 | Accept a URL string and return JSON `{ url, score, signals }` | P0 | Implemented via `GET /analyze?url=` |
| FR-2 | Extract URL-structural features only (no page crawl) | P0 | `extractFeatures()` |
| FR-3 | Enrich with domain age via RDAP when available | P0 | `getDomainAge()` → rdap.org |
| FR-4 | Return human-readable signal strings | P0 | Appended during feature extraction |
| FR-5 | Health check for hosting platforms | P0 | `GET /health` → `{ status: "ok" }` |

### 6.2 Website (planned)

| ID | Requirement | Priority | Notes |
|---|---|---|---|
| FR-6 | Landing page explaining product + score semantics | P0 | Align with README interpretation section |
| FR-7 | Analyzer UI: URL input → score meter + label + signal list | P0 | Labels per score bands below |
| FR-8 | Clear disclaimer: score ≠ content scan | P0 | Trust / liability |
| FR-9 | Mobile-responsive layout | P1 | |
| FR-10 | Rate-limit friendly UX (disable spam submits) | P1 | Client + API |

### 6.3 Crowdsourcing (planned — README only today)

| ID | Requirement | Priority | Notes |
|---|---|---|---|
| FR-11 | “Report incorrect result” action after analysis | P1 | FP / FN / wrong band |
| FR-12 | Persist: URL, score, label, signals, user reason, timestamp | P1 | Needs datastore |
| FR-13 | Moderator / team review queue (internal) | P2 | |
| FR-14 | Export reviewed samples into training CSV pipeline | P2 | Retrain cadence |

### 6.4 API productization

| ID | Requirement | Priority | Notes |
|---|---|---|---|
| FR-15 | Publish OpenAPI (FastAPI auto-docs) | P1 | `/docs` |
| FR-16 | Separate train script from inference import path | P0 | Today `model.py` trains on import |
| FR-17 | Input validation / URL normalization | P1 | scheme, length, encoding |
| FR-18 | Structured error responses | P1 | 400/422/503 |
| FR-19 | Tighten CORS for production origins | P1 | Dev currently `*` |
| FR-20 | Optional API key / quota for public abuse control | P2 | |

---

## 7. Score interpretation (product contract)

Frontend **must** map `score` to these bands (from README; do not invent alternate thresholds without model revalidation):

| Range | Label | Meaning |
|---|---|---|
| 0–19 | SAFE | Strongly resembles legitimate URL/domain patterns |
| 20–39 | CLEAR | Mostly legitimate patterns; minor overlapping traits |
| 40–59 | UNCERTAIN | Weak evidence either way — caution, not “medium malware” |
| 60–79 | SUSPICIOUS | Resembles phishing patterns; inspect carefully |
| 80–100 | PHISHING | Strong multi-signal phishing resemblance |

Score semantics: **P(phishing | features)** × 100 from `RandomForestClassifier.predict_proba`, not “percent of page that is malicious.”

---

## 8. User journeys

### Journey A — Paste & check (MVP)

1. User opens site → sees brand + short explanation  
2. Pastes URL → submits  
3. Frontend calls `GET /analyze?url=...`  
4. UI shows score, band, signals, disclaimer  
5. Optional: report incorrect result  

### Journey B — Integrator

1. Developer reads API docs  
2. Calls `/analyze` from backend or browser  
3. Uses score/signals in their own UX  

### Journey C — Crowdsource improve (post-MVP)

1. User flags result  
2. Team reviews → labels confirmed  
3. Sample enters dataset → retrain → redeploy `model.pkl`

---

## 9. Non-functional requirements

| Area | Requirement |
|---|---|
| Privacy | Do not fetch destination page content; log URLs only as needed for abuse/ops with retention policy |
| Latency | Feature extract local; RDAP bounded (~3s thread join) |
| Availability | `/health` for Railway (or equivalent) probes |
| Security | Validate inputs; no SSRF to arbitrary page content; lock down CORS; secrets out of repo |
| Observability | Request logs, error rates, RDAP timeout rates, score distribution |
| Reproducibility | Fixed `random_state=42`; version model artifact + feature list |

---

## 10. Feature groups (model inputs)

Inference only uses features computable from a bare URL + RDAP (subset of `apidataset.csv` columns). Training selects features with `|corr(status)| > 0.1`.

Categories implemented in `extractFeatures()`:

1. **URL structure** — lengths, IP host, special-char counts, HTTPS flag, digit ratios  
2. **Subdomain / host shape** — subdomain count, TLD-in-subdomain, abnormal wwwN, hyphen prefix/suffix, shorteners  
3. **Word stats** — shortest/longest/avg word lengths across URL/host/path  
4. **Lexical phishing cues** — keywords (`login`, `verify`, …), suspicious TLDs  
5. **Registration** — `domain_age` (days) + `dns_record` presence via RDAP  

Excluded from live inference (present in dataset but not extractable without crawling): e.g. `google_index`, `page_rank`, hyperlink ratios, form/iframe flags.

---

## 11. MVP scope vs later phases

### Phase 0 — Stabilize backend (now)

- Treat `master` as release branch; reconcile empty `main`  
- Split train vs serve (`train.py` / `infer.py` or load-only path)  
- Load `model.pkl` without retraining on every boot  
- Document API contract  

### Phase 1 — Public site MVP

- Analyzer UI + landing + disclaimer  
- Deploy API + static/SSR frontend  
- Basic rate limiting  

### Phase 2 — Crowdsourcing loop

- Report endpoint + storage  
- Review tooling  
- Retrain playbook  

### Phase 3 — Distribution

- Browser extension / email helper calling same API  
- Team dashboards, API keys, higher SLAs  

---

## 12. Risks & open questions

| Risk / question | Impact | Mitigation |
|---|---|---|
| Retrain-on-import in `model.py` | Slow deploys, non-deterministic boot, heavy CPU | Load pickle only in API path |
| RDAP failures → `domain_age = -1` | Inflates suspicion signals | Cache, fallbacks, softer messaging |
| Structural-only model | Misses lookalike pages on aged domains | Product copy honesty + future content signals as optional module |
| Open CORS + unauthenticated API | Abuse / cost | Origin allowlist + rate limits |
| Dataset drift | Accuracy decay | Crowdsourcing + periodic eval set |
| Empty `main` vs populated `master` | Fork/clone confusion | Set default branch to `master` or merge |

---

## 13. Acceptance criteria (site MVP)

- [ ] User can analyze a URL and see score, band, and ≥1 signal string  
- [ ] Disclaimer states no page-content scanning  
- [ ] `/health` returns 200 in deployed environment  
- [ ] Inference path does not retrain the forest on startup  
- [ ] Score bands match the table in §7  
- [ ] Report-incorrect control exists (can be “collect only” stub)  

---

## 14. Out-of-repo dependencies (planned product)

Not in the current repository but required for the larger site:

- Frontend app (framework TBD — see `TECH_STACK.md`)  
- Managed hosting (README mentions Railway for API health)  
- Persistence for crowdsourcing (DB)  
- Optional CDN / analytics (privacy-preserving)
