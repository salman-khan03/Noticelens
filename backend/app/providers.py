from typing import Protocol

from .models import Candidate
from .proof import candidate


class ClaimProvider(Protocol):
    name: str

    def generate(self, notice_type: str, source_ids: set[str]) -> list[Candidate]: ...


class RulesProvider:
    name = "Local rules • no language model"

    def generate(self, notice_type: str, source_ids: set[str]) -> list[Candidate]:
        rules = {
            "Notice to vacate": ["notice_period", "pay_or_vacate"],
            "Lease-violation notice": ["notice_period"],
            "Security-deposit dispute": ["wear", "address"],
        }.get(notice_type, [])
        return [c for r in rules if (c := candidate(r)).sourceId in source_ids]
