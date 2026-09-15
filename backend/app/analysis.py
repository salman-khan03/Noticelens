import hashlib
import json
import logging
import re
import time
import uuid
from datetime import datetime, timezone

from .models import Analysis, AuditEvent, Candidate, Fact, Metrics, ProvenanceReceipt
from .proof import SOURCES, verify
from .providers import RulesProvider
from .retrieval import retrieve

DATE = r"(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}|\d{4}-\d{2}-\d{2}|\d{1,2}/\d{1,2}/\d{2,4}"
POLICY_VERSION = "proof-gate/2026.1"


def _privacy_findings(text: str) -> list[str]:
    findings = []
    checks = [
        (r"\b\d{3}-\d{2}-\d{4}\b", "Possible Social Security number"),
        (r"\b(?:\d[ -]*?){13,19}\b", "Possible payment-card or account number"),
        (r"\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b", "Email address"),
        (r"\b(?:\+?1[-. ]?)?\(?\d{3}\)?[-. ]?\d{3}[-. ]?\d{4}\b", "Phone number"),
        (r"(?im)^\s*(?:To|From|Property):\s*.+$", "Names or property address"),
    ]
    for pattern, label in checks:
        if re.search(pattern, text, re.IGNORECASE):
            findings.append(label)
    return findings


def _sha256(value: object) -> str:
    return hashlib.sha256(
        json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()
    ).hexdigest()


