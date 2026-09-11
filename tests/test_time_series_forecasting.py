import numpy as np
import pandas as pd

from src.time_series_forecasting import build_daily_pm25_series, decompose_pm25_series, run_stationarity_tests


def test_time_series_helpers_prepare_stationarity_and_decomposition():
    dates = pd.date_range("2026-01-01", periods=45, freq="D")
    df = pd.DataFrame(
        {
            "date": dates,
            "pm25": np.linspace(20, 45, len(dates)) + np.sin(np.arange(len(dates))),
        }
    )

    series = build_daily_pm25_series(df)
    stationarity = run_stationarity_tests(series)
    decomposition = decompose_pm25_series(series)

    assert len(series) == 45
    assert "adf_p_value" in stationarity
    assert set(["observed", "trend", "seasonal", "residual"]).issubset(decomposition.columns)
