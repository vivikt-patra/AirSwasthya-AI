"""Prediction helpers for saved AirSwasthya AI models."""

from __future__ import annotations

from pathlib import Path
from typing import Any

import joblib
import pandas as pd

from src.aqi_rules import AQIAdvice, get_health_advisory
from src.train_model import DEFAULT_MODEL_PATH


def load_model_artifact(model_path: str | Path = DEFAULT_MODEL_PATH) -> dict[str, Any]:
    """Load a saved model artifact created by train_model.py."""

    artifact_path = Path(model_path)
    if not artifact_path.exists():
        raise FileNotFoundError(f"Model artifact not found at {artifact_path}. Train a model first.")
    return joblib.load(artifact_path)


def predict_aqi(model_input: pd.DataFrame, model_path: str | Path = DEFAULT_MODEL_PATH) -> pd.Series:
    """Predict AQI using a saved model artifact."""

    artifact = load_model_artifact(model_path)
    feature_columns = artifact["feature_columns"]
    missing_columns = [column for column in feature_columns if column not in model_input.columns]
    if missing_columns:
        raise ValueError(f"Prediction input is missing feature column(s): {', '.join(missing_columns)}")

    predictions = artifact["model"].predict(model_input[feature_columns])
    return pd.Series(predictions, name="predicted_aqi")


def predict_with_advisory(
    model_input: pd.DataFrame,
    model_path: str | Path = DEFAULT_MODEL_PATH,
) -> pd.DataFrame:
    """Predict AQI and attach category/advisory details."""

    predictions = predict_aqi(model_input, model_path=model_path)
    output = pd.DataFrame({"predicted_aqi": predictions.round(2)})
    advice_values: list[AQIAdvice] = [get_health_advisory(float(value)) for value in predictions]
    output["aqi_category"] = [advice.category for advice in advice_values]
    output["risk_level"] = [advice.risk_level for advice in advice_values]
    output["health_advisory"] = [advice.message for advice in advice_values]
    return output

