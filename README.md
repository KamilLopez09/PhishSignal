# PhishSignal
### Developed by Kamil Lopez, Mahdi Murshed, Rayyan Rahman, & Rahidul Alam

PhishSignal is a website, API, and machine-learning-model that detects phishing URLs in real time. It's trained on 11,000+ labeled crowdsourced websites and analyzes dozens of structural and domain-level signals through features such as URL patterns, subdomain structure, domain age, and more in order to flag suspicious links before you click them.

## How it works
1. An inputted URL is submitted to the API
2. The API extracts 30+ features directly from the URL and a live domain-age lookup through various HTTPS requests.
3. A trained machine-learning model returns a phishing-risk score along with the specific signals that triggered it.

## Interpretation
The score PhishSignal returns is **NOT** a measurement of how "phishy" a website's content is, nor does it report the percentage of malicious material found on the page. PhishSignal doesn't scan page content at all: it never visits or renders the destination site.

Instead, the score represents the model's **confidence that the URL matches patterns typical of phishing websites** based entirely on:
- The structure of the URL itself (length, special characters, subdomains, keywords, etc.)
- The domain's registration data (how old it is, whether it has a public RDAP record)

The score should be treated as a **risk indicator to prompt closer inspection**: not a final judgment of safety.

### Score Ranges

| Range | Label | Meaning |
|---|---|---|
| **0–19** | **SAFE** | Strongly resembles legitimate URL structure and domain history. The model determines the website to be safe. |
| **20–39** | **CLEAR** | Generally resembles legitimate patterns, with a few minor traits also seen in some phishing examples. The model determines the websites to be cleared of any suspicion. |
| **40–59** | **UNCERTAIN** | The model does not have strong evidence either way. This range does not mean the website possess "medium risk": it means the URL doesn't clearly match either legitimate or phishing patterns in the training data. The model suggests you remain cautious when exploring it. |
| **60–79** | **SUSPICIOUS** | Resembles known phishing patterns: unusual structure, suspicious keywords, and/or limited domain history. The model determines the website to be suspicious and must be considered carefully.|
| **80–100** | **PHISHING** | Strongly resembles known phishing patterns across multiple signals at once. The model determines the website to be phishy and must be avoided. |

**NOTE**: Please keep in mind that an uncertain range between 40-59 indicates that the model is not confident in its scoring and may be ambivalent regarding the URL composition and/or domain history. 

## Crowdsourcing
Planned: users will flag incorrect results (false positives/negatives) to improve future training. Not shipped in the MVP UI.

## App (`web/`)

Next.js analyzer UI lives in [`web/`](web/). Local run:

```bash
# API (repo root) — loads model.pkl; set TRAIN_MODEL=1 only to retrain
.\.venv\Scripts\uvicorn.exe api:app --host 127.0.0.1 --port 8000

# Web
cd web
cp .env.example .env.local
npm run dev
```

## Docs

| Doc | Path |
|---|---|
| PRD | [`docs/PRD.md`](docs/PRD.md) |
| Tech stack | [`docs/TECH_STACK.md`](docs/TECH_STACK.md) |
| Backend integration | [`docs/BACKEND_INTEGRATION.md`](docs/BACKEND_INTEGRATION.md) |
| Frontend analysis | [`docs/FRONTEND_ANALYSIS.md`](docs/FRONTEND_ANALYSIS.md) |
| Flows | [`docs/FLOWS.md`](docs/FLOWS.md) |
| UI sources | [`docs/UI_COMPONENTS.md`](docs/UI_COMPONENTS.md) |
