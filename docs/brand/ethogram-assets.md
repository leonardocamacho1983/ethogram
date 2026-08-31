# Ethogram brand assets

The canonical production assets live under [`public/brand/ethogram`](../../public/brand/ethogram). Browser entrypoints that must use conventional root URLs are mirrored directly under [`public`](../../public).

## Brand principle

The Ethogram mark is a six-axis behavioral profile on a 64-unit grid. Its short policy axis is the institutional signature.

Do not:

- fill the mark;
- rotate it;
- round its corners;
- recolor the institutional mark with status colors;
- use a mark smaller than 16 px.

Institutional colors:

| Token | Value | Use |
| --- | --- | --- |
| Carbon | `#0E1110` | dark surfaces and the mark on light backgrounds |
| Ivory | `#F5F2EC` | light surfaces and the mark on dark backgrounds |
| Moss | `#5FBF8B` | PASS or operational success only |
| Coral | `#E58C72` | FAIL or operational error only |

## Directory map

```text
public/
├── favicon.svg                  # theme-aware default browser icon
├── favicon-pass.svg             # optional live PASS state
├── favicon-fail.svg             # optional live FAIL state
├── favicon-running.svg          # optional live running state
├── favicon-16.png               # legacy fallback
├── favicon-32.png               # legacy fallback
├── favicon-48.png               # legacy fallback
├── apple-touch-icon.png         # iOS, 180×180
├── icon-192.png                 # web app manifest
├── icon-512.png                 # web app manifest
├── site.webmanifest
└── brand/ethogram/
    ├── marks/
    │   ├── mark.svg             # currentColor; preferred for UI
    │   ├── mark-carbon.svg      # fixed carbon
    │   ├── mark-ivory.svg       # fixed ivory
    │   └── mark-wide.svg        # wide profile variant
    ├── lockups/
    │   ├── lockup-horizontal.svg
    │   └── lockup-stacked.svg
    ├── status/
    │   ├── profile-pass.svg
    │   └── profile-fail.svg
    ├── favicons/                # preserved source variants
    ├── app-icons/               # preserved install icons
    ├── raster/
    │   ├── mark-carbon-1024.png
    │   └── mark-ivory-1024.png
    ├── generative/
    │   └── ethogram-mark.js
    ├── fonts/
    │   ├── archivo/             # UI: 400, 500 and 600
    │   ├── jetbrains-mono/      # evidence, code and numeric data
    │   └── instrument-serif/    # editorial only; never product UI
    ├── fonts.css                # optimized production declarations
    ├── fonts.source.css         # untouched supplied stylesheet
    └── sprite.svg
```

The old files already present in `public/` were not deleted. They can be removed in a separate cleanup after all consumers have migrated.

## Recommended use

### UI mark

Use the `currentColor` SVG and let the component control its color:

```tsx
<img
  src="/brand/ethogram/marks/mark.svg"
  alt=""
  width={24}
  height={24}
/>
```

When the mark appears next to the word “Ethogram”, it is decorative and should use empty alt text. When it appears by itself as the only brand identifier, use `alt="Ethogram"`.

Because an external SVG loaded through `<img>` does not inherit CSS `color` from the page, use `mark-carbon.svg` or `mark-ivory.svg` in that form. Use `mark.svg` through an inline SVG, sprite symbol, mask, or component when `currentColor` inheritance is required.

### Sprite

Available symbols:

- `eg-mark`
- `eg-mark-micro`
- `eg-wide`
- `eg-pass`
- `eg-fail`

```html
<svg width="24" height="24" aria-hidden="true">
  <use href="/brand/ethogram/sprite.svg#eg-mark-micro"></use>
</svg>
```

### Lockups

The SVG lockups use Archivo 600 as live `<text>`. If Archivo is not available, compose the symbol and wordmark in HTML or convert the wordmark to paths before distributing a standalone graphic.

- Horizontal lockup: headers, navigation, documentation covers.
- Stacked lockup: square or portrait compositions.
- Do not use lockups below the size at which the wordmark remains legible.

