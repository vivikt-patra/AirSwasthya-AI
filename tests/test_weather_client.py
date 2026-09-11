from src.location_sources import get_location
from src.weather_client import (
    build_weather_url,
    celsius_to_fahrenheit,
    describe_weather_code,
    weather_payload_to_frames,
    wind_direction_label,
)


def test_build_weather_url_contains_target_and_fields():
    url = build_weather_url(get_location("koraput"), forecast_days=7)

    assert "api.open-meteo.com/v1/forecast" in url
    assert "latitude=18.81199" in url
    assert "longitude=82.71048" in url
    assert "temperature_2m" in url
    assert "uv_index_max" in url


def test_weather_payload_to_frames_normalizes_current_and_daily_rows():
    payload = {
        "current": {
            "temperature_2m": 25.0,
            "relative_humidity_2m": 82,
            "weather_code": 61,
            "wind_direction_10m": 225,
        },
        "daily": {
            "time": ["2026-09-09", "2026-09-10"],
            "weather_code": [61, 2],
            "temperature_2m_max": [28.0, 29.0],
            "temperature_2m_min": [21.0, 20.0],
            "precipitation_probability_max": [70, 40],
            "uv_index_max": [5.2, 6.1],
            "sunrise": ["2026-09-09T05:42", "2026-09-10T05:42"],
            "sunset": ["2026-09-09T18:02", "2026-09-10T18:01"],
            "wind_speed_10m_max": [12.3, 9.8],
        },
    }

    current, daily = weather_payload_to_frames(payload)

    assert current["condition"] == "Light rain"
    assert current["wind_direction_label"] == "SW"
    assert daily.shape[0] == 2
    assert daily.loc[1, "condition"] == "Partly cloudy"


def test_weather_helpers_are_human_readable():
    assert describe_weather_code(0) == "Clear"
    assert wind_direction_label(90) == "E"
    assert celsius_to_fahrenheit(25) == 77
