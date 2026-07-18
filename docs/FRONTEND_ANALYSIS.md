# PhishSignal Frontend Analysis

**Scope:** `web/` (Next.js analyzer)  
**Stack:** Next.js 14 App Router · React 18 · Tailwind 3 · Framer Motion · Chakra Charts

---

## 1. Workspace

1. Brand header (`PhishSignal`) + GodUI dropdown nav  
2. **AnalyzerCanvas** — Inspect URL + Confidence (one Container Scroll)  
3. Secondary panels — Recent History, Scan Overview, Flag Breakdown  

UI inventory: [`UI_COMPONENTS.md`](./UI_COMPONENTS.md).

---

## 2. Source map (`web/src`)

```
app/
  layout.tsx / page.tsx / globals.css
components/
  Dashboard.tsx           serialize → gate → API → panels
  AnalyzerCanvas.tsx      Inspect + Results
  InspectLink.tsx         URL + CSV samples + Hold Confirm ANALYZE
  ResultsPanel.tsx / FlagBreakdown.tsx / ScanOverview.tsx
  RecentScansHistory.tsx / AppHeader.tsx / ProductCard.tsx
  godui/*                 Hold Confirm, Morphing Dialog, Container Scroll
lib/
  types.ts / bands.ts / api.ts / url-input.ts
  analyze-gate.ts / token-bucket.ts / history-store.ts
  mock-dashboard.ts / fixtures/csv-urls.* / utils.ts / tokens.ts
```

---

## 3. Analyze path

```
InspectLink → Dashboard.onAnalyze
  → serializeUrlInput
  → AnalyzeGate (single-flight + throttle + token bucket)
  → analyzeUrl (/backend) or mockAnalyze
  → toScanResult → Results + Flags + localStorage history
```

---

## 4. Commenting standard

- File header: one purpose line + `@see` when useful  
- Lib modules document contract (API / gate / storage)  
- Avoid narrating obvious JSX  

---

## 5. Debt (non-blocking)

1. App Router routes for Settings / History (nav stubs)  
2. Crowdsource “report incorrect” flow (PRD)  
3. Optional POST `/analyze` for very long URLs  
