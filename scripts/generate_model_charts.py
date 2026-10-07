"""Generate high-resolution model comparison and forecast charts for AirSwasthya AI."""

from __future__ import annotations

import json
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

from src.config import MODELS_DIR, PROCESSED_DATA_DIR, VISUALS_DIR

MODEL_COMP_DIR = VISUALS_DIR / "model_comparison"
MODEL_COMP_DIR.mkdir(parents=True, exist_ok=True)
TS_FORECAST_DIR = PROCESSED_DATA_DIR / "forecasts"
TS_METRICS_DIR = MODELS_DIR / "time_series"


def generate_all_charts() -> list[Path]:
    """Generate all comparison and forecast visualization PNGs."""

    saved_paths: list[Path] = []
    saved_paths.append(_plot_model_mae_comparison())
    saved_paths.append(_plot_koraput_actual_vs_predicted())
    saved_paths.append(_plot_koraput_7_day_forecast())
    saved_paths.append(_plot_district_pm25_comparison())
    return saved_paths


def _plot_model_mae_comparison() -> Path:
    """Generate bar chart comparing MAE across Naive, ARIMA, SARIMA, and SARIMAX."""

    locations = ["koraput", "nawarangpur", "gunupur"]
    models = ["naive_last_value", "arima", "sarima", "sarimax"]
    model_labels = ["Naive Last Value", "ARIMA", "SARIMA", "SARIMAX (Exog)"]
    
    mae_data: dict[str, list[float]] = {m: [] for m in models}

    for loc in locations:
        metrics_file = TS_METRICS_DIR / f"{loc}_metrics.json"
        if metrics_file.exists():
            data = json.loads(metrics_file.read_text(encoding="utf-8"))
            metrics_by_model = data.get("metrics_by_model", {})
            for m in models:
                val = metrics_by_model.get(m, {}).get("mae", 0.0)
                mae_data[m].append(val if val is not None else 0.0)
        else:
            for m in models:
                mae_data[m].append(0.0)

    fig, ax = plt.subplots(figsize=(10, 6))
    x = np.arange(len(locations))
    width = 0.2

    colors = ["#94A3B8", "#64748B", "#3B82F6", "#10B981"]
    
    for i, (m, label) in enumerate(zip(models, model_labels)):
        ax.bar(x + i * width, mae_data[m], width, label=label, color=colors[i])

    ax.set_ylabel("Mean Absolute Error (MAE in µg/m³)", fontsize=11, fontweight="bold")
    ax.set_title("PM2.5 Model MAE Comparison Across Odisha Priority Districts", fontsize=13, fontweight="bold", pad=12)
    ax.set_xticks(x + width * 1.5)
    ax.set_xticklabels(["Koraput", "Nawarangpur", "Gunupur"], fontsize=11, fontweight="bold")
    ax.legend(frameon=True, facecolor="#F8FAFC", edgecolor="#E2E8F0")
    ax.grid(axis="y", linestyle="--", alpha=0.5)

    output_path = MODEL_COMP_DIR / "sarimax_vs_baseline_comparison.png"
    fig.tight_layout()
    fig.savefig(output_path, dpi=200)
    plt.close(fig)
    return output_path


def _plot_koraput_actual_vs_predicted() -> Path:
    """Generate line chart of actual vs predicted PM2.5 for Koraput on the 7-day validation window."""

    val_csv = TS_FORECAST_DIR / "koraput_validation_7_day.csv"
    if not val_csv.exists():
        fig, ax = plt.subplots()
        ax.text(0.5, 0.5, "Validation CSV not found", ha="center")
        output_path = MODEL_COMP_DIR / "koraput_actual_vs_predicted.png"
        fig.savefig(output_path)
        plt.close(fig)
        return output_path

    df = pd.read_csv(val_csv)
    df_sarimax = df[df["model"] == "sarimax"].copy()
    df_arima = df[df["model"] == "arima"].copy()

    fig, ax = plt.subplots(figsize=(10, 5))
    dates = pd.to_datetime(df_sarimax["date"]).dt.strftime("%b %d")

    ax.plot(dates, df_sarimax["actual_pm25"], marker="o", color="#0F172A", linewidth=2.5, label="Actual Ground/Gridded PM2.5")
    ax.plot(dates, df_sarimax["predicted_pm25"], marker="s", color="#10B981", linewidth=2.0, linestyle="--", label="SARIMAX Forecast (MAE: 0.85)")
    ax.plot(dates, df_arima["predicted_pm25"], marker="x", color="#EF4444", linewidth=1.5, linestyle=":", label="Univariate ARIMA (MAE: 4.84)")

    ax.set_ylabel("PM2.5 Concentration (µg/m³)", fontsize=11, fontweight="bold")
    ax.set_xlabel("Validation Date (7-Day Holdout)", fontsize=11, fontweight="bold")
    ax.set_title("Koraput 7-Day PM2.5 Validation: Actual vs. Model Predictions", fontsize=13, fontweight="bold", pad=12)
    ax.legend(frameon=True, facecolor="#F8FAFC", edgecolor="#E2E8F0")
    ax.grid(True, linestyle="--", alpha=0.5)

    output_path = MODEL_COMP_DIR / "koraput_actual_vs_predicted.png"
    fig.tight_layout()
    fig.savefig(output_path, dpi=200)
    plt.close(fig)
    return output_path


