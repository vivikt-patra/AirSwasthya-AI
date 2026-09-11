"""Location profiles and data-source strategy for Odisha-first forecasting."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class LocationProfile:
    """A target location with explicit source and modeling notes."""

    name: str
    slug: str
    latitude: float
    longitude: float
    priority: int
    aliases: tuple[str, ...]
    ospcb_district: str | None
    proxy_district: str | None
    model_note: str
    public_audience: str


PRIORITY_LOCATIONS: dict[str, LocationProfile] = {
    "koraput": LocationProfile(
        name="Koraput",
        slug="koraput",
        latitude=18.81199,
        longitude=82.71048,
        priority=1,
        aliases=("Koraput",),
        ospcb_district="Koraput",
        proxy_district=None,
        model_note=(
            "Primary target. Use Koraput-specific recent gridded PM2.5 data now; "
            "replace or calibrate with ground-station history when available."
        ),
        public_audience=(
            "students, parents, outdoor workers, asthma-sensitive residents, "
            "school administrators, and local civic bodies"
        ),
    ),
    "nawarangpur": LocationProfile(
        name="Nawarangpur",
        slug="nawarangpur",
        latitude=19.23114,
        longitude=82.54826,
        priority=2,
        aliases=("Nawarangpur", "Nabarangpur", "Nowrangapur", "Nawarangapur"),
        ospcb_district="Nawarangapur",
        proxy_district=None,
        model_note=(
            "Second target. OSPCB spells it as Nawarangapur in 2026 DHQ reports; "
            "the model treats it as the same priority area."
        ),
        public_audience=(
            "district residents, public-health reviewers, students, and field teams "
            "who need simple risk language"
        ),
    ),
    "gunupur": LocationProfile(
        name="Gunupur",
        slug="gunupur",
        latitude=19.08040,
        longitude=83.80879,
        priority=3,
        aliases=("Gunupur",),
        ospcb_district=None,
        proxy_district="Rayagada",
        model_note=(
            "Third target. Direct Gunupur rows were not found in the checked OSPCB "
            "2026 PDFs; use Gunupur coordinates for gridded PM2.5 and Rayagada only "
            "as an official district-level proxy."
        ),
        public_audience=(
            "Gunupur residents, nearby schools/colleges, transport workers, and "
            "local administrators needing early caution signals"
        ),
    ),
}


def get_location(slug: str) -> LocationProfile:
    """Return a target location by slug or alias."""

    normalized = slug.strip().lower().replace(" ", "_").replace("-", "_")
    if normalized in PRIORITY_LOCATIONS:
        return PRIORITY_LOCATIONS[normalized]

    for location in PRIORITY_LOCATIONS.values():
        aliases = {alias.lower().replace(" ", "_").replace("-", "_") for alias in location.aliases}
        if normalized in aliases:
            return location

    valid = ", ".join(location.name for location in PRIORITY_LOCATIONS.values())
    raise KeyError(f"Unknown location '{slug}'. Valid locations: {valid}")


def ordered_locations() -> list[LocationProfile]:
    """Return priority locations in the order requested by the project owner."""

    return sorted(PRIORITY_LOCATIONS.values(), key=lambda location: location.priority)
