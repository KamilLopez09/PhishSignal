# PhishSignal — System Flowcharts

Mermaid diagrams for the as-built API/ML path and the larger phishing-detector site. Render in any Mermaid-capable viewer (GitHub, VS Code, etc.).

---

## 1. As-built request flow (`GET /analyze`)

```mermaid
flowchart TD
  A[Client / future website] -->|GET /analyze?url=| B[FastAPI api.py]
  B --> C[analyze url in model.py]
  C --> D[extractFeatures]
  D --> E[Parse host / path / words]
  D --> F[Structural + lexical signals]
  D --> G{Domain age cache hit?}
  G -->|yes| H[Use cached age]
  G -->|no| I[RDAP lookup rdap.org]
  I --> J{Success within 3s?}
  J -->|yes| K[age = days since registration]
  J -->|no| L[age = -1 / dns_record = 0]
  H --> M[Feature vector aligned to selectedFeatures]
  K --> M
  L --> M
  M --> N[StandardScaler.transform]
  N --> O[RandomForest.predict_proba]
  O --> P[score = round P_phish * 100]
  P --> Q[Attach human-readable signals]
  Q --> R[JSON: url, score, signals]
  R --> A
```

---

## 2. As-built module boot path (important)

Today, importing `model.py` (which `api.py` does) runs training before serving.

```mermaid
flowchart TD
  A[uvicorn starts api:app] --> B[import model]
  B --> C[Load apidataset.csv]
  C --> D[Map status phishing/legitimate]
  D --> E[Correlation filter abs r greater than 0.1]
  E --> F[train_test_split 75/25]
  F --> G[StandardScaler fit]
  G --> H[RandomForest fit n_estimators=200]
  H --> I[pickle.dump model.pkl]
  I --> J[pickle.load model.pkl]
  J --> K[API ready: analyze + health]
```

**Product implication:** production should **load** `model.pkl` only; training belongs in an offline `train.py` job (see PRD Phase 0).

---

## 3. Feature extraction detail

```mermaid
flowchart LR
  U[Raw URL string] --> H[Hostname]
  U --> P[Path]
  U --> W[Word tokens]
  H --> S1[IP? hyphens? subdomains? shortener?]
  U --> S2[Lengths chars HTTPS digits keywords TLD]
  W --> S3[Shortest / longest / avg word stats]
  H --> R[RDAP domain age]
  S1 --> V[features dict]
  S2 --> V
  S3 --> V
  R --> V
  S1 --> SIG[signals list]
  S2 --> SIG
  R --> SIG
  V --> M[Model vector]
  SIG --> OUT[API response]
  M --> OUT
```

---

## 4. Score → UI label mapping (frontend responsibility)

```mermaid
flowchart TD
  S[score 0-100] --> A{score}
  A -->|0-19| L1[SAFE]
  A -->|20-39| L2[CLEAR]
  A -->|40-59| L3[UNCERTAIN]
  A -->|60-79| L4[SUSPICIOUS]
  A -->|80-100| L5[PHISHING]
  L1 --> UI[Website renders band + signals + disclaimer]
  L2 --> UI
  L3 --> UI
  L4 --> UI
  L5 --> UI
```

---

## 5. Target site architecture (larger product)

```mermaid
flowchart TB
  subgraph clients [Clients]
    WEB[Web analyzer UI]
    EXT[Browser extension later]
    INT[Third-party integrators]
  end

  subgraph edge [Edge]
    CDN[CDN / WAF / rate limits]
  end

  subgraph app [Application]
    FE[Frontend Next.js or Vite]
    API[FastAPI serve-only]
    FB[Feedback / reports API]
  end

  subgraph data [Data]
    PKL[model.pkl versioned]
    PG[(Postgres reports)]
    CACHE[(RDAP / result cache)]
  end

  subgraph mlops [MLOps]
    TRAIN[Offline train.py]
    REV[Human review queue]
  end

  WEB --> CDN
  EXT --> CDN
  INT --> CDN
  CDN --> FE
  CDN --> API
  CDN --> FB
  FE --> API
  FE --> FB
  API --> PKL
  API --> CACHE
  FB --> PG
  PG --> REV
  REV --> TRAIN
  TRAIN --> PKL
```

---

## 6. Crowdsourcing improvement loop (planned)

```mermaid
sequenceDiagram
  participant U as User
  participant FE as Website
  participant API as Analyze API
  participant FB as Reports API
  participant DB as Database
  participant T as Team
  participant ML as Train job

  U->>FE: Paste URL
  FE->>API: POST/GET analyze
  API-->>FE: score + signals
  FE-->>U: Show band + explanation
  U->>FE: Report incorrect
  FE->>FB: Submit report
  FB->>DB: Store URL, score, reason
  T->>DB: Review FP/FN
  T->>ML: Export confirmed labels
  ML->>ML: Retrain RandomForest
  ML-->>API: Publish new model.pkl
```

---

## 7. Health probe

```mermaid
flowchart LR
  H[Probe client] -->|GET /health| A[FastAPI]
  A --> R["{ status: ok }"]
  R --> H
  H -->|healthy| T[Process ok]
  H -->|fail| R2[Restart / alert]
```

---

## 8. Component ownership map

| Component | Owner file / layer | Exists today? |
|---|---|---|
| HTTP routes | `api.py` | Yes |
| Feature extract + analyze | `model.py` | Yes |
| Trained artifact | `model.pkl` | Yes |
| Dataset | `apidataset.csv` | Yes |
| Website UI | `web/` | Yes — Next.js analyzer |
| Reports API + DB | *(not in repo)* | No — planned |
| Offline train | `TRAIN_MODEL=1` / `train_and_save()` | Yes — optional; serve uses `model.pkl` |
