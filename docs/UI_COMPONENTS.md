# PhishSignal — UI Component Source Index

Catalog of **pre-existing third-party UI** used in `web/`, with canonical docs URLs, registry install URLs (where applicable), local paths, and where each piece is wired.

Use this file when reinstalling, restyling, or attributing components. File headers in the listed local paths also carry `@see` links back here.

---

## Product UI direction (GPTZero-aligned)

PhishSignal’s analyzer workspace follows a **GPTZero-style product shell** (see [gptzero.me](https://gptzero.me)): brand-first header, one primary detector canvas, calm secondary panels, progressive disclosure for details. Brand tokens: background `#a29144`, accent `#801929`, cards `#2a1518`.

| Principle | How it shows up |
|---|---|
| Brand first | Sticky `AppHeader` with **PhishSignal** wordmark |
| Verdict / input first | `AnalyzerCanvas` = Inspect + Confidence as one composition |
| Progressive disclosure | Morphing Dialog on overview metrics |
| Deliberate confirm | Hold Confirm on **ANALYZE** |
| Quiet secondary chrome | `ProductCard` for history, overview, flags (no scroll heroes) |

### Motion policy (keeps GodUI docs honest)

GodUI [Container Scroll](https://godui.design/docs/components/layout/container-scroll) is documented as a **single staple hero moment** for a product screenshot/demo — not a pattern for every panel. Applying it to every dashboard card fought PRD FR-7 (usable analyzer UI) and produced empty scroll voids.

| Motion | Where | Why |
|---|---|---|
| Container Scroll | **Once** — `AnalyzerCanvas` | Hero un-tilt for the detector workspace |
| Morphing Dialog | Scan Overview metric tiles | Details on demand (GPTZero progressive disclosure) |
| Hold Confirm | Inspect **ANALYZE** | Intentional confirm before scan |
| None (calm card) | Recent History, Overview shell, Flag Breakdown | Readable product density |

---

## Quick map (surface → source)

| Dashboard surface | Primary pre-existing UI | Docs URL |
|---|---|---|
| Brand header “PhishSignal” | Product-owned (`AppHeader`) — single wordmark, no tagline | — |
| Header nav | GodUI Dropdown Menu | https://godui.design/docs/components/navigation/dropdown-menu |
| Inspect address chrome | Uiverse grumpy-pug-86 | https://uiverse.io/arthur_6104/grumpy-pug-86 |
| Inspect **ANALYZE** | GodUI Hold Confirm Button | https://godui.design/docs/components/buttons/hold-confirm-button |
| Analyzer canvas (Inspect + Confidence) | GodUI Container Scroll (`size="card"`) | https://godui.design/docs/components/layout/container-scroll |
| Scan Overview metric tiles | GodUI Morphing Dialog | https://godui.design/docs/components/overlays/morphing-dialog |
| Secondary panels | `ProductCard` (calm shell) | — |
| Confidence / history donuts | Chakra Charts Donut (point labels) | https://chakra-ui.com/docs/charts/donut-chart#point-label |
| Card / button / input shells | shadcn/ui (new-york) | https://ui.shadcn.com/docs |

**Brand tokens:** background `#a29144` · accent `#801929` (`ps-mint` / `--ps-mint`) · cards `#2a1518`

---

## 1. GodUI

Open-source motion components (React + Tailwind + Framer Motion). Theme tokens live partly in `web/src/app/globals.css` (button scale vars); PhishSignal brand colors override GodUI defaults.

### 1.1 Container Scroll

| | |
|---|---|
| **Docs** | https://godui.design/docs/components/layout/container-scroll |
| **Registry** | https://godui.design/r/container-scroll.json |
| **Local** | `web/src/components/godui/container-scroll.tsx` |
| **Wrapper** | `web/src/components/DashboardScrollCard.tsx` (`ignoreReducedMotion` for demo browsers) |
| **Dependency** | `framer-motion` |
| **Usage** | **Single** scroll-linked 3D un-tilt around the analyzer canvas |

**GodUI intent (from upstream docs):** frame starts tilted, un-tilts / scales / settles as the section scrolls into view; headline rises — “the staple hero moment for a product screenshot or demo video.”

**PhishSignal adaptation:** `size="card"` uses **2D scale only** (no `rotateX` / `preserve-3d`) so Inspect controls receive pointer hits; sticky product-scale track (~36–42rem). `size="hero"` keeps the full 3D tilt for marketing pages.

**Scroll requirement:** the document/window must scroll. Nested `overflow: auto` ancestors break `useScroll`. `Dashboard` uses window scroll + sticky header.

**Reduced motion trap:** GodUI skips scroll physics when `prefers-reduced-motion: reduce` matches. `DashboardScrollCard` sets `ignoreReducedMotion` so the analyzer canvas still demos in Cursor Simple Browser. Pass `ignoreReducedMotion={false}` to honor OS preference.

**Wired in:**

| Component | Role |
|---|---|
| `web/src/components/AnalyzerCanvas.tsx` | **Only** Container Scroll consumer — Inspect + Confidence |
| `web/src/components/Dashboard.tsx` | Composes header, nav, canvas, calm secondary panels |

**Install (reference):**

```bash
npx shadcn@latest add https://godui.design/r/container-scroll.json
```

(If theme registry resolution fails, copy from the registry JSON `files[].content` into `components/godui/` as done in this repo.)

---

### 1.2 Hold Confirm Button

| | |
|---|---|
| **Docs** | https://godui.design/docs/components/buttons/hold-confirm-button |
| **Registry** | https://godui.design/r/hold-confirm-button.json |
| **Local** | `web/src/components/godui/hold-confirm-button.tsx` |
| **Dependency** | `framer-motion` |
| **CSS tokens** | `--button-py-*`, `--button-px-*`, `--button-text-*`, `--button-leading-*`, `--button-radius-*` in `web/src/app/globals.css` |
| **Usage** | Hold-to-confirm **ANALYZE** under the Inspect mini-browser |

**Wired in:** `web/src/components/InspectLink.tsx`  
**Labels:** idle `ANALYZE` · holding `Analyzing…` · confirmed `Done`  
**Variant:** `default` (accent `#801929` via `--primary` / `ps-mint` token name)

**Install (reference):**

```bash
npx shadcn@latest add https://godui.design/r/hold-confirm-button.json
```

---

### 1.3 Morphing Dialog

| | |
|---|---|
| **Docs** | https://godui.design/docs/components/overlays/morphing-dialog |
| **Registry** | https://godui.design/r/morphing-dialog.json |
| **Local** | `web/src/components/godui/morphing-dialog.tsx` |
| **Dependency** | `framer-motion` |
| **Usage** | Each Scan Overview sub-card morphs into a detail modal |

**Wired in:** `web/src/components/ScanOverview.tsx`  
**Triggers:** Total Scans · High-Risk URLs · Low-Risk URLs · Recent Warnings  
**Dismiss:** Escape, backdrop click, or close control

**Local note:** GodUI `z-modal` / `z-raised` utilities replaced with Tailwind `z-50` / `z-10` so the overlay works without the full GodUI theme package.

**Install (reference):**

```bash
npx shadcn@latest add https://godui.design/r/morphing-dialog.json
```

---

### 1.4 GodUI theme (partial)

| | |
|---|---|
| **Registry** | https://godui.design/r/godui-theme.json |
| **What we took** | Button spacing/radius CSS variables only |
| **Where** | `web/src/app/globals.css` (`:root` / `.dark`) |

Colors intentionally stay on PhishSignal tokens (`#a29144`, `#2a1518`, `#801929`, `#FFFFFF`) rather than Celestial Sapphire OKLCH defaults.

---

## 2. Uiverse.io

CSS/HTML element patterns adapted into PhishSignal classes (not installed as npm packages).

### 2.1 Header dropdown nav

| | |
|---|---|
| **Docs** | https://godui.design/docs/components/navigation/dropdown-menu |
| **Registry** | https://godui.design/r/dropdown-menu.json |
| **Local** | `web/src/components/godui/dropdown-menu.tsx` |
| **Wired in** | `web/src/components/AppHeader.tsx` |

**Usage:** Dashboard / Settings / History (+ API mode label). Replaces the old sidebar pill nav.

---

### 2.2 Inspect mini-browser (URL field)

| | |
|---|---|
| **Source** | https://uiverse.io/arthur_6104/grumpy-pug-86 |
| **Local CSS** | `.ps-browser` and descendants in `web/src/app/globals.css` |
| **Wired in** | `web/src/components/InspectLink.tsx` |

**Adaptation:** Tab labeled “PhishSignal”; address placeholder **Enter URL** (`mockDashboard.inspectPlaceholder`); Enter / ⋮ / ✰ submit; analyze also via GodUI Hold Confirm Button.

**Related (evaluated, not shipped):** https://uiverse.io/TimTrayler/orange-bat-25 (Google-style searchbar) — kept mini-browser instead.

---

## 3. Chakra UI Charts

| | |
|---|---|
| **Docs** | https://chakra-ui.com/docs/charts/donut-chart#point-label |
| **Packages** | `@chakra-ui/react`, `@chakra-ui/charts`, `recharts` |
| **Provider** | `web/src/components/providers.tsx` (`ChakraProvider`) |
| **Local** | `web/src/components/ScoreDonut.tsx` |

**Wired in:**

| Component | Purpose |
|---|---|
| `RecentScansHistory` | Latest scan score |
| `ResultsPanel` | Confidence score + band label |

**Brand colors:** accent `#801929` for score arc; muted remainder; center label shows integer score.

---

## 4. shadcn/ui

| | |
|---|---|
| **Docs** | https://ui.shadcn.com/docs |
| **Style** | `new-york` + Radix (CLI `shadcn@2.3`) |
| **Local** | `web/src/components/ui/*` |

| Primitive | Docs | Local file | Still used by |
|---|---|---|---|
| Card | https://ui.shadcn.com/docs/components/card | `ui/card.tsx` | Available; dashboard cards now primarily use Container Scroll frames |
| Button | https://ui.shadcn.com/docs/components/button | `ui/button.tsx` | Shared primitives / future forms |
| Input | https://ui.shadcn.com/docs/components/input | `ui/input.tsx` | Shared primitives |
| Badge | https://ui.shadcn.com/docs/components/badge | `ui/badge.tsx` | Shared primitives |
| Separator | https://ui.shadcn.com/docs/components/separator | `ui/separator.tsx` | Shared primitives |

Utility: `web/src/lib/utils.ts` (`cn` = `clsx` + `tailwind-merge`).

---

## 5. Icons & motion

| Library | Docs | Usage |
|---|---|---|
| Lucide React | https://lucide.dev | Header dropdown icons, `ScanOverview` metrics |
| Framer Motion | https://www.framer.com/motion/ | All GodUI components above |

---

## 6. Styling system (project-owned)

Not third-party components, but the tokens every imported UI is restyled against:

| Token | Value | Defined in |
|---|---|---|
| Background | `#a29144` | `web/src/lib/tokens.ts`, `globals.css`, Tailwind `ps.bg` |
| Card | `#2a1518` | same |
| Accent / primary (`ps-mint`) | `#801929` | same |
| Ink (page text) | `#1a1210` | `ps.ink` |
| White (on-card) | `#FFFFFF` | same |
| Font | Inter | `next/font` in app layout |

---

## 7. Component → URL checklist (for audits)

Copy/paste checklist when verifying attributions or reinstalling:

- [ ] https://godui.design/docs/components/layout/container-scroll → **AnalyzerCanvas only**  
- [ ] https://godui.design/r/container-scroll.json  
- [ ] https://godui.design/docs/components/buttons/hold-confirm-button → Inspect ANALYZE  
- [ ] https://godui.design/r/hold-confirm-button.json  
- [ ] https://godui.design/docs/components/overlays/morphing-dialog → Scan Overview sub-cards  
- [ ] https://godui.design/r/morphing-dialog.json  
- [ ] https://godui.design/r/godui-theme.json → button CSS vars only  
- [ ] https://uiverse.io/arthur_6104/grumpy-pug-86 → Inspect browser  
- [ ] https://chakra-ui.com/docs/charts/donut-chart#point-label → ScoreDonut  
- [ ] https://ui.shadcn.com/docs → `components/ui/*`  
- [ ] https://lucide.dev → icons  
- [ ] https://www.framer.com/motion/ → GodUI motion  
- [ ] https://godui.design/docs/components/navigation/dropdown-menu → header nav  
- [ ] https://godui.design/r/dropdown-menu.json  
- [ ] https://gptzero.me → product-shell reference (hierarchy only; not a code dependency)  



---

## 8. Related docs

| Doc | Path |
|---|---|
| Product requirements | `docs/PRD.md` |
| Tech stack | `docs/TECH_STACK.md` |
| Flows | `docs/FLOWS.md` |
