# Ethogram landing page — content and visual asset plan

## 1. The page's single job

Help a busy developer understand, within the first screen, that Ethogram tests whether an AI agent still behaves as intended after the system changes.

The visitor should leave the hero able to complete this sentence:

> Ethogram lets me describe a critical agent behavior, run the real agent, inspect what happened, and catch regressions before production.

The page is not primarily selling “AI evaluation.” It is establishing a more precise category:

> Behavioral development and testing for AI agents.

## 2. Cognitive design principles

1. **Outcome before ontology.** Explain the result before introducing `Story`, `Runner`, `ObservedRun`, `Evaluator`, or `EvaluationResult`.
2. **One example throughout.** Use a single concrete Story across the page instead of a new example in every section.
3. **One new idea per fold.** Each section answers the question created by the previous section.
4. **Show the mechanism.** Product evidence replaces decorative brand imagery.
5. **Progressive technical depth.** The page begins in plain language and becomes more technical as intent increases.
6. **Stable vocabulary.** Use `expected`, `observed`, `evidence`, `verdict`, `Story`, and `regression` consistently.
7. **No inflated promises.** Ethogram does not make probabilistic agents deterministic. It makes critical behavior explicit, observable, and testable.

## 3. Recommended story

### Narrative spine

```text
Agents change
    ↓
Critical behavior can change silently
    ↓
Turn that behavior into a versioned Story
    ↓
Run the real agent and keep the evidence
    ↓
Compare expected behavior with observed behavior
    ↓
Catch the regression in the developer workflow
    ↓
Change the agent with more confidence
```

The page should follow one illustrative Story, tentatively `support_refund_flow`, from definition to pull request. The example is concrete enough to understand without domain knowledge and exposes sequence, tool use, policy, and outcome.

## 4. Fold-by-fold content architecture

### Fold 01 — Immediate comprehension

**Question in the visitor's mind:** What is this, and why should I care?

**Message:** Test the critical behavior of AI agents before changes reach production.

**Content hierarchy:**

- Category eyebrow: `Behavioral development and testing for AI agents.`
- Outcome-led headline. Candidate territory: `Change your agent. Keep its critical behavior.`
- One-sentence explainer: define what should happen, run the real agent, and catch what changed.
- Primary action: `Start with Ethogram` or the install command.
- Secondary action: `See how it works`.
- Trust qualifier: open source and developer-native.

**Do not put in the hero:** the complete architecture, six feature cards, company claims, abstract AI language, a generic dashboard screenshot, or a decorative photograph.

**Visual proof:** a compact expected-vs-observed behavioral trace. One expected sequence remains stable while one observed event diverges. The visitor should understand “change detected” before reading its labels.

**Comprehension target:** five seconds.

---

### Fold 02 — Name the pain

**Question:** Why do normal tests and logs not already solve this?

**Message:** An agent can still return an acceptable answer while using the wrong tool, violating a policy, taking the wrong sequence, or relying on the wrong evidence.

**Content hierarchy:**

- Short assertion.
- A single before/after change scenario.
- The change surfaces: prompt, model, tools, code, knowledge, policy, runtime.
- Consequence: behavioral regression can remain invisible until production.

**Visual proof:** one stable horizontal behavior sequence, followed by the same sequence after a model or prompt change. Only the divergent step and affected profile edge use coral.

**Cognitive rule:** do not present seven equal feature tiles. The change surfaces are labels feeding one causal diagram.

---

### Fold 03 — Introduce the remedy

**Question:** What does Ethogram do about it?

**Message:** Ethogram turns a critical behavior into a versionable Story.

**Content hierarchy:**

- Plain-language definition: a Story records what should happen.
- Small real code fragment for `support_refund_flow`.
- Three highlighted expectations at most: required tool, required sequence, required outcome or policy.
- Repository context: the Story lives with the code and changes through version control.

**Visual proof:** a Story contract specimen with three annotations. It must resemble a real developer artifact, not a code-themed illustration.

**Terminology introduction:** this is the first place where `Story` becomes prominent.

---

### Fold 04 — Explain the mechanism in three verbs

**Question:** How does it work?

**Message:** Define. Run. Compare.

**Steps:**

1. Define expected behavior as a Story.
2. Execute the real agent and capture evidence.
3. Compare expected behavior, observed behavior, and the evaluation verdict.

**Visual proof:** the same Story moves through a continuous horizontal sequence on desktop. It becomes a vertical sequence on mobile. Avoid disconnected cards.

