# PhishSignal Web

Next.js analyzer UI for the PhishSignal API.

```bash
cd web
cp .env.example .env.local   # unset → hosted API; /backend for local FastAPI
npm install
npm run dev
```

Unset env calls `https://phishsignal.onrender.com/health` and `/analyze?url=`. For a local API, see [`../docs/FRONTEND.md`](../docs/FRONTEND.md).

| Command | Purpose |
|---|---|
| `npm run dev` | Dev server |
| `npm test` | Vitest |
| `npm run build` | Production build |