### Status profiles

`profile-pass.svg` and `profile-fail.svg` are data/status graphics, not alternative institutional logos. Use them only where the profile communicates a run result.

When the adjacent interface already says `Passed` or `Failed`, treat the profile as decorative. Otherwise, provide context such as `alt="Behavioral profile for a failed run"`.

### Generative mark

`/brand/ethogram/generative/ethogram-mark.js` is dependency-free ESM and exposes:

- `markPath(radii)`;
- `markClip(radii)`;
- `profileFromScores(scores)`;
- `strokeFor(px)`;
- `AXES` and institutional `MASTER` values.

Behavioral axes are `sequence`, `tools`, `policy`, `grounding`, `tone`, and `cost`. Clamp radii to the provided 8–24 range and keep the institutional `MASTER` profile unchanged for brand use.

## Scale and optical stroke

| Rendered size | Stroke width on the 64 grid |
| --- | --- |
| 16 px | 5.5 |
| 24 px | 4.8 |
| 48 px | 4 |
| 64 px and above | 3 |

The absolute minimum is 16 px. Prefer the wordmark when the mark would render smaller.

## Browser and app icons

Next metadata is configured in [`app/layout.tsx`](../../app/layout.tsx) to use:

- `/favicon.svg` with `/favicon-32.png` and `/favicon-16.png` fallbacks;
- `/apple-touch-icon.png`;
- `/site.webmanifest`;
- Carbon and Ivory theme colors.

The root production copy of `favicon.svg` includes the missing theme-aware stroke rule so it remains visible in both light and dark browser chrome. The untouched supplied source is retained at `public/brand/ethogram/favicons/favicon.svg`.

Optional live favicon behavior:

```js
const favicon = document.querySelector('link[rel="icon"]')
if (favicon) favicon.href = '/favicon-running.svg'
```

Only use a live favicon when the state is also communicated inside the page. The tab icon cannot be the sole status signal.

## Performance guidance

- Prefer SVG marks and lockups for UI and documentation.
- Favicons and install icons are already small enough for their intended surfaces.
- The 1024 px PNG marks are for raster-only exports, social artwork, or platforms that reject SVG; do not load them into ordinary UI.
- Always set intrinsic `width` and `height` to avoid layout shift.
- Do not preload logos unless they are proven to be a render-blocking above-the-fold asset.

Current source asset sizes are modest: SVG and small icon files are under a few kilobytes each, `icon-512.png` is approximately 16 KB, and each 1024 px raster mark is approximately 44 KB.

## Typography

All three supplied families use the SIL Open Font License 1.1. Their license files are stored beside the corresponding font files and must remain there when redistributed.

| Family | Product role | Allowed use |
| --- | --- | --- |
| Archivo | headings, prose and interface | Product default. Use weights 400, 500 and 600. |
| JetBrains Mono | evidence, code, logs, paths, IDs and numeric data | Product monospace. |
| Instrument Serif | covers and long-form editorial essays | Never use in product UI. |

The Next app loads `/brand/ethogram/fonts.css`, uses Archivo as `--eg-sans`, and maps JetBrains Mono to `--eg-mono`. The production stylesheet prefers the three static Archivo WOFF2 files instead of the supplied 658 KB variable TTF. The original stylesheet and variable font remain preserved for future editorial or width-axis work.

The CLI runtime bundles the same product subset: Archivo 400/500/600 and variable JetBrains Mono. Instrument Serif is intentionally not bundled into the CLI. Font files are served from an explicit allowlist under `/fonts/`.

Performance notes:

- `font-display: swap` is enabled for every face.
- No font is preloaded by default; add preload only after measuring a critical rendering benefit.
- Archivo 700 is intentionally unavailable. Use 600 for strong emphasis.
- Instrument Serif declarations do not trigger a download unless the family is actually used.
- Future subsetting should retain the license and cover the characters used by product copy.