**Product architecture disclosure:** `Runner`, `ObservedRun`, and `EvaluationResult` can appear as secondary mono labels here, not as the primary explanation.

---

### Fold 05 — Demonstrate the product's core distinction

**Question:** How is this different from an eval score or observability tool?

**Message:** Expected behavior is not observed behavior. Observed behavior is not the verdict.

**Content hierarchy:**

- `Expected`: what the Story required.
- `Observed`: the evidence produced by the real run.
- `Verdict`: the evaluator's conclusion and reason.
- One failing comparison expanded to show the evidence path.

**Visual proof:** a three-layer comparison specimen. Never collapse the three concepts into a single score or a single red/green result.

**Differentiation copy:**

- Eval dashboards often foreground the score.
- Observability foregrounds what happened.
- Prompt playgrounds foreground experimentation.
- Ethogram keeps contract, evidence, and verdict separate and inspectable in a developer-native workflow.

This comparison should be stated calmly, without a hostile competitor matrix.

---

### Fold 06 — Show a regression, not a feature list

**Question:** What does Ethogram actually catch?

**Message:** A model, prompt, tool, policy, knowledge, code, or runtime change altered a behavior that mattered.

**Scenario:**

- Before: `support_refund_flow` verifies eligibility before issuing a refund.
- Change: model or prompt version changes.
- After: the refund tool is called before eligibility is confirmed.
- Ethogram result: the sequence divergence is tied to evidence and a precise verdict.

**Visual proof:** a short version series of behavioral profiles and event traces. The first divergent commit is marked; the entire interface does not turn coral.

**Reason to believe:** this is a real behavioral difference, not a vague quality score.

---

### Fold 07 — Put it in the developer workflow

**Question:** Will this fit how I already work?

**Message:** Run locally, keep Stories in the repository, and catch regressions in CI before merge.

**Content hierarchy:**

- Minimal CLI sequence.
- Repository file path.
- CI run.
- Pull-request verdict with a link to evidence.
- Provider-independent claim only if supported by the implementation.

**Visual proof:** one continuous strip from terminal to PR comment. Do not show a collage of unrelated product screenshots.

**Primary conversion action:** `npx ethogram init` with copy interaction.

---

### Fold 08 — Trust and final action

**Question:** Why should I try it now?

**Message:** Open source, inspectable, and built for developers who need evidence rather than magic.

**Content hierarchy:**

- Open-source repository and license.
- Documentation.
- Current maturity stated honestly.
- Final CTA to create the first Story.

**Visual proof:** no new illustration. Reuse the resolved Story signature and the terminal command. The ending should feel conclusive, not like another feature section.

## 5. Recommended navigation and page system

### Landing page navigation

- `Product` — returns to the mechanism.
- `How it works` — anchors to the three-step explanation.
- `Examples` — opens executable Story examples.
- `Docs` — installation and concepts.
- `GitHub` — repository.

Avoid creative labels in primary navigation. Novelty belongs in composition and interaction; wayfinding should remain obvious.

### Supporting pages

| Page | User job | Required content |
| --- | --- | --- |
| `/docs` | Install and succeed quickly | Quickstart, first Story, concepts, CLI reference |
| `/examples` | See whether Ethogram fits a real agent | Small runnable Stories by behavioral problem |
| `/why-ethogram` | Evaluate the category and differentiation | Expected vs observed vs verdict; comparison with adjacent tools |
| `/concepts/stories` | Understand the core abstraction | Story anatomy, versioning, expectations, evidence links |
| `/integrations` | Fit Ethogram into the stack | Runners, model/tool providers, CI patterns; only real integrations |
| `/changelog` | Assess activity and maturity | Releases, breaking changes, migration notes |

Do not create separate marketing pages for every feature. A capability earns a page only when it supports a distinct user intent or search intent.

## 6. Visual asset system

The product mechanism is the visual system. The LP should need no stock photography, 3D object, generative scene, or mark-as-photo-mask.

### Asset A01 — Hero behavioral comparison

**Purpose:** communicate the product in one glance.

**Form:** expected trace and observed trace sharing a time axis; one divergence; compact verdict annotation.

**Source:** new composition derived from Lab 03 `M04` failing edge, `M06` sampling, `T04` comparison hatching, and Lab 04 `X02` expected/observed toggle.

**Desktop:** expected and observed can coexist.

**Mobile:** use a two-state control or step sequence; do not squeeze two dense traces side by side.

**Motion:** 900ms entrance; evidence appears in a 90ms stagger; the divergent segment may pulse subtly. Reduced-motion version shows the final state immediately.

