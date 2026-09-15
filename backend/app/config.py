from functools import lru_cache
from pathlib import Path
from typing import Literal
from urllib.parse import urlsplit

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parents[1]


class Settings(BaseSettings):
    app_env: Literal["development", "test", "production"] = "development"
    allowed_origins: str = "http://localhost:3000,http://127.0.0.1:3000"

    model_config = SettingsConfigDict(
        env_file=BACKEND_DIR / ".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    @field_validator("allowed_origins")
    @classmethod
    def validate_origins(cls, value: str) -> str:
        normalized: list[str] = []
        for candidate in value.split(","):
            origin = candidate.strip().rstrip("/")
            if not origin:
                continue
            parsed = urlsplit(origin)
            if (
                origin == "*"
                or parsed.scheme not in {"http", "https"}
                or not parsed.netloc
                or parsed.path
                or parsed.query
                or parsed.fragment
            ):
                raise ValueError(
                    "ALLOWED_ORIGINS must contain exact http(s) origins without paths or wildcards"
                )
            if origin not in normalized:
                normalized.append(origin)
        if not normalized:
            raise ValueError("ALLOWED_ORIGINS must contain at least one origin")
        return ",".join(normalized)

    @property
    def cors_origins(self) -> list[str]:
        return self.allowed_origins.split(",")


@lru_cache
def get_settings() -> Settings:
    return Settings()