def analyze(text: str, jurisdiction: str | None, synthetic=False, method="Pasted text") -> Analysis:
    start = time.perf_counter()
    lower = text.lower()
    kind = (
        "Security-deposit dispute"
        if re.search(r"security[ -]deposit", lower)
        else "Lease-violation notice"
        if re.search(r"lease[ -]violation|unauthorized pet", lower)
        else "Notice to vacate"
        if re.search(r"notice to (?:pay rent or )?vacate", lower)
        else "Unrecognized notice"
    )
    facts = []
    for label, pattern in [
        ("Recipient", r"^To:\s*(.+)$"),
        ("Sender", r"^From:\s*(.+)$"),
        ("Property", r"^Property:\s*(.+)$"),
        ("Notice date", r"^Date:\s*(.+)$"),
    ]:
        m = re.search(pattern, text, re.M | re.I)
        if m:
            facts.append(Fact(label=label, value=m.group(1).strip(), passage=m.group(0)))
    for m in re.finditer(r"[^\n.!?]*(?:" + DATE + r")[^\n.!?]*", text, re.I):
        passage = m.group().strip()
        if not passage.lower().startswith("date:"):
            facts.append(
                Fact(label="Document-stated date • unconfirmed", value=passage, passage=passage)
            )
    for m in re.finditer(r"\$\d[\d,]*(?:\.\d{2})?", text):
        facts.append(
            Fact(
                label="Document-stated amount • allegation",
                value=m.group(),
                passage=text[max(0, m.start() - 40) : min(len(text), m.end() + 70)],
            )
        )
    warnings = [
        "Extracted facts may be incomplete or incorrect. Compare them with every page of the original.",
        "No legal deadline or notice validity has been determined. Service, lease terms, federal protections, and case facts require human review.",
    ]
    if jurisdiction != "US-TX":
        warnings.append("Texas jurisdiction has not been confirmed. Legal claims are blocked.")
    if kind == "Unrecognized notice":
        warnings.append(
            "Notice type is outside the three supported examples. No legal rules have been applied."
        )
    sources = retrieve(kind)
    candidates = RulesProvider().generate(kind, {s.id for s in sources})
    for c in candidates:
        c.jurisdiction = jurisdiction
    if synthetic:
        candidates.append(
            Candidate(
                id="injected-demo",
                claim="You always have 14 days to respond to this notice.",
                jurisdiction=jurisdiction,
                category="deliberate_safety_test",
            )
        )
    claims = [verify(c) for c in candidates]
    count = len(claims)
    supported = sum(c.verificationStatus == "VERIFIED" for c in claims)
    sources_used = {c.source.id for c in claims if c.source}
    summaries = {
        "Notice to vacate": "This appears to ask you to leave the property. Any reason, amount, or date stated is the sender’s assertion, not a finding that the notice is valid. Review the extracted text and the general legal information below.",
        "Lease-violation notice": "This appears to allege a lease violation. Compare the allegation with your lease and records. The app cannot decide whether a violation occurred or whether a cure period applies.",
        "Security-deposit dispute": "This appears to concern withholding a security deposit. Organize the stated charges, move-out records, photographs, and forwarding-address correspondence for review.",
        "Unrecognized notice": "The document could not be confidently classified. Use the extracted text to organize a review with a qualified person.",
    }
    actions = [
        "Now: review the original notice and confirm all extracted dates, names, and amounts.",
        "Next: save the lease, envelope or delivery record, payment history, and relevant correspondence.",
        "Before relying on any date: ask qualified counsel or the responsible authority to check service, applicable rules, and next steps.",
        "When ready: review and edit the informational response; keep a copy of anything you send.",
    ]
    draft = "DRAFT FOR YOUR REVIEW — NOT SENT\n\nTo [recipient],\n\nI am writing about the notice dated [confirm date] concerning [property]. Please provide clarification of the stated issue, the relevant lease provisions, and any supporting records or itemized amounts. Please also confirm the date and method of delivery and the action you are requesting.\n\n[Add only facts you have checked and questions you wish to ask.]\n\nThank you,\n[name]\n\nThis template does not determine your rights or extend any deadline. Review with qualified counsel as appropriate."
    elapsed = round((time.perf_counter() - start) * 1000, 2)
    analyzed_at = datetime.now(timezone.utc).isoformat()
    manifest_hash = _sha256([source.model_dump() for source in SOURCES.values()])
    source_ages = [
        (datetime.now(timezone.utc) - datetime.fromisoformat(source.retrievedAt)).days
        for source in sources
    ]
    analysis_hash = _sha256(
        {
            "inputSha256": hashlib.sha256(text.encode()).hexdigest(),
            "jurisdiction": jurisdiction,
            "noticeType": kind,
            "claims": [
                {
                    "id": claim.id,
                    "status": claim.verificationStatus,
                    "sourceSha256": claim.source.sha256 if claim.source else None,
                }
                for claim in claims
            ],
            "policyVersion": POLICY_VERSION,
        }
    )
    logging.getLogger("noticelens").info(
        "analysis type=%s retrieved=%d checked=%d blocked=%d elapsed_ms=%s",
        kind,
        len(sources),
        count,
        count - supported,
        elapsed,
    )
    return Analysis(
        id=str(uuid.uuid4()),
        noticeType=kind,
        jurisdiction=jurisdiction,
        synthetic=synthetic,
        provider=RulesProvider.name,
        extractionMethod=method,
        facts=facts,
        summary=summaries[kind],
        claims=claims,
        metrics=Metrics(
            claimsChecked=count,
            supported=supported,
            blocked=count - supported,
            citationCoverage=round(supported / count * 100, 1) if count else 0,
            verifiedClaimRate=round(supported / count * 100, 1) if count else 0,
            sourcesUsed=len(sources_used),
            humanReviewRequired=True,
        ),
        actions=actions,
        draft=draft,
        warnings=warnings,
        text=text,
        elapsedMs=elapsed,
        analyzedAt=analyzed_at,
        privacyFindings=_privacy_findings(text),
        provenance=ProvenanceReceipt(
            policyVersion=POLICY_VERSION,
            sourceManifestSha256=manifest_hash,
            analysisSha256=analysis_hash,
            sourceSnapshotAgeDays=max(source_ages) if source_ages else None,
            inputIsolation="UNTRUSTED_DOCUMENT_DATA",
            persistence="REQUEST_ONLY",
            reviewStatus="HUMAN_REVIEW_REQUIRED",
            auditTrail=[
                AuditEvent(stage="RECEIVED", detail="Document accepted as untrusted data."),
                AuditEvent(stage="EXTRACTED", detail=method),
                AuditEvent(
                    stage="SOURCES_SELECTED", detail=f"{len(sources)} approved source snapshot(s)."
                ),
                AuditEvent(
                    stage="CLAIMS_VERIFIED",
                    detail=f"{supported} supported; {count - supported} blocked.",
                ),
            ],
        ),
    )
