# PhishSignal — History Storage & Login Decisions

**Purpose:** Decide how to store past URLs and whether to add login, given the product goals in [`PRD.md`](./PRD.md).  
**Constraint:** Core analyze stays FastAPI `{ url, score, signals }` with **no Python changes** in this workstream.

---

## 1. Product goals that drive the decision

| Goal | Implication |
|---|---|
| Everyday user pastes a link before clicking (Persona 1) | **Zero login friction** for analyze |
| Show score + signals clearly (G2) | Live JSON → Confidence + Flag Breakdown (done) |
| Crowdsource FP/FN reports (G4) | Needs **identity later**, not for MVP paste |
| No page crawl / privacy (G3) | Prefer **local** history; avoid uploading browse trails by default |
| Rate-limit friendly UX (FR-10) | Client token-bucket + throttle (done); server limits later |

---

## 2. Decision summary

| Topic | Decision | When |
|---|---|---|
| Past URLs (MVP) | **Browser `localStorage`** (`phishsignal.history.v1`) | **Now** |
| Login for analyze | **Not required** | MVP |
| Accounts | **Optional**, post-MVP | After crowdsource / sync |
| Auth provider (later) | Supabase Auth or Clerk (email/OAuth) | Phase “Accounts” |
| Synced history (later) | Postgres `analyses` keyed by `user_id` | With accounts |
| Anonymous API abuse | Client limits now; **server token-bucket** later | Ops / Python |

**Rationale:** PhishSignal’s primary job is a fast, private “is this URL sketchy?” check. Forcing signup before ANALYZE fights Persona 1 and GPTZero-style detector UX. History still matters for Recent Scans / Overview — local persistence covers that without a backend identity system.

---

## 3. Past URL storage — how we go about it

### Now (shipped in `web/`)

```
ANALYZE → serialize input → gate (token bucket + throttle + single-flight)
        → GET /analyze JSON
        → Confidence (score) + Flag Breakdown (signals)
        → prependHistory() → localStorage
```

| Field stored | Source |
|---|---|
| `url`, `score`, `signals`, `band` | Analyze JSON + `bandFromScore` |
| `analyzedAt` | Client clock (ISO) |
| Cap | 40 entries / browser |

**Pros:** Works offline-ish for history UI, no PII server, no login.  
**Cons:** Not cross-device; cleared with site data; not usable for retrain (G4).

### Next (no login yet)

- History route listing full local list  
- Export JSON/CSV of local scans (user-owned)  
- Optional “clear history”

### Later (with accounts)

| Table (sketch) | Role |
|---|---|
| `users` | Auth identity |
| `analyses` | `user_id`, url, score, signals, created_at |
| `reports` | Crowdsource FP/FN (PRD FR-11+) |

Sync policy: **opt-in** “Save history to account” — default remains local-only for privacy.

---

## 4. Login system — how we go about it

### Do **not** gate ANALYZE behind login

Aligns with vision: consumer paste → score in seconds.

### Add login when one of these becomes true

1. Crowdsource reports need attribution / abuse control (G4)  
2. Users ask for cross-device history  
3. Team moderator queue needs staff auth (Persona 4)

### Recommended approach (when needed)

| Choice | Why |
|---|---|
| **Supabase Auth** (or Clerk) | Fast email/OAuth; pairs with Postgres for `analyses` / `reports` |
| Session on Next (SSR cookies) | Keep API keys off the browser for write endpoints |
| FastAPI stays score-only initially | Identity lives at the BFF / Supabase layer first |

**Staff vs end-user:** separate roles — public users optional account; maintainers use staff login for review queue.

### What login is **not** for (MVP)

- Not for calling `/analyze` (public, rate-limited)  
- Not for viewing a single result on the current device  

---

## 5. Rate limiting layers (current + future)

| Layer | Mechanism | Status |
|---|---|---|
| Input | `serializeUrlInput` — sanitize / parse | Done |
| Client gate | Token bucket (burst 5, ~1/3s) + 1.5s throttle + single-flight | Done |
| Edge / API | SlowAPI or reverse-proxy token bucket per IP | Future (Python/ops) |
| Authenticated | Higher quotas per `user_id` | With accounts |

---

## 6. Analyze → JSON UI contract (confirmed)

| UI | JSON field | Notes |
|---|---|---|
| Confidence donut + “API score” | `score` | Band via `lib/bands.ts` |
| Flag Breakdown | `signals[]` | 1:1 list, no invented trust/risk split |
| Recent History | `url` + `score` | Plus local timestamps |
| Scan Overview | Derived from local history | Demo placeholders until first analyzes |

---

## 7. Phased roadmap

| Phase | Work | Login? |
|---|---|---|
| **A** | Live `/analyze`, confidence + flags from JSON | No |
| **B** | Token bucket, throttle, input serialize | No |
| **C** | localStorage history + overview from history | No |
| **D** | History page, export, clear | No |
| **E** | Optional accounts + opt-in sync + report incorrect | Yes (optional) |
| **F** | Server rate limits + staff review queue | Staff yes |

---

## 8. Explicit non-goals

- Mandatory signup before analyze  
- Uploading every scanned URL to the server by default  
- Building a custom auth stack from scratch  
- Changing Python `/analyze` contract for identity in this phase
