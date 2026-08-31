# Ethogram Lab 04 — reconstruction kit

This folder preserves the executable Lab 04 reference and translates it into a reconstruction contract for the Agentbook product.

The source archive names the page `Ethogram Lab 04 Interface.dc.html`. The `.dc.html` suffix matters: this is a Design Canvas export, not a standalone conventional HTML page. It requires the adjacent `support.js`, `image-slot.js` and `.image-slots.state.json` files.

## Start here

- [`../../../app/lab/interface/lab-interface.tsx`](../../../app/lab/interface/lab-interface.tsx) — functional React reconstruction, available at `/lab/interface`.
- [`../../../components/ethogram/lab-primitives.tsx`](../../../components/ethogram/lab-primitives.tsx) — reusable mark, profile, specimen, button and verdict primitives.
- [`../../../design-qa.md`](../../../design-qa.md) — visual comparison history and final acceptance result.
- [`RECONSTRUCTION.md`](./RECONSTRUCTION.md) — human-readable comparison, component inventory, interaction contract and extension plan.
- [`manifest.json`](./manifest.json) — machine-readable source of truth for sections, components, tokens and pending work.
- [`screenshots/lab-04-overview.jpg`](./screenshots/lab-04-overview.jpg) — stable Lab 04 opening viewport.
- [`screenshots/brand-spec-overview.jpg`](./screenshots/brand-spec-overview.jpg) — stable canonical brand-spec opening viewport.
- [`screenshots/lab-04-full.jpg`](./screenshots/lab-04-full.jpg) and [`screenshots/brand-spec-full.jpg`](./screenshots/brand-spec-full.jpg) — long-form visual maps; animated regions can repeat during browser stitching, so use these for orientation rather than pixel comparison.
- [`reference/Ethogram Lab 04 Interface.dc.html`](./reference/Ethogram%20Lab%2004%20Interface.dc.html) — untouched executable source.
- [`reference/ethogram-brand-spec.html`](./reference/ethogram-brand-spec.html) — untouched canonical brand specification.

## Run the original locally

From `docs/brand/ethogram-lab-04/reference`:

```sh
python3 -m http.server 45219 --bind 127.0.0.1
```

Then open:

```text
http://127.0.0.1:45219/Ethogram%20Lab%2004%20Interface.dc.html
```

Do not open the file directly with `file://`: browser security and the local runtime can behave differently.

## Integrity

| File | SHA-256 |
| --- | --- |
| Lab 04 | `7f0bc7a017c58f8c9f2f3818dacfd90a2ee2a11d66b7dd56962152417277e0af` |
| Brand spec | `863cd385267714a8142f24dc6ad1f93ee6d7a758700403c36ad3e60da6bb17b7` |
| support.js | `8fe7df74405f3c55f49b7249c74ea1397e65d07dea2b1bd3b4a489bec2e28cbe` |
| image-slot.js | `fff26d081c8d9d60870f86c7539a5d179b9cdab15e67f2b205508a068e7c7ff6` |
| image-slot state | `4689db8cbfef6af72bb1dd06ae11d4e3c659dd2ee714fe3b2a7392852dc0b4c0` |

The loose `ethogram-brand-spec.html` supplied alongside the ZIP is byte-for-byte identical to the copy inside the archive.
