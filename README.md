# PhishSignal
### Developed by Kamil Lopez, Mahdi Murshed, Rayyan Rahman, & Rahidul Alam

PhishSignal detects phishing URLs in real time from URL structure and domain registration data — not page content. Trained on 11,000+ labeled URLs; the API returns a risk score plus the signals that drove it.

Upstream API/ML: [theoneandonlyrahi/PhishSignal](https://github.com/theoneandonlyrahi/PhishSignal). This fork adds a Next.js analyzer in `web/`.

## How it works
1. A URL is submitted to the API
2. The API extracts 30+ features from the URL plus a live domain-age lookup (RDAP)
3. A trained model returns a phishing-risk score and the signals that triggered it

## Interpretation
The score is **not** a measure of malicious page content. PhishSignal never visits or renders the destination site. It reflects model confidence that the URL matches phishing patterns (structure + registration data). Treat it as a **risk indicator**, not a final safety judgment.

### Score ranges

| Range | Label | Meaning |
|---|---|---|
| **0–19** | **SAFE** | Strongly resembles legitimate URL structure and domain history |
| **20–39** | **CLEAR** | Mostly legitimate patterns; minor overlapping traits |
| **40–59** | **UNCERTAIN** | Weak evidence either way — caution, not “medium risk” |
| **60–79** | **SUSPICIOUS** | Resembles phishing patterns; inspect carefully |
| **80–100** | **PHISHING** | Strong multi-signal phishing resemblance |

## Quick start

```bash
# API (repo root) — loads model.pkl; set TRAIN_MODEL=1 only to retrain
python -m venv .venv
.\.venv\Scripts\pip.exe install -r requirements.txt
.\.venv\Scripts\uvicorn.exe api:app --host 127.0.0.1 --port 8000

# Web
cd web
cp .env.example .env.local   # NEXT_PUBLIC_API_BASE_URL=/backend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Without the env var, the UI uses offline mock data.

## Docs

| Doc | Path |
|---|---|
| Frontend ↔ API integration | [`docs/FRONTEND.md`](docs/FRONTEND.md) |
| UI component sources | [`docs/UI_SOURCES.md`](docs/UI_SOURCES.md) |
