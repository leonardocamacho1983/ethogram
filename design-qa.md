# Design QA — Ethogram Product Interface

## Source visual truth

- Audit baseline, desktop: `docs/ui-ux/audit-2026-08-30/01-desktop-initial.png`
- Audit baseline, completed run: `docs/ui-ux/audit-2026-08-30/02-desktop-pass-evidence.png`
- Audit baseline, mobile: `docs/ui-ux/audit-2026-08-30/07-mobile.png`
- Product audit and intended direction: `docs/ui-ux/agentbook-interface-audit-2026-08-30.md`
- Implementation route: `http://localhost:3000/`

## Capture conditions

- Desktop viewport: 1440 × 900 CSS px, device scale factor normalized to 1.
- Tablet viewport: 1024 × 768 CSS px, device scale factor normalized to 1.
- Mobile viewport: 390 × 844 CSS px, device scale factor normalized to 1.
- Source and implementation captures use identical pixel and CSS dimensions at each compared viewport.
- State: dark theme; idle controlled execution for the canonical comparison, plus completed local-mock execution for behavioral validation.
- Browser-rendered implementation screenshots:
  - `docs/ui-ux/qa-2026-08-30/07-desktop-final.png`
  - `docs/ui-ux/qa-2026-08-30/06-desktop-pass.png`
  - `docs/ui-ux/qa-2026-08-30/04-tablet-final.png`
  - `docs/ui-ux/qa-2026-08-30/03-mobile-final.png`
- Combined comparison evidence:
  - `docs/ui-ux/qa-2026-08-30/03-comparison-desktop-final.jpg`
  - `docs/ui-ux/qa-2026-08-30/02-comparison-mobile-before-after.jpg`

## Findings

- P0: none.
- P1: none.
- P2: none.
- P3: syntax coloring could improve the Story code view, but wrapping, scrolling and copying now make it usable without changing the product's restrained visual language.

## Full-view comparison

The final desktop comparison shows an intentional information-architecture improvement while preserving the audited visual system. The Decision panel is now the first object in the Canvas, the empty observation state replaces four unavailable panels, and the expected/observed split remains visibly intact. Typography, border rhythm, carbon/ivory palette, local fonts, icon family and hard-edge component language remain coherent with the source.

The final mobile comparison shows a compact Story selector replacing the four-row navigation rail. The Decision panel enters the viewport materially earlier, horizontal overflow remains zero, and document height falls from approximately 2332 px in the audit capture to 1467 px in the final initial state.

Focused region comparison was needed for the Decision panel and mobile header because those areas carry the main hierarchy change. The combined comparison images above show both regions at equal dimensions. No separate image-asset crop was required: the interface contains no raster product imagery, and the supplied Ethogram vector mark remains unchanged.

## Required fidelity surfaces

- **Fonts and typography:** Archivo remains the display/UI face and JetBrains Mono remains reserved for evidence and metadata. Operational copy is 12–14 px; micro labels have a floor of 11 px; source text is 12 px; result explanation is 14 px. Line height, wrapping and truncation were verified in desktop and mobile captures.
- **Spacing and layout rhythm:** the existing 256 px rail, 60 px header, hard dividers and zero-radius language are preserved. Decision spans the working canvas; tablet collapses before configuration values become fragmented; mobile removes redundant Story description and source detail above the fold.
- **Colors and visual tokens:** carbon, ivory, moss, coral and ochre remain unchanged. Subtle text opacity increased from 42% to 58%, removing the prior low-contrast state while preserving hierarchy.
- **Image quality and assets:** no new imagery or synthetic assets were introduced. The supplied Ethogram mark and the existing Lucide icon set remain crisp and appropriate.
- **Copy and content:** prototype status is labeled as `local mock` or `controlled run`; Compare requires two distinct persisted runs; “Today” replaces the mixed-language “Hoje”; singular/plural tool-call copy is correct.

## Interaction and accessibility validation

- Search field filters Stories and the ⌘/Ctrl K shortcut focuses it.
- Run Story completes and renders verdict, reason, expectations, timeline and tool-call evidence.
- Tool-call JSON and Story source copy actions show confirmed feedback.
- Code wrapping works and exposes pressed state.
- Run CSV export executes only when persisted runs exist.
- Compare refuses to invent a second run and shows a truthful two-run empty state.
- Theme toggles and persists across reloads.
- Mobile Story selector, primary action and tabs are at least 44 px high; no horizontal overflow was observed at 390, 1024 or 1440 px.
- Focus styles remain visible.
- Browser warning/error log after final reload: empty.

## Comparison history

### Iteration 1

- Earlier findings: result appeared after setup; four empty evidence panels created noise; Compare duplicated a run and fabricated a red alternate state; visible controls were inert; subtle labels failed contrast; many touch targets were 38–42 px.
- Fixes: Decision-first Canvas, unified observation empty state, distinct-run requirement, real search/copy/export/wrap actions, persisted theme, increased contrast and 44 px target floor.
- Evidence: `docs/ui-ux/qa-2026-08-30/01-comparison-before-after.jpg`.

### Iteration 2

- Earlier findings: mobile navigation consumed four rows before the main task; document height was approximately 2332 px; tablet configuration values fragmented.
- Fixes: native mobile Story selector, compact mobile Story context, single-column tablet composition and two-column tablet configuration.
- Post-fix evidence: `docs/ui-ux/qa-2026-08-30/02-comparison-mobile-before-after.jpg` and `docs/ui-ux/qa-2026-08-30/04-tablet-final.png`.

### Iteration 3

- Earlier findings: remaining metadata below 11 px and unavailable prototype metrics still added noise.
- Fixes: 11 px minimum for micro labels, 12 px source copy, larger operational text, conditional metrics, corrected singular tool-call label and unavailable durations rendered as an em dash.
- Post-fix evidence: `docs/ui-ux/qa-2026-08-30/07-desktop-final.png` and `docs/ui-ux/qa-2026-08-30/06-desktop-pass.png`.

## Engineering verification

- `npm run typecheck`: passed.
- `npm run build`: passed. Existing webpack warning remains in `external-project-loader.server.ts` for dynamic `require` analysis.
- `tests/real-story-execution-ui.test.mjs`: 4/4 passed.
- Full `npm test`: 30 of 31 tests now pass; the remaining failure is unrelated to this interface change and expects the absent legacy file `app/workbench/page.tsx`.

## Implementation checklist

- [x] Decision is the first Canvas layer.
- [x] Empty, completed and error states remain distinct.
- [x] Compare uses only distinct persisted evidence.
- [x] Core visible controls are functional.
- [x] Typography, contrast and touch targets meet the revised interface floor.
- [x] Desktop, tablet, mobile, light/dark and completed-run states are browser-verified.
- [x] Build, typecheck and targeted execution UI tests pass.

final result: passed
