# Design QA — Ethogram Lab 04 Interface

## Source of truth

- Executable reference: `docs/brand/ethogram-lab-04/reference/Ethogram Lab 04 Interface.dc.html`
- Canonical brand specification: `docs/brand/ethogram-lab-04/reference/ethogram-brand-spec.html`
- Reference capture: `docs/brand/ethogram-lab-04/screenshots/source-lab-04-overview-final.jpg`
- Implemented route: `http://127.0.0.1:3000/lab/interface`

## Capture conditions

- Browser viewport: 1024 × 576 CSS px
- Device pixel ratio reported by the in-app browser: 2.5
- Top captures: 1024 × 576 px
- Full-page captures: the in-app browser exports at 0.8 scale; CSS coordinates are used for layout comparison instead of raw bitmap coordinates
- State: production build, default state, motion enabled
- Implementation captures:
  - `docs/brand/ethogram-lab-04/screenshots/react-lab-04-handoff-top.jpg`
  - `docs/brand/ethogram-lab-04/screenshots/react-lab-04-handoff-full.jpg`

## Coverage

- 50/50 specimens implemented across Buttons, Micro-interactions, Data components, Typography, Kinetic typography, Full brand, Aperture and Portal
- Real Ethogram SVG marks, supplied local fonts and the source portal image are used
- Core interactions verified: copy feedback, expected/observed toggle, expandable data row, checklist/notice, query input and run lifecycle
- No horizontal overflow at the desktop reference viewport
- Production build and TypeScript checks pass

## Full-view comparison

| Anchor | Source y | Implementation y | Delta |
| --- | ---: | ---: | ---: |
| Buttons | 503 | 497 | -6 |
| Micro-interactions | 917 | 931 | +14 |
| Data components | 1687 | 1701 | +14 |
| Typography | 2435 | 2449 | +14 |
| Kinetic typography | 4451 | 4465 | +14 |
| Full brand | 6145 | 6145 | 0 |
| Aperture | 8203 | 8242 | +39 |
| Portal | 9124 | 9168 | +44 |

Reference height is 11,015 CSS px. The remaining end-of-page difference is lower-priority whitespace and does not alter specimen order, density, content, or hierarchy.

## Focused evidence and iteration history

- Opening and hero: `docs/brand/ethogram-lab-04/screenshots/qa-acceptance-top.jpg`
  - First pass made the hero too wide and collapsed the title into one line. Fixed with the original two-column composition, line break and rules.
- Buttons: `docs/brand/ethogram-lab-04/screenshots/qa-acceptance-buttons.jpg`
  - First pass wrapped the specimen grid and used mismatched icon/padding density. Fixed to preserve four columns at the reference viewport and to use the supplied mark.
- Typography: `docs/brand/ethogram-lab-04/screenshots/qa-acceptance-typography.jpg`
  - TY01 incorrectly spanned the full width. Fixed to restore the 55/45 composition and label rail.
- Aperture: `docs/brand/ethogram-lab-04/screenshots/qa-acceptance-aperture.jpg`
  - A02–A05 lost the canonical contour over clipped evidence. Fixed with the shared generated-profile primitive, keeping the outline visible over every crop.
- Portal:
  - Restored the canonical intro, P01–P03 annotations, triptych labels and decision row after the first pass was too short.
- TP02 kinetic wordmark:
  - Replaced the first-pass single-letter, 2.7 s approximation with the source choreography: all eight letters animate on a 4.2 s cycle, the ivory letters are staggered by 120 ms after a 1.6 s offset, the coral `g` runs at zero offset, and every glyph bottoms at `scaleY(0.58)` from its baseline.
  - Browser sampling observed `scaleY(0.58)` on every letter, the expected 4.2 s duration, the exact per-letter delays and no console warnings or errors.
- Kinetic typography TP01–TP09:
  - Rebuilt from `kinetic-type-spec.md` around one 110 ms React clock for TP01, TP03, TP04 and TP05; the clock is isolated inside the kinetic section so the rest of the Lab does not rerender.
  - TP06, TP07, TP08 and TP09 now use the documented 4.6 s, 5.2 s, 42 s and 24 s CSS cycles. TP08 contains seven vocabulary rows and TP09 contains 12 duplicated stories for a seamless 24-row loop.
  - At 1024 × 576, TP01 differs from the executable source by 6 px in top position and 6 px in height; TP02 starts 12 px earlier. TP08, TP09 and the three verdict notes match the source dimensions and document positions.
  - Reduced-motion mode stops decorative CSS animation and renders final deterministic states for the shared-clock experiments.
  - TP01 now reserves space with an invisible, real-font `trajectories` sizing layer instead of relying on an approximate `ch` width. Across all five words, Browser measurement reported a constant 223.844 px word slot and a constant 344.269 px starting x-coordinate for `shouldn't` (0 px layout shift).

## Surface review

- Fonts: supplied Archivo, JetBrains Mono and Instrument Serif files are loaded locally and mapped to display, UI and mono roles.
- Layout and spacing: section order, column ratios, specimen cadence, hard edges and divider rhythm match the source.
- Color: carbon, ivory, moss and coral are used consistently; no decorative gradients, glow or soft shadow language was introduced.
- Assets and icons: supplied logo files and the real portal image are used; interface icons come from the project icon library.
- Copy and microcopy: specimen identifiers, labels, notes, status language and interaction feedback are preserved.
- Behavior and accessibility: visible focus, reduced-motion handling, semantic buttons/inputs and mobile touch targets of at least 44 px are present.
- Responsiveness: responsive rules were code-reviewed. The in-app browser has a 1024 px minimum viewport, so a sub-1024 visual capture remains a P3 test gap; it is not a blocker for this desktop reference reconstruction.

## Open findings

- P0: none
- P1: none
- P2: none
- P3: dedicated narrow-viewport visual capture could be added when a browser without the current minimum-width constraint is available

## Final result

passed
