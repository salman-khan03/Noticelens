import pytest
from pydantic import ValidationError

from app.config import Settings


def test_cors_origins_are_trimmed_and_deduplicated():
    settings = Settings(
        _env_file=None,
        allowed_origins=(
            "http://localhost:3000/, https://example.com, http://localhost:3000"
        ),
    )
    assert settings.cors_origins == ["http://localhost:3000", "https://example.com"]


@pytest.mark.parametrize(
    "origins",
    ["*", "example.com", "https://example.com/app", ""],
)
def test_invalid_cors_origins_fail_fast(origins):
    with pytest.raises(ValidationError, match="ALLOWED_ORIGINS"):
        Settings(_env_file=None, allowed_origins=origins)
