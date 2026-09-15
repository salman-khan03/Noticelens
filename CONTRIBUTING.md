# Contributing

NoticeLens handles high-consequence legal information. Changes should preserve abstention, traceable evidence, privacy, and human review.

1. Create a focused branch and keep unrelated edits out of the change.
2. Add or update a test for user-visible behavior or a trust-boundary invariant.
3. Run the backend, frontend, build, and browser checks listed in `README.md`.
4. Never add real tenant documents, secrets, private URLs, or unreviewed legal assertions.
5. A new legal claim requires an official source snapshot, exact supporting passage, jurisdiction, retrieval timestamp, integrity hash, reviewed rule mapping, and adversarial fixtures.
6. A new jurisdiction requires a distinct reviewed corpus and policy version.

Pull requests should explain the user impact, evidence source, privacy impact, failure behavior, and verification performed. Legal-content changes require qualified legal review before production use.
