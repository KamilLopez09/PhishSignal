# UI sources

Third-party UI used in `web/`. For install/attribution only.

| Piece | Source | Local |
|---|---|---|
| Container Scroll | [GodUI](https://godui.design/docs/components/layout/container-scroll) | `web/src/components/godui/container-scroll.tsx` → `AnalyzerCanvas` |
| Hold Confirm | [GodUI](https://godui.design/docs/components/buttons/hold-confirm-button) | `web/src/components/godui/hold-confirm-button.tsx` → Inspect ANALYZE |
| Morphing Dialog | [GodUI](https://godui.design/docs/components/overlays/morphing-dialog) | `web/src/components/godui/morphing-dialog.tsx` → Scan Overview |
| Dropdown Menu | [GodUI](https://godui.design/docs/components/navigation/dropdown-menu) | `web/src/components/godui/dropdown-menu.tsx` → header nav |
| Inspect browser chrome | [Uiverse grumpy-pug-86](https://uiverse.io/arthur_6104/grumpy-pug-86) | `.ps-browser` in `web/src/app/globals.css` |
| Score donut | [Chakra Charts](https://chakra-ui.com/docs/charts/donut-chart#point-label) | `web/src/components/ScoreDonut.tsx` |
| Card / button / input | [shadcn/ui](https://ui.shadcn.com/docs) | `web/src/components/ui/*` |
| Icons | [Lucide](https://lucide.dev) | header / overview |
| Motion | [Framer Motion](https://www.framer.com/motion/) | GodUI components |

Brand tokens: background `#a29144`, accent `#801929`, cards `#2a1518` (`web/src/lib/tokens.ts`, `globals.css`).
