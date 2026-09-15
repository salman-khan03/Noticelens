from datetime import datetime, timedelta, timezone

import pytest

from app.proof import RULES, SOURCES, candidate, verify


@pytest.mark.parametrize("rule", RULES)
def test_supported(rule):
    assert verify(candidate(rule)).verificationStatus == "VERIFIED"


def test_unsupported():
    c = candidate("wear").model_copy(update={"claim": "You have 14 days to respond."})
    assert verify(c).verificationStatus == "UNVERIFIED"


def test_contradiction():
    c = candidate("wear").model_copy(
        update={"claim": "A landlord may retain a security deposit to cover normal wear and tear."}
    )
    assert verify(c).verificationStatus == "CONTRADICTED"


def test_invented_url():
    c = candidate("wear").model_copy(update={"sourceUrl": "https://fake.example/law"})
    assert verify(c).verificationStatus == "UNVERIFIED"


@pytest.mark.parametrize("jurisdiction", [None, "", "US-CA"])
def test_missing_jurisdiction(jurisdiction):
    assert (
        verify(
            candidate("wear").model_copy(update={"jurisdiction": jurisdiction})
        ).verificationStatus
        == "HUMAN_REVIEW_REQUIRED"
    )


def test_quote_spoofing():
    assert (
        verify(
            candidate("wear").model_copy(update={"supportingPassage": "Some made-up text"})
        ).verificationStatus
        == "UNVERIFIED"
    )


def test_wrong_source():
    assert (
        verify(candidate("wear").model_copy(update={"sourceId": "vacate"})).verificationStatus
        == "UNVERIFIED"
    )


def test_tampering(monkeypatch):
    monkeypatch.setitem(SOURCES, "deposit", SOURCES["deposit"].model_copy(update={"sha256": "bad"}))
    assert verify(candidate("wear")).verificationStatus == "HUMAN_REVIEW_REQUIRED"


def test_stale_source(monkeypatch):
    old = (datetime.now(timezone.utc) - timedelta(days=91)).isoformat()
    monkeypatch.setitem(
        SOURCES, "deposit", SOURCES["deposit"].model_copy(update={"retrievedAt": old})
    )
    assert verify(candidate("wear")).verificationStatus == "HUMAN_REVIEW_REQUIRED"
