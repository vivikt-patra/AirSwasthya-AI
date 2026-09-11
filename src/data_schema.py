"""Column names and dataset rules used across AirSwasthya AI."""

from __future__ import annotations

DATE_COLUMN = "date"
CITY_COLUMN = "city"
TARGET_COLUMN = "aqi"
AQI_BUCKET_COLUMN = "aqi_bucket"

POLLUTANT_COLUMNS = ["pm25", "pm10", "no2", "so2", "co", "o3"]
BASE_COLUMNS = [DATE_COLUMN, CITY_COLUMN, *POLLUTANT_COLUMNS, TARGET_COLUMN]
OPTIONAL_COLUMNS = [AQI_BUCKET_COLUMN]

COLUMN_ALIASES = {
    "date": DATE_COLUMN,
    "datetime": DATE_COLUMN,
    "city": CITY_COLUMN,
    "station": "station",
    "pm2.5": "pm25",
    "pm2_5": "pm25",
    "pm25": "pm25",
    "pm 2.5": "pm25",
    "pm10": "pm10",
    "pm 10": "pm10",
    "no2": "no2",
    "so2": "so2",
    "co": "co",
    "o3": "o3",
    "aqi": TARGET_COLUMN,
    "aqi_bucket": AQI_BUCKET_COLUMN,
    "aqi bucket": AQI_BUCKET_COLUMN,
    "aqi_category": AQI_BUCKET_COLUMN,
    "aqi category": AQI_BUCKET_COLUMN,
}


def normalize_column_name(column_name: str) -> str:
    """Convert a raw column name into the project standard where possible."""

    cleaned = str(column_name).strip().lower().replace("-", " ").replace("/", " ")
    cleaned = " ".join(cleaned.split())
    compact = cleaned.replace(" ", "_")

    if cleaned in COLUMN_ALIASES:
        return COLUMN_ALIASES[cleaned]
    if compact in COLUMN_ALIASES:
        return COLUMN_ALIASES[compact]
    return compact

