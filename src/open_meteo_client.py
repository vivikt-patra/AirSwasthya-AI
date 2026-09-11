"""No-key Open-Meteo PM2.5 ingestion for target-area demos.

Open-Meteo air-quality data is useful for a live-looking minor-project demo, but
it is gridded/model data rather than CPCB ground-sensor history. The dashboard
and docs keep that limitation visible.
"""

from __future__ import annotations

import json
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import urlopen

import pandas as pd

from src.config import PROCESSED_DATA_DIR
from src.location_sources import LocationProfile, ordered_locations


OPEN_METEO_AIR_QUALITY_URL = "https://air-quality-api.open-meteo.com/v1/air-quality"
DEFAULT_OPEN_METEO_DIR = PROCESSED_DATA_DIR / "open_meteo"
HOURLY_COLUMNS = [
    "pm2_5",
    "pm10",
    "nitrogen_dioxide",
    "sulphur_dioxide",
    "ozone",
    "carbon_monoxide",
]
COLUMN_MAP = {
    "pm2_5": "pm25",
    "pm10": "pm10",
    "nitrogen_dioxide": "no2",
    "sulphur_dioxide": "so2",
    "ozone": "o3",
    "carbon_monoxide": "co",
}


def build_open_meteo_url(
    location: LocationProfile,
    past_days: int = 92,
    forecast_days: int = 7,
) -> str:
    """Build the Open-Meteo air-quality API URL for a target location."""

    params = {
        "latitude": location.latitude,
        "longitude": location.longitude,
        "hourly": ",".join(HOURLY_COLUMNS),
        "timezone": "Asia/Kolkata",
        "past_days": past_days,
        "forecast_days": forecast_days,
    }
    return f"{OPEN_METEO_AIR_QUALITY_URL}?{urlencode(params)}"


def fetch_open_meteo_payload(
    location: LocationProfile,
    past_days: int = 92,
    forecast_days: int = 7,
) -> dict:
    """Fetch a raw Open-Meteo payload for one target location."""

    url = build_open_meteo_url(location, past_days=past_days, forecast_days=forecast_days)
    with urlopen(url, timeout=60) as response:
        return json.loads(response.read().decode("utf-8"))


def hourly_payload_to_frame(payload: dict, location: LocationProfile) -> pd.DataFrame:
    """Convert an Open-Meteo hourly payload into the project column shape."""

    hourly = payload.get("hourly", {})
    if "time" not in hourly:
        raise ValueError("Open-Meteo payload does not contain hourly time values.")

    df = pd.DataFrame({"datetime": pd.to_datetime(hourly["time"], errors="coerce")})
    for source_column, target_column in COLUMN_MAP.items():
        values = hourly.get(source_column)
        if values is not None:
            df[target_column] = pd.to_numeric(pd.Series(values), errors="coerce")

    df["date"] = df["datetime"].dt.date
    df["city"] = location.name
    df["location_slug"] = location.slug
    df["source"] = "Open-Meteo Air Quality API"
    df["source_type"] = "gridded_model_not_ground_sensor"
    return df.dropna(subset=["datetime"])


def hourly_to_daily(df: pd.DataFrame, forecast_start: pd.Timestamp | None = None) -> pd.DataFrame:
    """Aggregate hourly air-quality readings to daily means."""

    pollutant_columns = [column for column in ["pm25", "pm10", "no2", "so2", "o3", "co"] if column in df.columns]
    daily = (
        df.groupby(["date", "city", "location_slug", "source", "source_type"], as_index=False)[pollutant_columns]
        .mean(numeric_only=True)
        .sort_values("date")
    )
    daily["date"] = pd.to_datetime(daily["date"])

    if forecast_start is None:
        forecast_start = pd.Timestamp.now(tz="Asia/Kolkata").normalize().tz_localize(None)

    daily = daily.dropna(subset=["pm25"]).copy()
    daily["data_role"] = daily["date"].apply(lambda value: "forecast_api" if value >= forecast_start else "history")
    return daily


def fetch_and_save_location_data(
    location: LocationProfile,
    output_dir: str | Path = DEFAULT_OPEN_METEO_DIR,
    past_days: int = 92,
    forecast_days: int = 7,
) -> tuple[Path, Path]:
    """Fetch hourly data, save hourly and daily CSVs, and return both paths."""

    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    payload = fetch_open_meteo_payload(location, past_days=past_days, forecast_days=forecast_days)
    hourly_df = hourly_payload_to_frame(payload, location)
    daily_df = hourly_to_daily(hourly_df)

    hourly_path = output_path / f"{location.slug}_hourly.csv"
    daily_path = output_path / f"{location.slug}_daily.csv"
    hourly_df.to_csv(hourly_path, index=False)
    daily_df.to_csv(daily_path, index=False)
    return hourly_path, daily_path


def fetch_and_save_priority_locations(
    output_dir: str | Path = DEFAULT_OPEN_METEO_DIR,
    past_days: int = 92,
    forecast_days: int = 7,
) -> list[Path]:
    """Fetch and save Open-Meteo data for Koraput, Nawarangpur, and Gunupur."""

    saved_paths: list[Path] = []
    for location in ordered_locations():
        hourly_path, daily_path = fetch_and_save_location_data(
            location,
            output_dir=output_dir,
            past_days=past_days,
            forecast_days=forecast_days,
        )
        saved_paths.extend([hourly_path, daily_path])
    return saved_paths
