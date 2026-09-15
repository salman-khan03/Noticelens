# NoticeLens architecture

## Implemented path

Next.js App Router → same-origin API proxy → FastAPI → PyMuPDF / Tesseract → deterministic extraction → jurisdiction-scoped source selection → RulesProvider → Proof Gate → typed Analysis → evidence, timeline, draft, export.

The frontend uses TypeScript strict mode, Zod at the API boundary, Tailwind 4 and a shadcn-style Radix/CVA button primitive. The backend uses Pydantic contracts. Nothing depends on an account, paid service, or secret.

## Trust boundaries

1. Uploaded bytes are untrusted. File signatures, request byte limits, page limits, image pixel limits, and OCR timeouts constrain processing. No model instructions are executed from notice text.
2. Document facts are allegations extracted with narrow patterns. Dates retain original text and are never converted into enforceable deadlines.
3. Legal sources come exclusively from the source manifest. A candidate cannot make the server fetch an arbitrary URL.
4. General information has an exact claim, jurisdiction, rule ID, source ID, URL, supporting passage and retrieval time. The gate checks the source hash, source age, exact quote and exact approved mapping. Source hash checks detect accidental mutation, not a malicious repository maintainer.
5. Arbitrary paraphrases abstain. A real citation cannot make an unrelated statement pass. A known prohibition reversal returns CONTRADICTED. This is deliberately a closed-world verifier, not general natural-language entailment.
6. Applicability is never verified. A VERIFIED label means only that the **general-information statement** matches the curated source mapping. Qualified legal review of both corpus and case remains necessary.

## Status semantics

- VERIFIED: approved exact general claim/passage mapping passes all checks.
- UNVERIFIED: missing/fabricated/mismatched evidence or unrecognized claim wording.
- CONTRADICTED: explicitly registered contradiction against an intact source passage.
- HUMAN_REVIEW_REQUIRED: jurisdiction missing/unsupported or source old/corrupt.
- PARTIALLY_SUPPORTED: reserved in the contract; this implementation abstains rather than assigning partial semantic support.

No model confidence is fabricated; confidence is null. Citation coverage includes blocked candidates in its denominator. All analyses require human review. Metrics are recomputed for every request; synthetic benchmark results come from the evaluation runner, with date and scope disclosed.

## Storage and retrieval

The default corpus is three official statute section snapshots retrieved September 15, 2026. Sources are selected by classified notice type. This is a curated lookup, not vector search. The optional PostgreSQL migration defines jurisdiction-scoped full-text search and stores sources only. No Neon instance is provisioned or connected in this pass.

Tenant notices and results are held only for the request and in browser memory. No analytics, cookies, localStorage, or document database. FastAPI UploadFile can spool to a temporary file while parsing multipart uploads; it is closed after the request. Exported packets contain the user's notice text and should be treated as private. Frontend clear-session discards text/results from React state; it is not a secure-memory erasure guarantee.

## Extensibility

ClaimProvider is a protocol. A future remote provider can propose Pydantic Candidate records but cannot bypass Proof Gate. Add model consent, credential provisioning, structured-output validation, model timeouts and vendor retention review before enabling remote inference. Never present local rules as a live AI model.

For a new jurisdiction, add a separate reviewed source corpus, source selection policy, rules and adversarial fixtures. Do not simply add a state to the UI selector. Federal overlays and case applicability need their own review layer.

## Deployment boundary

Local demo is one process per service. The in-memory rate limiter is per-process; put a byte-limited reverse proxy and shared limiter ahead of a public service. PDF decoding is native code; isolate parsing in a resource-limited worker before accepting untrusted public uploads at scale. The local host configuration binds loopback only. A Docker backend includes Tesseract; Render/Vercel deployment instructions are in README. No service has been deployed.

## Design system

Reference: docs/design-concept.png. Forest green #173f35 rail, off-white #f6f5f0 canvas, muted sage evidence, orange blocked claims, Georgia headings, Arial controls, 4–7px radii, restrained borders, no raster UI. The generated mockup's unsupported legal copy is intentionally replaced with sourced wording and non-fabricated metrics. The actual workflow needs more vertical space to preserve qualifications and source details.
