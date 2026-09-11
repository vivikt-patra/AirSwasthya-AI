"""Data-cleaning pipeline for India AQI datasets."""

from __future__ import annotations

import argparse
from dataclasses import dataclass
from pathlib import Path

import pandas as pd

from src.aqi_rules import classify_aqi
from src.config import PROCESSED_DATA_DIR
from src.data_loader import DEFAULT_RAW_DATASET, load_raw_dataset
from src.data_schema import (
    AQI_BUCKET_COLUMN,
    BASE_COLUMNS,
    CITY_COLUMN,
    DATE_COLUMN,
    POLLUTANT_COLUMNS,
    TARGET_COLUMN,
    normalize_column_name,
)


DEFAULT_CLEAN_DATASET = PROCESSED_DATA_DIR / "clean_aqi_data.csv"


@dataclass(frozen=True)
class CleaningSummary:
    """Small review-friendly summary of the cleaning run."""

    input_rows: int
    output_rows: int
    removed_rows: int
    columns: list[str]
    missing_values_after_cleaning: dict[str, int]


def standardize_columns(df: pd.DataFrame) -> pd.DataFrame:
    """Return a copy of the dataframe with project-standard column names."""

    cleaned = df.copy()
    cleaned.columns = [normalize_column_name(column) for column in cleaned.columns]
    return cleaned


def validate_required_columns(df: pd.DataFrame) -> None:
    """Check that the minimum columns needed for training are available."""

    missing = [column for column in [DATE_COLUMN, TARGET_COLUMN] if column not in df.columns]
    if missing:
        raise ValueError(f"Dataset is missing required column(s): {', '.join(missing)}")

    available_pollutants = [column for column in POLLUTANT_COLUMNS if column in df.columns]
    if not available_pollutants:
        raise ValueError(
            "Dataset must contain at least one pollutant column such as PM2.5, PM10, NO2, SO2, CO, or O3."
        )


def clean_aqi_dataframe(df: pd.DataFrame) -> tuple[pd.DataFrame, CleaningSummary]:
    """Clean a raw AQI dataframe and return the cleaned data plus summary."""

    input_rows = len(df)
    cleaned = standardize_columns(df)
    validate_required_columns(cleaned)

    cleaned[DATE_COLUMN] = pd.to_datetime(cleaned[DATE_COLUMN], errors="coerce")

    numeric_columns = [column for column in [*POLLUTANT_COLUMNS, TARGET_COLUMN] if column in cleaned.columns]
    for column in numeric_columns:
        cleaned[column] = pd.to_numeric(cleaned[column], errors="coerce")
        cleaned.loc[cleaned[column] < 0, column] = pd.NA

    cleaned = cleaned.dropna(subset=[DATE_COLUMN, TARGET_COLUMN]).copy()

    available_pollutants = [column for column in POLLUTANT_COLUMNS if column in cleaned.columns]
    if CITY_COLUMN in cleaned.columns:
        for column in available_pollutants:
            city_medians = cleaned.groupby(CITY_COLUMN)[column].transform("median")
            cleaned[column] = cleaned[column].fillna(city_medians)

    for column in available_pollutants:
        cleaned[column] = cleaned[column].fillna(cleaned[column].median())

    cleaned["aqi_category"] = cleaned[TARGET_COLUMN].apply(classify_aqi)

    selected_columns = [column for column in [*BASE_COLUMNS, AQI_BUCKET_COLUMN, "aqi_category"] if column in cleaned.columns]
    extra_columns = [column for column in cleaned.columns if column not in selected_columns]
    cleaned = cleaned[[*selected_columns, *extra_columns]]

    sort_columns = [column for column in [CITY_COLUMN, DATE_COLUMN] if column in cleaned.columns]
    if sort_columns:
        cleaned = cleaned.sort_values(sort_columns).reset_index(drop=True)

    summary = CleaningSummary(
        input_rows=input_rows,
        output_rows=len(cleaned),
        removed_rows=input_rows - len(cleaned),
        columns=list(cleaned.columns),
        missing_values_after_cleaning=cleaned.isna().sum().to_dict(),
    )

    return cleaned, summary


def clean_dataset(
    input_path: str | Path = DEFAULT_RAW_DATASET,
    output_path: str | Path = DEFAULT_CLEAN_DATASET,
) -> CleaningSummary:
    """Load, clean, and save an AQI dataset."""

    raw_df = load_raw_dataset(input_path)
    cleaned_df, summary = clean_aqi_dataframe(raw_df)

    output_file = Path(output_path)
    output_file.parent.mkdir(parents=True, exist_ok=True)
    cleaned_df.to_csv(output_file, index=False)

    return summary


def _parse_args() -> argparse.Namespace:
    """Parse command-line arguments for the cleaning script."""

    parser = argparse.ArgumentParser(description="Clean an India AQI CSV dataset.")
    parser.add_argument(
        "input_path",
        nargs="?",
        default=DEFAULT_RAW_DATASET,
        help="Path to raw AQI CSV. Defaults to data/raw/city_day.csv.",
    )
    parser.add_argument(
        "--output",
        default=DEFAULT_CLEAN_DATASET,
        help="Path for cleaned CSV. Defaults to data/processed/clean_aqi_data.csv.",
    )
    return parser.parse_args()


if __name__ == "__main__":
    args = _parse_args()
    result = clean_dataset(input_path=args.input_path, output_path=args.output)
    print("Cleaning complete")
    print(f"Rows before: {result.input_rows}")
    print(f"Rows after: {result.output_rows}")
    print(f"Rows removed: {result.removed_rows}")
    print(f"Columns: {', '.join(result.columns)}")
