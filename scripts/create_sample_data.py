"""Create a synthetic AQI dataset for local testing and demos."""

from __future__ import annotations

from pathlib import Path

import numpy as np
import pandas as pd


PROJECT_ROOT = Path(__file__).resolve().parents[1]
RAW_OUTPUT = PROJECT_ROOT / "data" / "raw" / "sample_city_day.csv"


def create_sample_city_day(output_path: Path = RAW_OUTPUT) -> Path:
    """Create a small synthetic city-day AQI CSV."""

    rng = np.random.default_rng(42)
    rows = []
    cities = {
        "Delhi": 185,
        "Mumbai": 105,
        "Bengaluru": 82,
        "Hyderabad": 118,
    }

    for city, base in cities.items():
        for day in range(120):
            seasonal = 18 * np.sin(day / 13)
            drift = day * 0.08
            noise = rng.normal(0, 5)
            aqi = max(30, base + seasonal + drift + noise)
            rows.append(
                {
                    "City": city,
                    "Date": pd.Timestamp("2025-01-01") + pd.Timedelta(days=day),
                    "PM2.5": round(aqi * 0.43 + rng.normal(0, 3), 2),
                    "PM10": round(aqi * 0.82 + rng.normal(0, 5), 2),
                    "NO2": round(aqi * 0.15 + rng.normal(0, 2), 2),
                    "SO2": round(aqi * 0.05 + rng.normal(0, 1), 2),
                    "CO": round(max(0.2, aqi * 0.005 + rng.normal(0, 0.05)), 3),
                    "O3": round(aqi * 0.12 + rng.normal(0, 2), 2),
                    "AQI": round(aqi, 2),
                }
            )

    output_path.parent.mkdir(parents=True, exist_ok=True)
    pd.DataFrame(rows).to_csv(output_path, index=False)
    return output_path


if __name__ == "__main__":
    created = create_sample_city_day()
    print(f"Sample dataset created: {created}")

