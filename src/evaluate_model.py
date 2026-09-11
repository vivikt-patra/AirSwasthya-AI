"""Model evaluation helpers for AQI regression models."""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score


@dataclass(frozen=True)
class RegressionMetrics:
    """Standard regression metrics used for model comparison."""

    mae: float
    rmse: float
    r2: float

    def as_dict(self) -> dict[str, float]:
        """Return metrics as a JSON-serializable dictionary."""

        return {
            "mae": round(float(self.mae), 4),
            "rmse": round(float(self.rmse), 4),
            "r2": round(float(self.r2), 4),
        }


def calculate_regression_metrics(y_true: np.ndarray, y_pred: np.ndarray) -> RegressionMetrics:
    """Calculate MAE, RMSE, and R2 score."""

    mae = mean_absolute_error(y_true, y_pred)
    rmse = np.sqrt(mean_squared_error(y_true, y_pred))
    r2 = r2_score(y_true, y_pred)
    return RegressionMetrics(mae=mae, rmse=rmse, r2=r2)


def select_best_model(metrics_by_model: dict[str, dict[str, float]]) -> str:
    """Select the best model using lowest RMSE, then highest R2 as tie-breaker."""

    if not metrics_by_model:
        raise ValueError("No model metrics were provided.")

    return min(
        metrics_by_model,
        key=lambda model_name: (
            metrics_by_model[model_name]["rmse"],
            -metrics_by_model[model_name]["r2"],
        ),
    )
