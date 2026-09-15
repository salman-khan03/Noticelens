"""Closed-world proof checking. Citation presence is never semantic proof."""

import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path

from .models import Candidate, Claim, Source

ROOT = Path(__file__).resolve().parents[2]
SOURCES = {s["id"]: Source(**s) for s in json.loads((ROOT / "sources/manifest.json").read_text())}

# Each rule binds exact wording AND exact supporting text to an approved source.
# This is a small engineered corpus, not an LLM entailment classifier or legal review.
RULES = {
    "notice_period": (
        "vacate",
        "For a tenant under a written lease or oral rental agreement who defaults or holds over, Section 24.005(a) generally requires at least three days' written notice before a forcible detainer suit, unless a written lease or agreement specifies a shorter or longer period.",
        "If the occupant is a tenant under a written lease or oral rental agreement, the landlord must give a tenant who defaults or holds over beyond the end of the rental term or renewal period at least three days' written notice to vacate the premises before the landlord files a forcible detainer suit, unless the parties have contracted for a shorter or longer notice period in a written lease or agreement.",
    ),
    "pay_or_vacate": (
        "vacate",
        "For a suit based solely on nonpayment, Section 24.005(a) requires a notice to pay rent or vacate if the tenant was not late or delinquent before the month of the notice.",
        "In a forcible detainer suit against a tenant whose right of possession is terminated based solely on nonpayment of rent and who was not late or delinquent in paying rent to the landlord before the month in which the notice is given, written notice under this section shall be given in the form of a notice to pay rent or vacate.",
    ),
    "wear": (
        "deposit",
        "A landlord may not retain a security deposit to cover normal wear and tear.",
        "The landlord may not retain any portion of a security deposit to cover normal wear and tear.",
    ),
    "address": (
        "forwarding",
        "The landlord is not obligated to refund the deposit or provide a written accounting until the tenant supplies a written forwarding address for the refund.",
        "The landlord is not obligated to return a tenant's security deposit or give the tenant a written description of damages and charges until the tenant gives the landlord a written statement of the tenant's forwarding address for the purpose of refunding the security deposit.",
    ),
}
CONTRADICTIONS = {"A landlord may retain a security deposit to cover normal wear and tear.": "wear"}


def candidate(rule_id: str) -> Candidate:
    sid, statement, quote = RULES[rule_id]
    return Candidate(
        id=rule_id,
        claim=statement,
        ruleId=rule_id,
        jurisdiction="US-TX",
        sourceId=sid,
        sourceUrl=SOURCES[sid].url,
        supportingPassage=quote,
    )


def verify(c: Candidate) -> Claim:
    def result(status, reason, source=None):
        return Claim(**c.model_dump(), verificationStatus=status, reason=reason, source=source)

    if c.jurisdiction != "US-TX":
        return result(
            "HUMAN_REVIEW_REQUIRED",
            "Missing or unsupported jurisdiction. Only Texas general information is in this corpus.",
        )
    s = SOURCES.get(c.sourceId or "")
    if not s or c.sourceUrl != s.url:
        return result(
            "UNVERIFIED",
            "Citation is missing or does not match the approved source manifest. Model-supplied URLs are never fetched.",
        )
    if hashlib.sha256(s.passage.encode()).hexdigest() != s.sha256:
        return result("HUMAN_REVIEW_REQUIRED", "Source integrity check failed.")
    if (datetime.now(timezone.utc) - datetime.fromisoformat(s.retrievedAt)).days > 90:
        return result(
            "HUMAN_REVIEW_REQUIRED",
            "Source snapshot is over 90 days old; refresh and review the corpus.",
        )
    if (
        s.jurisdiction != c.jurisdiction
        or not c.supportingPassage
        or c.supportingPassage not in s.passage
    ):
        return result(
            "UNVERIFIED",
            "The exact supporting passage is absent from the approved jurisdiction source.",
        )
    contradiction = CONTRADICTIONS.get(c.claim)
    if (
        contradiction
        and RULES[contradiction][0] == s.id
        and c.supportingPassage == RULES[contradiction][2]
    ):
        return result(
            "CONTRADICTED", "This claim reverses an explicit prohibition in the cited passage.", s
        )
    rule = RULES.get(c.ruleId or "")
    if rule and (s.id, c.claim, c.supportingPassage) == rule:
        return result(
            "VERIFIED",
            "Exact approved general-information claim and passage match. Applicability to your case is not verified.",
            s,
        )
    return result(
        "UNVERIFIED",
        "A real citation alone does not prove this wording. No approved claim-to-passage mapping exists.",
        s,
    )
