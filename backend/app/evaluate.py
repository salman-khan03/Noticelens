import json
import time
from datetime import datetime, timezone

from .analysis import analyze
from .models import Candidate
from .proof import ROOT, candidate, verify


def run():
    cases = []
    good = candidate("wear")
    cases.append(("supported", good, "VERIFIED"))
    cases.append(
        (
            "invented URL",
            good.model_copy(update={"sourceUrl": "https://invented.example/law"}),
            "UNVERIFIED",
        )
    )
    cases.append(
        (
            "missing jurisdiction",
            good.model_copy(update={"jurisdiction": None}),
            "HUMAN_REVIEW_REQUIRED",
        )
    )
    cases.append(
        (
            "contradiction",
            good.model_copy(
                update={
                    "claim": "A landlord may retain a security deposit to cover normal wear and tear."
                }
            ),
            "CONTRADICTED",
        )
    )
    cases.append(
        (
            "unrelated claim with valid citation",
            good.model_copy(update={"claim": "You always have 14 days to respond."}),
            "UNVERIFIED",
        )
    )
    cases.append(
        (
            "no citation",
            Candidate(id="no-source", claim="The notice is invalid.", jurisdiction="US-TX"),
            "UNVERIFIED",
        )
    )
    rows = []
    start = time.perf_counter()
    for name, c, expected in cases:
        actual = verify(c).verificationStatus
        rows.append(
            {"scenario": name, "expected": expected, "actual": actual, "passed": actual == expected}
        )
    notices = json.loads((ROOT / "sample-data/notices.json").read_text())
    analyses = [analyze(s["text"], "US-TX", True) for s in notices]
    total = sum(a.metrics.claimsChecked for a in analyses)
    verified = sum(a.metrics.supported for a in analyses)
    result = {
        "runAt": datetime.now(timezone.utc).isoformat(),
        "cases": rows,
        "passed": sum(r["passed"] for r in rows),
        "total": len(rows),
        "unsupportedRejectionRate": sum(
            verify(c).verificationStatus != "VERIFIED" for _, c, e in cases if e != "VERIFIED"
        )
        / 5
        * 100,
        "citationCoverage": round(verified / total * 100, 1),
        "retrievalSuccessRate": sum(bool(a.metrics.sourcesUsed) for a in analyses)
        / len(analyses)
        * 100,
        "elapsedMs": round((time.perf_counter() - start) * 1000, 2),
        "scope": "Six engineered gate checks and three synthetic notices; not a real-world accuracy estimate.",
    }
    (ROOT / "sample-data/evaluation-results.json").write_text(json.dumps(result, indent=2))
    print(json.dumps(result, indent=2))
    return result


if __name__ == "__main__":
    run()
