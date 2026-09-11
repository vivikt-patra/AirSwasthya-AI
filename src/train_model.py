"""Train and save explainable AQI forecasting models."""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import joblib
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression

from src.config import MODELS_DIR, PROCESSED_DATA_DIR
from src.evaluate_model import calculate_regression_metrics, select_best_model
from src.feature_engineering import build_model_frame


DEFAULT_CLEAN_DATASET = PROCESSED_DATA_DIR / "clean_aqi_data.csv"
DEFAULT_MODEL_PATH = MODELS_DIR / "best_model.joblib"
DEFAULT_METRICS_PATH = MODELS_DIR / "model_metrics.json"


@dataclass(frozen=True)
class TrainingResult:
    """Summary of a model-training run."""

    best_model_name: str
    model_path: Path
    metrics_path: Path
    metrics_by_model: dict[str, dict[str, float]]
    feature_columns: list[str]
    target_column: str
    train_rows: int
    test_rows: int


def get_candidate_models(random_state: int = 42) -> dict[str, Any]:
    """Return simple candidate models for first-version AQI forecasting."""

    return {
        "linear_regression": LinearRegression(),
        "random_forest": RandomForestRegressor(
            n_estimators=200,
            max_depth=14,
            min_samples_leaf=2,
            random_state=random_state,
            n_jobs=-1,
        ),
    }


def train_and_select_model(
    clean_dataset_path: str | Path = DEFAULT_CLEAN_DATASET,
    forecast_horizon_days: int = 1,
    model_output_path: str | Path = DEFAULT_MODEL_PATH,
    metrics_output_path: str | Path = DEFAULT_METRICS_PATH,
    test_size: float = 0.2,
    random_state: int = 42,
) -> TrainingResult:
    """Train candidate models, compare metrics, and save the best model."""

    clean_dataset = Path(clean_dataset_path)
    if not clean_dataset.exists():
        raise FileNotFoundError(
            f"Clean dataset not found at {clean_dataset}. Run src.data_cleaning first."
        )

    cleaned_df = pd.read_csv(clean_dataset, parse_dates=["date"])
    model_frame, feature_summary = build_model_frame(
        cleaned_df,
        forecast_horizon_days=forecast_horizon_days,
    )

    train_df, test_df = time_ordered_train_test_split(model_frame, test_size=test_size)
    x_train = train_df[feature_summary.feature_columns]
    y_train = train_df[feature_summary.target_column]
    x_test = test_df[feature_summary.feature_columns]
    y_test = test_df[feature_summary.target_column]

    candidate_models = get_candidate_models(random_state=random_state)
    trained_models: dict[str, Any] = {}
    metrics_by_model: dict[str, dict[str, float]] = {}

    for model_name, model in candidate_models.items():
        model.fit(x_train, y_train)
        predictions = model.predict(x_test)
        metrics = calculate_regression_metrics(y_test.to_numpy(), predictions)
        trained_models[model_name] = model
        metrics_by_model[model_name] = metrics.as_dict()

    best_model_name = select_best_model(metrics_by_model)
    best_model = trained_models[best_model_name]

    model_path = Path(model_output_path)
    metrics_path = Path(metrics_output_path)
    model_path.parent.mkdir(parents=True, exist_ok=True)
    metrics_path.parent.mkdir(parents=True, exist_ok=True)

    model_artifact = {
        "model": best_model,
        "model_name": best_model_name,
        "feature_columns": feature_summary.feature_columns,
        "target_column": feature_summary.target_column,
        "forecast_horizon_days": forecast_horizon_days,
        "metrics": metrics_by_model[best_model_name],
    }
    joblib.dump(model_artifact, model_path)

    metrics_payload = {
        "best_model_name": best_model_name,
        "forecast_horizon_days": forecast_horizon_days,
        "target_column": feature_summary.target_column,
        "feature_columns": feature_summary.feature_columns,
        "train_rows": len(train_df),
        "test_rows": len(test_df),
        "metrics_by_model": metrics_by_model,
    }
    metrics_path.write_text(json.dumps(metrics_payload, indent=2), encoding="utf-8")

    return TrainingResult(
        best_model_name=best_model_name,
        model_path=model_path,
        metrics_path=metrics_path,
        metrics_by_model=metrics_by_model,
        feature_columns=feature_summary.feature_columns,
        target_column=feature_summary.target_column,
        train_rows=len(train_df),
        test_rows=len(test_df),
    )


def time_ordered_train_test_split(
    df: pd.DataFrame,
    test_size: float = 0.2,
) -> tuple[pd.DataFrame, pd.DataFrame]:
    """Split data without shuffling so future rows stay in the test set."""

    if not 0 < test_size < 1:
        raise ValueError("test_size must be between 0 and 1.")

    if len(df) < 10:
        raise ValueError("At least 10 model-ready rows are required for train/test split.")

    split_index = int(len(df) * (1 - test_size))
    if split_index <= 0 or split_index >= len(df):
        raise ValueError("Train/test split produced an empty train or test set.")

    train_df = df.iloc[:split_index].copy()
    test_df = df.iloc[split_index:].copy()
    return train_df, test_df


if __name__ == "__main__":
    result = train_and_select_model()
    print("Training complete")
    print(f"Best model: {result.best_model_name}")
    print(f"Train rows: {result.train_rows}")
    print(f"Test rows: {result.test_rows}")
    print(f"Model saved to: {result.model_path}")
    print(f"Metrics saved to: {result.metrics_path}")

