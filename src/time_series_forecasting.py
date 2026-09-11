"""Statsmodels-based PM2.5 time-series forecasting for Review 2."""

from __future__ import annotations

import json
import warnings
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
from statsmodels.tsa.seasonal import seasonal_decompose
from statsmodels.tsa.statespace.sarimax import SARIMAX
from statsmodels.tsa.stattools import adfuller, kpss

from src.config import MODELS_DIR, PROCESSED_DATA_DIR
from src.evaluate_model import calculate_regression_metrics


DEFAULT_TS_OUTPUT_DIR = PROCESSED_DATA_DIR / "forecasts"
DEFAULT_TS_METRICS_DIR = MODELS_DIR / "time_series"
EXOG_COLUMNS = ["pm10", "no2", "so2", "o3", "co"]


@dataclass(frozen=True)
class TimeSeriesRun:
    """File outputs and metrics for one PM2.5 forecasting run."""

    location_slug: str
    best_model_name: str
    metrics: dict[str, dict[str, float | int | None]]
    stationarity: dict[str, Any]
    validation_path: Path
    forecast_path: Path
    metrics_path: Path
    decomposition_path: Path


def build_daily_pm25_series(df: pd.DataFrame) -> pd.Series:
    """Return a complete daily PM2.5 series from a dataframe."""

    if "date" not in df.columns or "pm25" not in df.columns:
        raise ValueError("Dataframe must contain date and pm25 columns.")

    daily = df.copy()
    daily["date"] = pd.to_datetime(daily["date"], errors="coerce")
    daily["pm25"] = pd.to_numeric(daily["pm25"], errors="coerce")
    daily = daily.dropna(subset=["date", "pm25"])
    if daily.empty:
        raise ValueError("No valid PM2.5 rows are available.")

    series = daily.groupby("date")["pm25"].mean().sort_index()
    series = series.asfreq("D")
    series = series.interpolate(limit_direction="both").ffill().bfill()
    series.name = "pm25"
    return series


def build_daily_exog_frame(df: pd.DataFrame) -> pd.DataFrame:
    """Return daily exogenous pollutant features aligned by date."""

    available = [column for column in EXOG_COLUMNS if column in df.columns]
    if not available:
        return pd.DataFrame()

    exog = df.copy()
    exog["date"] = pd.to_datetime(exog["date"], errors="coerce")
    for column in available:
        exog[column] = pd.to_numeric(exog[column], errors="coerce")
    exog = exog.dropna(subset=["date"])
    daily = exog.groupby("date")[available].mean(numeric_only=True).sort_index().asfreq("D")
    return daily.interpolate(limit_direction="both").ffill().bfill()


def run_stationarity_tests(series: pd.Series) -> dict[str, Any]:
    """Run ADF and KPSS tests with review-friendly interpretations."""

    values = series.dropna()
    if len(values) < 20:
        return {"status": "insufficient_data", "rows": int(len(values))}

    result: dict[str, Any] = {"rows": int(len(values))}
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        adf_result = adfuller(values, autolag="AIC")
        result["adf_p_value"] = round(float(adf_result[1]), 6)
        result["adf_interpretation"] = (
            "likely stationary" if adf_result[1] < 0.05 else "not clearly stationary"
        )

        try:
            kpss_result = kpss(values, regression="c", nlags="auto")
            result["kpss_p_value"] = round(float(kpss_result[1]), 6)
            result["kpss_interpretation"] = (
                "likely stationary" if kpss_result[1] >= 0.05 else "trend/level shift likely"
            )
        except Exception as exc:  # statsmodels can fail on near-constant series.
            result["kpss_error"] = str(exc)

    return result


def decompose_pm25_series(series: pd.Series, period: int = 7) -> pd.DataFrame:
    """Return observed/trend/seasonal/residual decomposition rows."""

    values = series.dropna()
    if len(values) < period * 2:
        return pd.DataFrame(columns=["date", "observed", "trend", "seasonal", "residual"])

    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        decomposition = seasonal_decompose(values, model="additive", period=period, extrapolate_trend="freq")

    return pd.DataFrame(
        {
            "date": values.index,
            "observed": decomposition.observed.to_numpy(),
            "trend": decomposition.trend.to_numpy(),
            "seasonal": decomposition.seasonal.to_numpy(),
            "residual": decomposition.resid.to_numpy(),
        }
    )