**Implementation/export:** semantic HTML/SVG or product data visualization; no raster export for the page. Static social version may export to PNG.

**Accessibility:** adjacent textual summary such as “Observed run called the refund tool before eligibility was confirmed.” Color cannot be the only distinction.

---

### Asset A02 — Change-surface causal rail

**Purpose:** show why regressions occur.

**Form:** labels for prompt, model, tools, code, knowledge, policy, and runtime feeding one observed behavior sequence.

**Source:** new asset using Lab 03 notation surfaces and left-origin movement.

**Desktop:** horizontal causal rail.

**Mobile:** a short vertically stepped list with the changed input pinned to the resulting divergence.

**Constraint:** no icon card grid and no neural-network nodes.

---

### Asset A03 — Story contract specimen

**Purpose:** make the remedy concrete.

**Form:** real YAML or TypeScript Story excerpt with three focused annotations.

**Source:** Lab 04 typography, inline code, Story query/field, expandable rows, and copy interaction.

**Desktop:** code and annotation can coexist.

**Mobile:** show only the essential lines, with annotations inserted in document order; offer `View full Story` rather than horizontal miniaturization.

**Accessibility:** code remains selectable text; annotations are not drawn into a bitmap.

---

### Asset A04 — Story-to-verdict execution spine

**Purpose:** teach the mechanism without three disconnected cards.

**Form:** one continuous sequence: Story → real run → evidence → comparison → verdict.

**Source:** Lab 03 `M03` scan, `M08` indeterminate execution, `M12` caret; Lab 04 `X03` run and `L03` mark as terminal cursor.

**Desktop:** horizontal sequence that is visible in one viewport where possible.

**Mobile:** vertical narrative with one stage per viewport and a small progress index.

**Motion:** the run indicator becomes the result instead of disappearing and being replaced by a new component.

---

### Asset A05 — Expected / observed / verdict comparator

**Purpose:** carry the main product differentiation.

**Form:** three explicitly separate layers with a shared expectation ID and evidence link.

**Source:** Lab 04 `X02`, `D01`, `D03`, `TP04`, and candidate aperture `A03` only where it helps compare data.

**Desktop:** three columns or layered panes.

**Mobile:** segmented states with persistent row identity and a concise summary below. Never reduce columns until they become illegible.

**Interaction:** selecting an expectation highlights the corresponding event and verdict. Expanded details appear without animated height.

**Accessibility:** keyboard selection, visible focus, state in text, and a linear reading order that remains meaningful without the visual layout.

---

### Asset A06 — Behavioral version series

**Purpose:** show regression over change, not generic analytics.

**Form:** a short sequence of run-specific behavioral profiles with one divergent version and first divergent commit.

**Source:** existing `profile-pass.svg`, `profile-fail.svg`, generative `profileFromScores`, Lab 03 `M10` stacking and `I03` time series, Lab 04 `L05` run-specific signature.

**Desktop:** profiles and commit labels share a baseline.

**Mobile:** scroll-snap or stepped sequence with a fixed version label; provide non-animated controls.

**Constraint:** profiles are data graphics, never alternative logos.

---

### Asset A07 — Developer workflow proof

**Purpose:** remove adoption anxiety.

**Form:** terminal command, repository Story path, CI result, and PR comment connected in sequence.

**Source:** Lab 04 copy, run, notice, verdict, code, and terminal specimens.

**Desktop:** one connected strip.

**Mobile:** terminal → CI → PR as three full-width steps; preserve readable code size.

**Interaction:** copy command, expand evidence, open docs/GitHub. Use in-flow feedback (`copied`) rather than floating toast.

---

### Asset A08 — State-aware brand details

**Purpose:** reinforce product state at small scale without adding decoration.

**Form:** institutional mark, run-specific profile, terminal cursor, and optional live favicon.

**Source:** existing mark/lockups/sprite/status profiles, Lab 04 `L03`, `L04`, `L05`, and `L10`.

**Constraint:** the institutional mark stays ivory/carbon. Moss and coral belong to run status or behavioral evidence, not the logo.

## 7. Asset inventory and production status

