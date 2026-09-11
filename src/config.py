"""Shared project configuration."""

import os
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = PROJECT_ROOT / "data"
RAW_DATA_DIR = DATA_DIR / "raw"
PROCESSED_DATA_DIR = DATA_DIR / "processed"
MODELS_DIR = PROJECT_ROOT / "models"
VISUALS_DIR = PROJECT_ROOT / "visuals"
REPORTS_DIR = PROJECT_ROOT / "reports"
METADATA_DIR = PROJECT_ROOT / "metadata"
ENV_FILE = PROJECT_ROOT / ".env"

API_CREDENTIALS = {
    "WAQI_API_TOKEN": "WAQI",
    "DATA_GOV_IN_API_KEY": "data.gov.in",
    "OPENAQ_API_KEY": "OpenAQ",
}

PLACEHOLDER_VALUES = {
    "",
    "your_key",
    "your_token",
    "your_waqi_token",
    "your_replacement_token",
    "your_data_gov_in_api_key",
    "your_openaq_api_key",
    "your-openaq-api-key",
}


def _clean_env_value(value: str) -> str:
    value = value.strip()
    if len(value) >= 2 and value[0] == value[-1] and value[0] in {"'", '"'}:
        return value[1:-1].strip()
    return value


def load_local_env(path: Path = ENV_FILE) -> dict[str, str]:
    """Read simple KEY=VALUE pairs from .env without logging secret values."""

    if not path.exists():
        return {}

    values: dict[str, str] = {}
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        if line.startswith("export "):
            line = line.removeprefix("export ").strip()
        key, value = line.split("=", 1)
        key = key.strip()
        if key:
            values[key] = _clean_env_value(value)
    return values


def is_configured_secret(value: str | None) -> bool:
    """Return True only for non-empty values that are not obvious placeholders."""

    if value is None:
        return False
    normalized = value.strip()
    if not normalized:
        return False
    lowered = normalized.lower()
    return lowered not in PLACEHOLDER_VALUES and "your_" not in lowered and "your-" not in lowered


def get_config_value(key: str) -> str | None:
    """Return an environment value, falling back to the local .env file."""

    env_value = os.getenv(key)
    if is_configured_secret(env_value):
        return env_value

    local_values = load_local_env()
    local_value = local_values.get(key)
    if is_configured_secret(local_value):
        return local_value
    return None


def api_credential_status() -> list[dict[str, str]]:
    """Return safe credential status rows for docs and UI."""

    local_values = load_local_env()
    rows: list[dict[str, str]] = []
    for key, provider in API_CREDENTIALS.items():
        env_value = os.getenv(key)
        local_value = local_values.get(key)
        if is_configured_secret(env_value):
            configured = "yes"
            source = "environment"
        elif is_configured_secret(local_value):
            configured = "yes"
            source = ".env"
        else:
            configured = "no"
            source = "missing"

        rows.append(
            {
                "provider": provider,
                "env_key": key,
                "configured": configured,
                "source": source,
                "connection": "pending provider check",
            }
        )
    return rows