def train_time_series_models(
    daily_df: pd.DataFrame,
    location_slug: str,
    horizon_days: int = 7,
    output_dir: str | Path = DEFAULT_TS_OUTPUT_DIR,
    metrics_dir: str | Path = DEFAULT_TS_METRICS_DIR,
) -> TimeSeriesRun:
    """Train baseline, ARIMA, SARIMA, and SARIMAX models for PM2.5."""

    history_df = _history_only(daily_df)
    series = build_daily_pm25_series(history_df)
    if len(series.dropna()) < 35:
        raise ValueError("At least 35 daily PM2.5 history rows are needed for 7-day time-series validation.")

    exog_full = build_daily_exog_frame(daily_df)
    train = series.iloc[:-horizon_days]
    test = series.iloc[-horizon_days:]
    train_exog, test_exog = _split_exog(exog_full, train.index, test.index)

    validation_rows: list[pd.DataFrame] = []
    metrics: dict[str, dict[str, float | int | None]] = {}

    for model_name in ["naive_last_value", "arima", "sarima", "sarimax"]:
        try:
            predicted = _validation_forecast(model_name, train, horizon_days, train_exog, test_exog)
            model_metrics = calculate_regression_metrics(test.to_numpy(), predicted.to_numpy()).as_dict()
            model_metrics.update(_spike_metrics(train, test, predicted))
            metrics[model_name] = model_metrics
            validation_rows.append(
                pd.DataFrame(
                    {
                        "date": test.index,
                        "model": model_name,
                        "actual_pm25": test.to_numpy(),
                        "predicted_pm25": predicted.to_numpy(),
                        "absolute_error": np.abs(test.to_numpy() - predicted.to_numpy()),
                    }
                )
            )
        except Exception as exc:
            metrics[model_name] = {"error": str(exc), "mae": None, "rmse": None, "r2": None}

    best_model_name = _select_best_time_series_model(metrics)
    forecast_df = _future_forecast(best_model_name, series, exog_full, horizon_days)
    validation_df = pd.concat(validation_rows, ignore_index=True) if validation_rows else pd.DataFrame()
    decomposition_df = decompose_pm25_series(series)
    stationarity = run_stationarity_tests(series)

    output_path = Path(output_dir)
    metrics_path_dir = Path(metrics_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    metrics_path_dir.mkdir(parents=True, exist_ok=True)

    validation_path = output_path / f"{location_slug}_validation_7_day.csv"
    forecast_path = output_path / f"{location_slug}_forecast_7_day.csv"
    decomposition_path = output_path / f"{location_slug}_decomposition.csv"
    metrics_path = metrics_path_dir / f"{location_slug}_metrics.json"

    validation_df.to_csv(validation_path, index=False)
    forecast_df.to_csv(forecast_path, index=False)
    decomposition_df.to_csv(decomposition_path, index=False)

    payload = {
        "location_slug": location_slug,
        "best_model_name": best_model_name,
        "history_rows": int(len(series)),
        "history_start": str(series.index.min().date()),
        "history_end": str(series.index.max().date()),
        "horizon_days": horizon_days,
        "stationarity": stationarity,
        "metrics_by_model": metrics,
        "outputs": {
            "validation_csv": str(validation_path),
            "forecast_csv": str(forecast_path),
            "decomposition_csv": str(decomposition_path),
        },
    }
    metrics_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")

    return TimeSeriesRun(
        location_slug=location_slug,
        best_model_name=best_model_name,
        metrics=metrics,
        stationarity=stationarity,
        validation_path=validation_path,
        forecast_path=forecast_path,
        metrics_path=metrics_path,
        decomposition_path=decomposition_path,
    )


def _history_only(df: pd.DataFrame) -> pd.DataFrame:
    if "data_role" not in df.columns:
        return df
    return df[df["data_role"] == "history"].copy()


def _validation_forecast(
    model_name: str,
    train: pd.Series,
    horizon_days: int,
    train_exog: pd.DataFrame,
    test_exog: pd.DataFrame,
) -> pd.Series:
    if model_name == "naive_last_value":
        return pd.Series([float(train.iloc[-1])] * horizon_days, index=pd.date_range(train.index[-1] + pd.Timedelta(days=1), periods=horizon_days))

    if model_name == "arima":
        fit = _fit_sarimax(train, order=(1, 1, 1), seasonal_order=(0, 0, 0, 0))
        return fit.forecast(steps=horizon_days)

    if model_name == "sarima":
        fit = _fit_sarimax(train, order=(1, 1, 1), seasonal_order=(1, 0, 1, 7))
        return fit.forecast(steps=horizon_days)

    if model_name == "sarimax":
        if train_exog.empty or test_exog.empty:
            raise ValueError("SARIMAX needs exogenous pollutant columns.")
        fit = _fit_sarimax(train, order=(1, 1, 1), seasonal_order=(1, 0, 1, 7), exog=train_exog)
        return fit.forecast(steps=horizon_days, exog=test_exog)

    raise ValueError(f"Unknown model: {model_name}")


def _future_forecast(
    model_name: str,
    series: pd.Series,
    exog_full: pd.DataFrame,
    horizon_days: int,
) -> pd.DataFrame:
    future_index = pd.date_range(series.index.max() + pd.Timedelta(days=1), periods=horizon_days, freq="D")
    history_exog = exog_full.reindex(series.index).interpolate(limit_direction="both").ffill().bfill()
    future_exog = exog_full.reindex(future_index).interpolate(limit_direction="both").ffill().bfill()

    try:
        if model_name == "sarimax" and not history_exog.empty and not future_exog.empty:
            fit = _fit_sarimax(series, order=(1, 1, 1), seasonal_order=(1, 0, 1, 7), exog=history_exog)
            forecast = fit.forecast(steps=horizon_days, exog=future_exog)
        elif model_name == "sarima":
            fit = _fit_sarimax(series, order=(1, 1, 1), seasonal_order=(1, 0, 1, 7))
            forecast = fit.forecast(steps=horizon_days)
        elif model_name == "arima":
            fit = _fit_sarimax(series, order=(1, 1, 1), seasonal_order=(0, 0, 0, 0))
            forecast = fit.forecast(steps=horizon_days)
        else:
            forecast = pd.Series([float(series.iloc[-1])] * horizon_days, index=future_index)
    except Exception:
        model_name = "naive_last_value_fallback"
        forecast = pd.Series([float(series.iloc[-1])] * horizon_days, index=future_index)

    return pd.DataFrame(
        {
            "date": future_index,
            "model": model_name,
            "predicted_pm25": np.maximum(forecast.to_numpy(dtype=float), 0),
        }
    )


def _fit_sarimax(
    series: pd.Series,
    order: tuple[int, int, int],
    seasonal_order: tuple[int, int, int, int],
    exog: pd.DataFrame | None = None,
) -> Any:
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        model = SARIMAX(
            series,
            order=order,
            seasonal_order=seasonal_order,
            exog=exog,
            enforce_stationarity=False,
            enforce_invertibility=False,
        )
        return model.fit(disp=False, maxiter=100)


def _split_exog(
    exog_full: pd.DataFrame,
    train_index: pd.DatetimeIndex,
    test_index: pd.DatetimeIndex,
) -> tuple[pd.DataFrame, pd.DataFrame]:
    if exog_full.empty:
        return pd.DataFrame(), pd.DataFrame()
    train_exog = exog_full.reindex(train_index).interpolate(limit_direction="both").ffill().bfill()
    test_exog = exog_full.reindex(test_index).interpolate(limit_direction="both").ffill().bfill()
    return train_exog, test_exog


def _spike_metrics(train: pd.Series, test: pd.Series, predicted: pd.Series) -> dict[str, float | int | None]:
    prior_and_test = pd.concat([train.tail(1), test])
    changes = prior_and_test.diff().abs().iloc[1:]
    threshold = max(5.0, float(train.diff().abs().dropna().quantile(0.75)))
    spike_mask = changes > threshold
    errors = np.abs(test.to_numpy(dtype=float) - predicted.to_numpy(dtype=float))

    spike_count = int(spike_mask.sum())
    spike_mae = float(errors[spike_mask.to_numpy()].mean()) if spike_count else None
    normal_mae = float(errors[~spike_mask.to_numpy()].mean()) if spike_count < len(errors) else None
    return {
        "spike_threshold": round(threshold, 4),
        "spike_day_count": spike_count,
        "spike_mae": None if spike_mae is None else round(spike_mae, 4),
        "normal_day_mae": None if normal_mae is None else round(normal_mae, 4),
    }


def _select_best_time_series_model(metrics: dict[str, dict[str, float | int | None]]) -> str:
    candidates = {
        name: row
        for name, row in metrics.items()
        if row.get("rmse") is not None and isinstance(row.get("rmse"), (int, float))
    }
    if not candidates:
        return "naive_last_value"
    return min(candidates, key=lambda name: float(candidates[name]["rmse"]))  # type: ignore[arg-type]
