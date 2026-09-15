# Verification record — September 15, 2026

## Functional checks

- 23 pytest tests passed: supported rules, unknown claims, invented URL, missing/foreign jurisdiction, exact-quote tampering, mismatched sources, stale/corrupt sources, real PDF upload, unknown notice, text injection, missing OCR recovery, rate limiting and cache headers.
- 2 Vitest contract tests passed.
- 4 Playwright scenarios passed across runs: full synthetic workflow and JSON download; mobile overflow; real PDF upload and corrupt-upload recovery; deposit contradiction and print-media evidence visibility.
- ESLint and strict TypeScript passed. Production Next.js build passed. Ruff passed.
- npm install/audit reported zero known vulnerabilities after upgrading Next.js to 16.3.5 and Vitest to 5.0.1.
- Evaluation: 6/6 engineered gate cases passed; three synthetic notices yielded 62.5% citation coverage. See the generated JSON for exact timestamps and measured latency. These numbers do not measure real-world accuracy.

An upload test initially used ambiguous text/alert locators (including Next.js's route announcer); locators were narrowed and the complete recovery test passed. Initial sandbox process-spawn failures were resolved by running the authorized local checks with the required process permissions. Backend tests emit upstream Starlette deprecation warnings and a sandbox cache-write warning; assertions pass.

## Browser and visual checks

Primary UI verification used the Codex in-app browser, not a Playwright fallback. The requested Playwright suite independently tested regressions. IAB exercised load sample → expand official evidence → challenge unsupported claim and observed UNVERIFIED. Browser screenshots were saved and inspected alongside the generated reference with `view_image`.

- Design reference: `design-concept.png`, 1536×1024.
- Desktop viewport requested: 1536×1024. `desktop.png` is the browser capture (scrollbar/chrome reduces usable area).
- Mobile viewport requested: 390×844. `mobile.png` and `mobile-evidence.png` show upload and populated evidence states. No horizontal overflow in the automated mobile check.

## Fidelity ledger

| Point | Reference | Implementation / disposition |
| --- | --- | --- |
| Palette | Forest rail, off-white canvas, sage evidence, orange caution | Preserved with shared CSS tokens. |
| Typography | Large serif heading, serif sections, sans-serif controls | Georgia/Arial system fonts; checked heading wrapping and control legibility on desktop/mobile. |
| Layout | Left navigation rail, top stepper, upload split with sample picker, adjacent evidence | Preserved on desktop; mobile converts to horizontal navigation and a single readable column. |
| Containers | Thin borders, modest radii, generous spacing | Shared panel/button styles; no placeholder raster interface. |
| Evidence interaction | Verified evidence visibly central | Real expandable source passages, retrieval time and integrity hash; blocked claim uses a distinct orange panel. |
| Dates | Document-stated date prominent | Added orange date callout; no calculated legal deadline or minimum-period badge. |
| Copy | Product name/tagline/navigation/print/upload | Preserved core copy. Legal content and numbers intentionally differ to comply with the user's evidence-first requirements. |
| Icons | Small outline legal/document/action symbols | Lucide outline icons; no fabricated Texas silhouette or decorative document thumbnail. |

Intentional deviations: the generated image contained unsupported §91.001 legal text and invented metrics. These were never shipped. Real statute qualifications, facts, source provenance, uncertainty notices and editable response require a longer page than the reference. The mock document thumbnail was replaced with actual extracted facts/text. Mobile hides the explanatory right panel to prioritize upload. Above-the-fold copy additions are the required Texas confirmation, synthetic designation, and accurate privacy/provider explanations; these support the requested workflow.

The implementation was visually verified against the reference's design language, with the above deliberate functional/content adaptations. It is not a pixel-identical copy of the generated mockup. No clipping or horizontal overflow remains in the checked viewports.

## Not validated here

No live model, Neon connection, public deployment, real Tesseract OCR run, attorney review or real-world accuracy study. Docker includes Tesseract, but the container was not built in this environment. Public traffic isolation, shared rate limiting and proxy upload limits remain deployment work.
