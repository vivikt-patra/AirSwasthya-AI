import pandas as pd

from src.data_cleaning import clean_aqi_dataframe
from src.feature_engineering import build_model_frame


def test_cleaning_standardizes_columns_and_fills_pollutants():
    raw = pd.DataFrame(
        {
            "City": ["Delhi", "Delhi", "Delhi"],
            "Date": ["2026-01-01", "2026-01-02", "2026-01-03"],
            "PM2.5": [80, None, 90],
            "PM10": [150, 155, 160],
            "AQI": [180, 185, 190],
        }
    )

    cleaned, summary = clean_aqi_dataframe(raw)

    assert summary.output_rows == 3
    assert "pm25" in cleaned.columns
    assert cleaned["pm25"].isna().sum() == 0
    assert "aqi_category" in cleaned.columns


def test_feature_engineering_creates_future_target():
    raw = pd.DataFrame(
        {
            "City": ["Delhi"] * 12,
            "Date": pd.date_range("2026-01-01", periods=12, freq="D"),
            "PM2.5": list(range(80, 92)),
            "PM10": list(range(150, 162)),
            "NO2": list(range(30, 42)),
            "SO2": list(range(8, 20)),
            "CO": [0.8] * 12,
            "O3": list(range(20, 32)),
            "AQI": list(range(180, 192)),
        }
    )

    cleaned, _summary = clean_aqi_dataframe(raw)
    model_frame, feature_summary = build_model_frame(cleaned, forecast_horizon_days=1)

    assert feature_summary.target_column == "aqi_next_1_day"
    assert "aqi_lag_1" in model_frame.columns
    first = model_frame.iloc[0]
    assert first["aqi_next_1_day"] == first["aqi"] + 1

