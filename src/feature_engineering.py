"""Feature engineering for explainable AQI forecasting."""

from __future__ import annotations

from dataclasses import dataclass

import pandas as pd

from src.data_schema import CITY_COLUMN, DATE_COLUMN, POLLUTANT_COLUMNS, TARGET_COLUMN


DEFAULT_LAGS = [1, 2, 3, 7]
DEFAULT_WINDOWS = [3, 7]


@dataclass(frozen=True)
class FeatureEngineeringSummary:
    """Short summary that can be used in reports or review notes."""

    forecast_horizon_days: int
    input_rows: int
    output_rows: int
    feature_count: int
    target_column: str
    feature_columns: list[str]


def add_date_features(df: pd.DataFrame) -> pd.DataFrame:
    """Add simple calendar features from the date column."""

    featured = df.copy()
    featured[DATE_COLUMN] = pd.to_datetime(featured[DATE_COLUMN], errors="coerce")
    featured["year"] = featured[DATE_COLUMN].dt.year
    featured["month"] = featured[DATE_COLUMN].dt.month
    featured["day"] = featured[DATE_COLUMN].dt.day
    featured["day_of_week"] = featured[DATE_COLUMN].dt.dayofweek
    featured["quarter"] = featured[DATE_COLUMN].dt.quarter
    featured["season"] = featured["month"].map(_month_to_season)
    return featured


def add_lag_features(
    df: pd.DataFrame,
    columns: list[str] | None = None,
    lags: list[int] | None = None,
) -> pd.DataFrame:
    """Add previous-day values for AQI and pollutant columns."""

    featured = _sort_for_time_features(df)
    lag_columns = columns or [TARGET_COLUMN, *[column for column in POLLUTANT_COLUMNS if column in featured.columns]]
    lag_days = lags or DEFAULT_LAGS

    for column in lag_columns:
        if column not in featured.columns:
            continue
        for lag in lag_days:
            new_column = f"{column}_lag_{lag}"
            if CITY_COLUMN in featured.columns:
                featured[new_column] = featured.groupby(CITY_COLUMN)[column].shift(lag)
            else:
                featured[new_column] = featured[column].shift(lag)

    return featured


def add_rolling_features(
    df: pd.DataFrame,
    columns: list[str] | None = None,
    windows: list[int] | None = None,
) -> pd.DataFrame:
    """Add rolling averages that smooth short-term pollution changes."""

    featured = _sort_for_time_features(df)
    rolling_columns = columns or [TARGET_COLUMN, *[column for column in POLLUTANT_COLUMNS if column in featured.columns]]
    rolling_windows = windows or DEFAULT_WINDOWS

    for column in rolling_columns:
        if column not in featured.columns:
            continue
        for window in rolling_windows:
            new_column = f"{column}_rolling_mean_{window}"
            if CITY_COLUMN in featured.columns:
                featured[new_column] = (
                    featured.groupby(CITY_COLUMN)[column]
                    .transform(lambda values: values.shift(1).rolling(window=window, min_periods=1).mean())
                )
            else:
                featured[new_column] = featured[column].shift(1).rolling(window=window, min_periods=1).mean()

    return featured


def create_forecast_target(df: pd.DataFrame, forecast_horizon_days: int = 1) -> pd.DataFrame:
    """Create target AQI value for the selected future forecast horizon."""

    if forecast_horizon_days < 1 or forecast_horizon_days > 7:
        raise ValueError("forecast_horizon_days must be between 1 and 7.")

    featured = _sort_for_time_features(df)
    target_name = forecast_target_name(forecast_horizon_days)

    if CITY_COLUMN in featured.columns:
        featured[target_name] = featured.groupby(CITY_COLUMN)[TARGET_COLUMN].shift(-forecast_horizon_days)
    else:
        featured[target_name] = featured[TARGET_COLUMN].shift(-forecast_horizon_days)

    return featured


def build_model_frame(
    df: pd.DataFrame,
    forecast_horizon_days: int = 1,
) -> tuple[pd.DataFrame, FeatureEngineeringSummary]:
    """Create a model-ready dataframe for AQI forecasting."""

    input_rows = len(df)
    featured = add_date_features(df)
    featured = add_lag_features(featured)
    featured = add_rolling_features(featured)
    featured = create_forecast_target(featured, forecast_horizon_days=forecast_horizon_days)

    target_name = forecast_target_name(forecast_horizon_days)
    featured = featured.dropna(subset=[target_name]).copy()

    feature_columns = get_feature_columns(featured, target_column=target_name)
    featured = featured.dropna(subset=feature_columns).reset_index(drop=True)

    summary = FeatureEngineeringSummary(
        forecast_horizon_days=forecast_horizon_days,
        input_rows=input_rows,
        output_rows=len(featured),
        feature_count=len(feature_columns),
        target_column=target_name,
        feature_columns=feature_columns,
    )

    return featured, summary


def get_feature_columns(df: pd.DataFrame, target_column: str) -> list[str]:
    """Return numeric model feature columns while excluding identifiers and targets."""

    excluded = {
        DATE_COLUMN,
        CITY_COLUMN,
        TARGET_COLUMN,
        target_column,
        "aqi_bucket",
        "aqi_category",
    }
    numeric_columns = list(df.select_dtypes(include=["number"]).columns)
    return [column for column in numeric_columns if column not in excluded]


def forecast_target_name(forecast_horizon_days: int) -> str:
    """Return the target column name for a forecast horizon."""

    return f"aqi_next_{forecast_horizon_days}_day"


def _sort_for_time_features(df: pd.DataFrame) -> pd.DataFrame:
    """Sort by city/date when available before lag or rolling calculations."""

    sort_columns = [column for column in [CITY_COLUMN, DATE_COLUMN] if column in df.columns]
    if not sort_columns:
        return df.copy()
    return df.sort_values(sort_columns).copy()


def _month_to_season(month: int) -> int:
    """Map month to simple India-oriented season code.

    1: winter, 2: summer/pre-monsoon, 3: monsoon, 4: post-monsoon
    """

    if month in [12, 1, 2]:
        return 1
    if month in [3, 4, 5]:
        return 2
    if month in [6, 7, 8, 9]:
        return 3
    return 4

