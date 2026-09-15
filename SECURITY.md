# Security policy

## Supported versions

This hackathon prototype supports only the latest commit on the default branch. It has not completed a production security assessment and should not process real tenant notices on a public deployment.

## Reporting a vulnerability

Do not open a public issue for vulnerabilities or include tenant documents, credentials, personal data, or exploit details in an issue. Use GitHub's private vulnerability reporting for this repository when enabled. Maintainers should acknowledge a report within three business days and publish a remediation timeline after triage.

## Security boundaries

- Uploaded documents are untrusted data, capped at 10 MB and 10 PDF pages.
- The default runtime makes no model call and stores no notice in a database.
- Candidate citations cannot trigger arbitrary URL retrieval.
- A `VERIFIED` label covers only an approved general-information claim/passage mapping.
- Public deployment requires parser isolation, shared rate limiting, malware scanning, retention controls, incident logging, and a privacy/security review.

See `ARCHITECTURE.md` for the complete trust-boundary model.