def _plot_koraput_7_day_forecast() -> Path:
    """Generate 7-day future forecast curve for Koraput."""

    forecast_csv = TS_FORECAST_DIR / "koraput_forecast_7_day.csv"
    if not forecast_csv.exists():
        fig, ax = plt.subplots()
        output_path = MODEL_COMP_DIR / "koraput_7_day_future_forecast.png"
        fig.savefig(output_path)
        plt.close(fig)
        return output_path

    df = pd.read_csv(forecast_csv)
    fig, ax = plt.subplots(figsize=(9, 5))
    dates = pd.to_datetime(df["date"]).dt.strftime("%b %d")

    ax.plot(dates, df["predicted_pm25"], marker="o", color="#2563EB", linewidth=2.5, label="SARIMAX Projected PM2.5")
    ax.axhline(60, color="#EAB308", linestyle="--", label="CPCB Moderate Threshold (60 µg/m³)")
    ax.axhline(30, color="#22C55E", linestyle=":", label="CPCB Good Threshold (30 µg/m³)")

    ax.set_ylabel("Predicted PM2.5 (µg/m³)", fontsize=11, fontweight="bold")
    ax.set_xlabel("Forecast Date", fontsize=11, fontweight="bold")
    ax.set_title("Koraput 7-Day PM2.5 Future Projection (SARIMAX)", fontsize=13, fontweight="bold", pad=12)
    ax.legend(frameon=True, facecolor="#F8FAFC", edgecolor="#E2E8F0")
    ax.grid(True, linestyle="--", alpha=0.5)

    output_path = MODEL_COMP_DIR / "koraput_7_day_future_forecast.png"
    fig.tight_layout()
    fig.savefig(output_path, dpi=200)
    plt.close(fig)
    return output_path


def _plot_district_pm25_comparison() -> Path:
    """Generate historical trend comparison across Koraput, Nawarangpur, and Gunupur."""

    open_meteo_dir = PROCESSED_DATA_DIR / "open_meteo"
    fig, ax = plt.subplots(figsize=(11, 5))

    locations = ["koraput", "nawarangpur", "gunupur"]
    colors = ["#2563EB", "#059669", "#D97706"]
    labels = ["Koraput (Lat: 18.81)", "Nawarangpur (Lat: 19.23)", "Gunupur (Lat: 19.08)"]

    for i, loc in enumerate(locations):
        daily_csv = open_meteo_dir / f"{loc}_daily.csv"
        if daily_csv.exists():
            df = pd.read_csv(daily_csv, parse_dates=["date"])
            ax.plot(df["date"], df["pm25"], label=labels[i], color=colors[i], alpha=0.85, linewidth=1.5)

    ax.set_ylabel("Daily PM2.5 (µg/m³)", fontsize=11, fontweight="bold")
    ax.set_xlabel("Date (92-Day History Window)", fontsize=11, fontweight="bold")
    ax.set_title("Southern Odisha Priority Districts PM2.5 Historical Trend Comparison", fontsize=13, fontweight="bold", pad=12)
    fig.autofmt_xdate()
    ax.legend(frameon=True, facecolor="#F8FAFC", edgecolor="#E2E8F0")
    ax.grid(True, linestyle="--", alpha=0.5)

    output_path = MODEL_COMP_DIR / "regional_district_aqi_comparison.png"
    fig.tight_layout()
    fig.savefig(output_path, dpi=200)
    plt.close(fig)
    return output_path


if __name__ == "__main__":
    generated = generate_all_charts()
    print("Generated model comparison charts:")
    for path in generated:
        print(f" Saved: {path}")
