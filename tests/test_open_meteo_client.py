from src.location_sources import get_location
from src.open_meteo_client import hourly_payload_to_frame, hourly_to_daily


def test_open_meteo_payload_is_normalized_to_daily_pm25():
    location = get_location("koraput")
    payload = {
        "hourly": {
            "time": ["2026-09-01T00:00", "2026-09-01T01:00", "2026-09-02T00:00"],
            "pm2_5": [10, 14, 20],
            "pm10": [30, 40, 50],
            "nitrogen_dioxide": [5, 6, 7],
            "sulphur_dioxide": [3, 3, 4],
            "ozone": [20, 21, 22],
            "carbon_monoxide": [100, 110, 120],
        }
    }

    hourly = hourly_payload_to_frame(payload, location)
    daily = hourly_to_daily(hourly)

    assert list(daily["pm25"]) == [12, 20]
    assert daily["city"].iloc[0] == "Koraput"
    assert daily["source_type"].iloc[0] == "gridded_model_not_ground_sensor"
