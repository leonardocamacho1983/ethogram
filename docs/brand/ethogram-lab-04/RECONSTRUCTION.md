# Lab 04 reconstruction and extension contract

## What is actually different

The loose `ethogram-brand-spec.html` adds no new content: it is byte-for-byte identical to the file of the same name inside `Estratégia de marca exploratória (2).zip`.

The meaningful difference is between the ZIP as a whole, the brand spec and Lab 04:

| Artifact | Purpose | Language / theme | Portability | Content |
| --- | --- | --- | --- | --- |
| Exploration ZIP | Working archive and provenance | Mixed | Bundle of 62 files | Labs 01–04, identity explorations, strategy, landing explorations, screenshots, brand assets, fonts and Design Canvas runtimes |
| `ethogram-brand-spec.html` | Settled brand contract | English / light | One compiled self-contained document | Mark geometry, generator, colour, type, motion, interface, aperture, sizing and machine-readable tokens |
| Lab 04 | Interactive UI experiment | Portuguese / dark | Needs adjacent `support.js` and `image-slot.js` | 50 clickable interface, typography, motion, lockup and aperture experiments |

The brand spec tells us **what is canonical**. Lab 04 shows **how those rules feel in use**, including ideas that should be kept, constrained or cut.

## Source architecture

Lab 04 uses:

- `<x-dc>` and `DCLogic` as the component runtime;
- `{{ value }}` bindings, `sc-if`, `sc-for` and `sc-camel-*` attributes;
- `style-hover`, `style-active` and `style-focus` runtime attributes;
- a custom `<image-slot>` element for drag-and-drop images;
- `.image-slots.state.json` with the embedded portal-image state;
- one large inline view and one stateful component class;
- Google Fonts for Archivo, JetBrains Mono, Instrument Serif and the experimental Space Grotesk.

For the product implementation, preserve behavior and appearance but do not copy this architecture. Port it to normal React/Next components, CSS variables, semantic controls and the locally hosted fonts already at `public/brand/ethogram`.

Space Grotesk is not part of the canonical asset package. It appears only as a display-family comparison in TY03 and should remain an experiment unless it is explicitly promoted into the brand system.

## Canonical tokens

### Colour

- Carbon: `#0E1110`
- Ivory: `#F5F2EC`
- Moss: `oklch(0.76 0.16 150)` in the brand spec; Lab 04 uses slightly brighter state samples around `oklch(0.82 0.15 150)`
- Coral: `oklch(0.76 0.16 30)` in the brand spec; Lab 04 uses slightly brighter state samples around `oklch(0.84 0.14 30)`
- Moss and coral carry state only, never decoration.

The brand spec wins when values conflict. The brighter Lab values are exploratory and should be exposed only as candidate tokens until contrast testing settles them.

### Type

- Archivo: assertion, product UI and prose.
- JetBrains Mono: evidence, commands, labels and comparable numbers.
- Instrument Serif: covers and essays only, never core product UI.
- Negative tracking increases with display size and reaches zero around 14px.
- Emphasis uses weight 600 or a switch to mono, not italic.
- Comparable numbers use tabular mono.
- Prose measure: 34–62ch; balance titles and use pretty wrapping for prose.

### Shape and surface

- Radius: zero.
- Shadows and glow: none.
- Dividers: 1px hairlines.
- The mark is never filled, rotated, rounded or distorted.
- Nothing lives inside the mark below 80px.

### Motion and feedback

- Micro duration: 180ms.
- Primary easing: `cubic-bezier(.2,.8,.2,1)`.
- No bounce, elastic, spring or overshoot.
- Do not animate expandable height.
- Feedback is text, not celebration.
- Notifications stay in document flow; nothing floats over content.

### Interaction

- Focus: visible 2px moss outline with 2px offset and no glow.
- Minimum target: 36px desktop, 44px touch.
- One primary action per screen.
- Coral is reserved for failure and irreversible actions.

## Existing Lab 04 inventory

### 01 — Buttons

- B01 Primary: solid ivory; one primary per screen.
- B02 Secondary: transparent with border response.
- B03 Ghost and destructive.
- B04 Icon action and segmented group divided by 1px.

### 02 — Micro-interactions

- X01 Copy: label changes to `copiado` for 1.6s.
- X02 Layer toggle: expected vs observed, without fade.
- X03 Run: indeterminate progress, then the bar becomes the result.
- X04 Interactive profile: hover exposes one behavioral axis without a floating tooltip.
- X05 Expand: row details appear without animated height.
- X06 Selection and in-flow notice: saves selection and shows `seleção salva em .ethogram/config.toml` for 2.6s.

### 03 — Data components

