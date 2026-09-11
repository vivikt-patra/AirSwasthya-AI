"""Data loading helpers for AirSwasthya AI."""

from __future__ import annotations

from pathlib import Path

import pandas as pd

from src.config import RAW_DATA_DIR


DEFAULT_RAW_DATASET = RAW_DATA_DIR / "city_day.csv"


def load_raw_dataset(path: str | Path = DEFAULT_RAW_DATASET) -> pd.DataFrame:
    """Load the raw AQI CSV file.

    The default path expects the common Kaggle/CPCB-style India AQI file:
    `data/raw/city_day.csv`.
    """

    dataset_path = Path(path)
    if not dataset_path.exists():
        raise FileNotFoundError(
            f"Raw dataset not found at {dataset_path}. "
            "Place the India AQI CSV in data/raw/ and try again."
        )

    return pd.read_csv(dataset_path)

