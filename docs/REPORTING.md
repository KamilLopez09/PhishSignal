# Reporting misclassifications

If PhishSignal misclassifies a URL, users can report the issue on the website. That feedback identifies potential weaknesses, incorrect results, and what to improve. Phishing tactics keep changing, so work does not end when the model makes a prediction — we keep testing it, learning from mistakes, and making it more useful over time.

This is the reporting interface: two taps under each analyzed result. A tap is stored on this site and listed on the **History** page (Submitted reports). There is no remote report API; the hosted service only exposes `/health` and `/analyze`.

The header dropdown switches **Dashboard** (analyzer) and **History** (scans + reports). Settings was removed — it had no page.

## Where the taps appear

- **Confidence score** (the scale next to ANALYZE) — after a live result: optional note (string, 25 words max) plus **Looks right** / **Report issue**.
- **Recent Scans History** — the same taps under each URL entry (score + band).
- **History → Submitted reports** — the inbox for those taps.

A tap locks that URL and shows a short thank-you. The last verdict for a URL wins.

Reports stay in this browser (`localStorage` key `phishsignal.feedback.v1`) and are shown on History:

```json
{
  "url": "https://example.com/path",
  "score": 42,
  "band": "UNCERTAIN",
  "verdict": "misclassified",
  "note": "looks more like a login phish",
  "reportedAt": "2026-10-24T16:00:00.000Z"
}
```

`verdict` is `correct` or `misclassified`. Nothing is sent off-device.

## Hosted API

The UI defaults to the hosted FastAPI:

| Call | Purpose |
|---|---|
| `GET https://phishsignal.onrender.com/health` | Header live/mock chip; inactive banner only if down |
| `GET https://phishsignal.onrender.com/analyze?url=HERE` | `{ url, score, signals }` |

Override with `NEXT_PUBLIC_API_BASE_URL`:

| Value | Behavior |
|---|---|
| unset | Hosted Render API |
| `/backend` | Next rewrite to local FastAPI |
| `http://127.0.0.1:8000` | Direct local FastAPI |
| `mock` | Offline `mockAnalyze()` |

See [`FRONTEND.md`](./FRONTEND.md) for the analyze contract and local run steps.
