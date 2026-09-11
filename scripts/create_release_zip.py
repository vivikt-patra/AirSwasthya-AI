"""Create a clean release ZIP for AirSwasthya AI."""

from __future__ import annotations

import shutil
from datetime import datetime
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
RELEASE_DIR = PROJECT_ROOT / "release"

EXCLUDED_DIRS = {
    ".git",
    ".agents",
    ".codex",
    ".venv",
    "__pycache__",
    ".pytest_cache",
    "release",
}

EXCLUDED_SUFFIXES = {
    ".pyc",
    ".pyo",
    ".zip",
}


def should_exclude(path: Path) -> bool:
    """Return True when a path should be skipped from the release package."""

    relative_parts = set(path.relative_to(PROJECT_ROOT).parts)
    if relative_parts.intersection(EXCLUDED_DIRS):
        return True
    if path.suffix.lower() in EXCLUDED_SUFFIXES:
        return True
    return False


def create_release_zip() -> Path:
    """Build a timestamped release ZIP with source, docs, and placeholders."""

    RELEASE_DIR.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    staging_dir = RELEASE_DIR / f"AirSwasthya_AI_release_{timestamp}"

    if staging_dir.exists():
        shutil.rmtree(staging_dir)
    staging_dir.mkdir(parents=True)

    for source_path in PROJECT_ROOT.rglob("*"):
        if source_path == staging_dir or should_exclude(source_path):
            continue
        relative_path = source_path.relative_to(PROJECT_ROOT)
        destination = staging_dir / relative_path
        if source_path.is_dir():
            destination.mkdir(parents=True, exist_ok=True)
        else:
            destination.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(source_path, destination)

    archive_base = RELEASE_DIR / f"AirSwasthya_AI_release_{timestamp}"
    archive_path = shutil.make_archive(str(archive_base), "zip", staging_dir)
    shutil.rmtree(staging_dir)
    return Path(archive_path)


if __name__ == "__main__":
    package = create_release_zip()
    print(f"Release ZIP created: {package}")
