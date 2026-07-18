# PhishSignal Web

Next.js 14 analyzer UI for the PhishSignal API.

## Run

```bash
cd web
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

With `NEXT_PUBLIC_API_BASE_URL=/backend`, Next rewrites to FastAPI (`PHISHSIGNAL_API_PROXY`, default `http://127.0.0.1:8000`).

```bash
# repo root
.\.venv\Scripts\uvicorn.exe api:app --host 127.0.0.1 --port 8000
```

Without the env var, the UI uses offline `mockAnalyze()`.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Dev server |
| `npm test` | Vitest unit tests |
| `npm run build` | Production build |

## Docs

| Doc | Path |
|---|---|
| Frontend analysis | [`../docs/FRONTEND_ANALYSIS.md`](../docs/FRONTEND_ANALYSIS.md) |
| Backend integration | [`../docs/BACKEND_INTEGRATION.md`](../docs/BACKEND_INTEGRATION.md) |
| UI sources | [`../docs/UI_COMPONENTS.md`](../docs/UI_COMPONENTS.md) |