| Asset | Status | Action |
| --- | --- | --- |
| Institutional mark and lockups | Existing / canonical | Reuse from `/public/brand/ethogram` |
| Pass/fail profiles | Existing / canonical | Reuse only as run-result graphics |
| Generative behavioral profile | Existing / canonical base | Bind to real or realistic run data |
| Archivo and JetBrains Mono | Existing / canonical | Use local WOFF2 files |
| Hero behavior comparison | New | Design as a real explanatory component |
| Change-surface causal rail | New | Create from notation, not iconography |
| Story contract specimen | Derived | Adapt Lab 04 code/data primitives |
| Execution spine | New combination | Compose accepted Lab 03/04 motion rules |
| Expected/observed/verdict comparator | Derived + extended | Build from Lab 04 primitives; add responsive behavior |
| Behavioral version series | Derived | Use generative mark and Lab 03 time-series logic |
| Terminal-to-PR proof | New combination | Compose product-real UI fragments |
| Mobile-specific compositions | Missing | Design separately before implementation |
| Reduced-motion states | Missing | Produce for every animated asset |
| Social preview card | Missing | Derive from hero after LP direction is approved |

## 8. Existing Lab language to keep, constrain, or reject

### Keep

- Outline never filled.
- Sharp corners and 1px rules.
- Color only for state.
- Movement from the profile center or the left/time axis.
- `M01` measured mark entrance.
- `M03` scan during actual execution.
- `M04` pulse only the failing edge.
- `M06` evidence sampling.
- `M08` rectangular indeterminate progress.
- `M10` run variation and `I03` version series.
- `M12` step-end caret.
- Lab 04 expected/observed toggle, run transition, profile interaction, execution table, copy feedback, and in-flow notice.
- `TP01` only when the changing word has a reserved width and the rest of the sentence remains fixed.
- `TP04` only for a real textual diff.
- `L03`, `L04`, and `L05` as system behaviors.

### Constrain

- Ambient motion pauses off-screen and respects reduced motion.
- Noise remains below 1px and never touches text.
- Aperture `A03` is used only when it genuinely improves data comparison.
- Portal `P02` may inform a data window, but no photography appears inside the mark.
- Moss and coral communicate state, never visual variety.

### Reject

- Radar, halo, surveillance metaphors.
- Mark as a photo mask or decorative portal.
- Generic AI imagery.
- Floating cards, glass, gradients, glow, rounded containers, confetti, and ornamental dashboards.

## 9. Responsive art direction

### Desktop

- Comparison and causality can be simultaneous.
- Use asymmetric composition to pair assertion with evidence.
- Let technical proof occupy meaningful width; do not reduce it to decoration.
- A quiet section index may support progress, but navigation labels remain literal.

### Mobile

- One idea and one evidence state per viewport.
- Replace side-by-side comparison with controlled alternation while preserving item identity.
- Keep code at readable size and progressively disclose nonessential lines.
- Place the primary action in an easy thumb zone without permanently covering evidence.
- Minimum touch target: 44px.
- Motion is shorter and more selective; no ambient field competes with reading.

Mobile is a sequential explanation. Desktop is a comparative explanation.

## 10. Performance and export requirements

- Make text the LCP element; the hero explanation must not depend on video or a large raster.
- Prefer existing optimized SVG assets and code-native data components.
- Do not load 1024px mark PNGs in product UI.
- Set intrinsic dimensions for every SVG or image.
- Pause observers and ambient motion off-screen.
- Provide `prefers-reduced-motion` variants.
- Avoid preloading logos; only preload a font after measurement proves it helps.
- Static social preview: 1200×630 PNG/WebP, target under 250KB, plus editable source.
- Documentation/README header if needed: SVG preferred; PNG fallback under 180KB.
- Any generated raster asset must have desktop and mobile crops, but the current LP plan does not require a raster hero.

## 11. Accessibility and alt-text guidance

- Decorative institutional marks use empty alt text when the Ethogram name is adjacent.
- A standalone institutional mark uses `alt="Ethogram"`.
- Behavioral profiles must have a textual label or nearby summary of the relevant result.
- Complex evidence visuals need a concise visible summary and a linear DOM representation, not a long alt-text dump.
- Pass/fail/running must be written in text and cannot rely on color or favicon state.
- Animation never carries information that is unavailable in the final static state.
- Focus follows Lab 04: visible 2px moss outline, 2px offset, no glow.

## 12. Copy sequence to draft next

The final copy pass should produce, in this order:

1. one category line;
2. three hero headline territories;
3. one plain-language explainer;
4. the single `support_refund_flow` scenario;
5. one short explanation for each of Define, Run, Compare;
6. the expected/observed/verdict differentiation;
7. the developer-workflow proof copy;
8. trust and maturity statements;
9. primary and secondary CTA labels;
10. microcopy for copy, running, pass, fail, evidence, empty, retry, and reduced-motion states.

The visual design should not begin until this message hierarchy and the single running example are accepted. Visual exploration can then focus on composition rather than trying to repair an unclear story.
