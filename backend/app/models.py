from typing import Literal

from pydantic import BaseModel, Field

Status = Literal[
    "VERIFIED", "PARTIALLY_SUPPORTED", "UNVERIFIED", "CONTRADICTED", "HUMAN_REVIEW_REQUIRED"
]


class Candidate(BaseModel):
    id: str = Field(max_length=100)
    claim: str = Field(min_length=1, max_length=2000)
    jurisdiction: str | None = None
    category: str = "general_information"
    ruleId: str | None = None
    sourceId: str | None = None
    sourceUrl: str | None = None
    supportingPassage: str | None = None


class Source(BaseModel):
    id: str
    title: str
    url: str
    jurisdiction: str
    passage: str
    retrievedAt: str
    sha256: str


class Claim(Candidate):
    verificationStatus: Status
    reason: str
    source: Source | None = None
    confidence: float | None = None


class TextRequest(BaseModel):
    text: str = Field(min_length=25, max_length=60000)
    jurisdiction: str | None = None


class Fact(BaseModel):
    label: str
    value: str
    passage: str


class Metrics(BaseModel):
    claimsChecked: int
    supported: int
    blocked: int
    citationCoverage: float
    verifiedClaimRate: float
    sourcesUsed: int
    humanReviewRequired: bool


class AuditEvent(BaseModel):
    stage: Literal["RECEIVED", "EXTRACTED", "SOURCES_SELECTED", "CLAIMS_VERIFIED"]
    detail: str


class ProvenanceReceipt(BaseModel):
    policyVersion: str
    sourceManifestSha256: str
    analysisSha256: str
    sourceSnapshotAgeDays: int | None
    inputIsolation: Literal["UNTRUSTED_DOCUMENT_DATA"]
    persistence: Literal["REQUEST_ONLY"]
    reviewStatus: Literal["HUMAN_REVIEW_REQUIRED"]
    auditTrail: list[AuditEvent]


class Analysis(BaseModel):
    id: str
    noticeType: str
    jurisdiction: str | None
    synthetic: bool
    provider: str
    extractionMethod: str
    facts: list[Fact]
    summary: str
    claims: list[Claim]
    metrics: Metrics
    actions: list[str]
    draft: str
    warnings: list[str]
    text: str
    elapsedMs: float
    analyzedAt: str
    privacyFindings: list[str]
    provenance: ProvenanceReceipt
