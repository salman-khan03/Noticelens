"""Small deterministic keyword retrieval. PostgreSQL FTS migration is supplied."""

from .proof import SOURCES


def retrieve(notice_type: str):
    keys = {
        "Notice to vacate": ["vacate"],
        "Lease-violation notice": ["vacate"],
        "Security-deposit dispute": ["deposit", "forwarding"],
    }.get(notice_type, [])
    return [SOURCES[k] for k in keys]
