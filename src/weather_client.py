"""No-key weather summary ingestion for the dashboard home page."""

from __future__ import annotations

import json
from urllib.parse import urlencode
from urllib.request import urlopen

import pandas as pd

from src.location_sources import LocationProfile


FORECAST_ENDPOINT = "https://api.open-meteo.com/v1/forecast"

CURRENT_FIELDS = (
    "temperature_2m",
    "relative_humidity_2m",
    "apparent_temperature",
    "is_day",
    "precipitation",
    "rain",
    "weather_code",
    "cloud_cover",
    "wind_speed_10m",
    "wind_direction_10m",
)

DAILY_FIELDS = (
    "weather_code",
    "temperature_2m_max",
    "temperature_2m_min",
    "precipitation_probability_max",
    "uv_index_max",
    "sunrise",
    "sunset",
    "wind_speed_10m_max",
)

WEATHER_CODE_LABELS = {
    0: "Clear",
    1: "Mostly clear",
    2: "Partly cloudy",
    3: "Cloudy",
    45: "Fog",
    48: "Rime fog",
    51: "Light drizzle",
    53: "Drizzle",
    55: "Dense drizzle",
    56: "Freezing drizzle",
    57: "Freezing drizzle",
    61: "Light rain",
    63: "Rain",
    65: "Heavy rain",
    66: "Freezing rain",
    67: "Freezing rain",
    71: "Light snow",
    73: "Snow",
    75: "Heavy snow",
    77: "Snow grains",
    80: "Rain showers",
    81: "Rain showers",
    82: "Violent showers",
    85: "Snow showers",
    86: "Snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm hail",
    99: "Thunderstorm hail",
}


def build_weather_url(location: LocationProfile, forecast_days: int = 7) -> str:
    """Build an Open-Meteo weather forecast URL for one target area."""

    params = {
        "latitude": f"{location.latitude:.5f}",
        "longitude": f"{location.longitude:.5f}",
        "current": ",".join(CURRENT_FIELDS),
        "daily": ",".join(DAILY_FIELDS),
        "timezone": "auto",
        "forecast_days": str(forecast_days),
    }
    return f"{FORECAST_ENDPOINT}?{urlencode(params)}"


def fetch_weather_payload(location: LocationProfile, forecast_days: int = 7, timeout: int = 15) -> dict:
    """Fetch weather JSON for the selected location."""

    url = build_weather_url(location, forecast_days=forecast_days)
    with urlopen(url, timeout=timeout) as response:
        return json.loads(response.read().decode("utf-8"))


def describe_weather_code(code: object) -> str:
    """Return a human-readable WMO weather-code label."""

    try:
        return WEATHER_CODE_LABELS.get(int(code), "Mixed conditions")
    except (TypeError, ValueError):
        return "Unavailable"


def wind_direction_label(degrees: object) -> str:
    """Convert wind direction degrees into a compact compass label."""

    try:
        value = float(degrees) % 360
    except (TypeError, ValueError):
        return "unknown"

    directions = ("N", "NE", "E", "SE", "S", "SW", "W", "NW")
    index = round(value / 45) % len(directions)
    return directions[index]


def weather_payload_to_frames(payload: dict) -> tuple[dict[str, object], pd.DataFrame]:
    """Normalize Open-Meteo weather JSON into current and daily structures."""

    current = dict(payload.get("current", {}))
    current["condition"] = describe_weather_code(current.get("weather_code"))
    current["wind_direction_label"] = wind_direction_label(current.get("wind_direction_10m"))

    daily = payload.get("daily", {})
    dates = daily.get("time", [])
    rows: list[dict[str, object]] = []
    for index, date_value in enumerate(dates):
        weather_code = _daily_value(daily, "weather_code", index)
        rows.append(
            {
                "date": pd.to_datetime(date_value, errors="coerce"),
                "condition": describe_weather_code(weather_code),
                "weather_code": weather_code,
                "temperature_max_c": _daily_value(daily, "temperature_2m_max", index),
                "temperature_min_c": _daily_value(daily, "temperature_2m_min", index),
                "rain_probability": _daily_value(daily, "precipitation_probability_max", index),
                "uv_index": _daily_value(daily, "uv_index_max", index),
                "sunrise": _daily_value(daily, "sunrise", index),
                "sunset": _daily_value(daily, "sunset", index),
                "wind_speed_kmh": _daily_value(daily, "wind_speed_10m_max", index),
            }
        )
    return current, pd.DataFrame(rows)


def celsius_to_fahrenheit(value: object) -> float | None:
    """Convert a Celsius value to Fahrenheit when numeric."""

    try:
        return float(value) * 9 / 5 + 32
    except (TypeError, ValueError):
        return None


def _daily_value(daily: dict, key: str, index: int) -> object:
    values = daily.get(key, [])
    if index >= len(values):
        return None
    return values[index]