- D01 Verdict and state badges: pass, fail, skipped, not run, critical, running and keyboard shortcut.
- D02 Story field/search with syntax-aware error.
- D03 Execution table with story, profile, divergent axis, first divergent commit and duration.

### 04 — Typography

- TY01 Optical scale and tracking.
- TY02 Archivo assertion vs JetBrains Mono evidence.
- TY03 Three display-family comparisons.
- TY04 Tabular numerals.
- TY05 Inline code in prose.
- TY06 Emphasis without italic.
- TY07 Measure and wrapping.
- TY08 Micro wordmark.
- TY09 Editorial cover lockup.

### 05 — Kinetic typography

- TP01 Swapping scoped word.
- TP02 One collapsing letter per axis.
- TP03 Command typewriter.
- TP04 Typographic diff.
- TP05 Verdict counter.
- TP06 Text scan.
- TP07 Breathing word through tracking.
- TP08 Drifting product vocabulary field.
- TP09 Continuous execution credits.

Lab decision: keep TP01, TP07 and TP08. TP03/TP04 are conditional on command or changelog context; TP05 only belongs to a real execution. Cut TP06 from the product language.

### 06 — Complete mark

- L01 Symbol inside/alongside the word.
- L02 Sequenced entrance.
- L03 Mark as terminal cursor.
- L04 Progressive reduction.
- L05 Run-specific signature.
- L06 Measured wordmark.
- L07 Health-state cycle.
- L08 Mark clipping texture.
- L09 Interactive wordmark/axis legend.
- L10 16px favicon and live pass/fail/running states.

Lab decision: L03, L04 and L05 are system-worthy. The polygon replacing the letter `o` is discarded until designed as a real glyph. The seal with the word inside the profile is cut for interface use.

### 07 — Aperture and portal

- A01 Trajectory inside the mark.
- A02 Evidence log inside the mark.
- A03 Execution matrix inside the mark.
- A04 Scan/loading state inside the mark.
- A05 Divergence band inside the mark.
- A06 Recursive profile.
- P01 Section-cover portal.
- P02 Agent window.
- P03 Triptych for post or documentation.

Lab decision: A03 and P02 solve real product problems and are the strongest candidates. The outline must always be redrawn over clipped content.

## State and behavior model

The original keeps one local state object:

```ts
type Lab04State = {
  copied: boolean;
  view: "expected" | "observed";
  running: boolean;
  done: boolean;
  open: Record<string, boolean>;
  axis: number;
  checks: { a: boolean; b: boolean; c: boolean };
  toast: boolean;
  tick: number;
};
```

In the product, split this state by component. Ambient motion should respect `prefers-reduced-motion`, pause when off-screen and never drive business state.

## Recommended React decomposition

```text
Lab04ReferencePage
├── LabHeader
├── ButtonSpecimens
├── InteractionSpecimens
│   ├── CopyCommand
│   ├── ObservationToggle
│   ├── RunButton
│   ├── InteractiveBehaviorProfile
│   ├── ExpandableStoryRows
│   └── StorySelection
├── DataSpecimens
│   ├── VerdictBadge
│   ├── StoryQueryField
│   └── ExecutionTable
├── TypeSpecimens
├── KineticTypeSpecimens
├── MarkSpecimens
├── ApertureSpecimens
└── LabDecisionSummary
```

Reusable product primitives should be extracted below the specimen page: `Button`, `SegmentedControl`, `VerdictBadge`, `BehaviorProfile`, `RunProgress`, `InlineNotice`, `ExecutionTable` and `StoryQueryField`.

## What still needs to be created

These are explicit gaps in Lab 04 and must not be mistaken for finished designs:

1. Long-table density and virtualization behavior.
2. Complete keyboard navigation and focus order.
3. Light theme for all product components.
4. A legible six-axis profile at 18px in a table row.
5. Error screens and empty states where the mark deliberately does not appear.
6. Reduced-motion variants for every ambient or kinetic specimen.
7. Responsive rules for narrow desktop and touch layouts.
8. Real loading, failure, retry and partial-result states wired to product data.
9. Accessible names, live-region strategy and contrast validation.
10. Extraction into the product design system after keep/cut decisions are approved.

## Extension protocol

Every new specimen should:

1. Receive a stable ID in `manifest.json`.
2. Declare its real product problem and state model.
3. Reuse canonical tokens; experimental values must be labeled candidate.
4. Include default, hover, active, focus, disabled, loading, error and reduced-motion behavior when applicable.
5. Include keyboard and touch acceptance criteria.
6. State whether it is `canonical`, `candidate`, `conditional`, `cut` or `pending`.
7. Add a screenshot only after behavior has been verified in the browser.

The Labs preserve exploration. The design system contains only accepted decisions.
