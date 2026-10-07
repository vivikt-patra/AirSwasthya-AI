"""Run live Koraput benchmark battle: Real Web AQI vs AirSwasthya AI SARIMAX Model."""

from __future__ import annotations

import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import json
from urllib.request import urlopen
import pandas as pd

from src.location_sources import PRIORITY_LOCATIONS
from src.open_meteo_client import fetch_open_meteo_payload, hourly_payload_to_frame, hourly_to_daily
from src.aqi_rules import get_pm25_advisory, classify_pm25
from src.time_series_forecasting import train_time_series_models


def run_battle():
    koraput = PRIORITY_LOCATIONS["koraput"]
    print(f"Fetching live Open-Meteo series for Koraput ({koraput.latitude}, {koraput.longitude})...")
    
    payload = fetch_open_meteo_payload(koraput, past_days=92, forecast_days=7)
    hourly_df = hourly_payload_to_frame(payload, koraput)
    daily_df = hourly_to_daily(hourly_df)
    
    # Save temporary CSV
    daily_path = PROJECT_ROOT / "data" / "processed" / "open_meteo" / "koraput_daily.csv"
    daily_df.to_csv(daily_path, index=False)
    
    # Train AirSwasthya SARIMAX model
    run = train_time_series_models(daily_df, location_slug="koraput")
    
    print("\n========================================================")
    print("       AIRSWASTHYA AI vs REAL WEB BENCHMARK BATTLE      ")
    print("========================================================\n")
    
    # Read validation CSV
    val_df = pd.read_csv(run.validation_path)
    sarimax_val = val_df[val_df["model"] == "sarimax"].tail(3)
    
    print("AIRSWASTHYA AI 3-DAY MODEL PERFORMANCE (Validation Window):")
    for _, row in sarimax_val.iterrows():
        pm25 = row['predicted_pm25']
        adv = get_pm25_advisory(pm25)
        print(f" Date: {row['date']} | Actual: {row['actual_pm25']:.2f} µg/m³ | AirSwasthya SARIMAX: {pm25:.2f} µg/m³ | Error: {row['absolute_error']:.2f} µg/m³ | CPCB Category: {adv.category}")
    
    # Read 7-day future forecast CSV
    forecast_df = pd.read_csv(run.forecast_path).head(3)
    print("\nAIRSWASTHYA AI 3-DAY FUTURE PREDICTION (Next 3 Days):")
    for _, row in forecast_df.iterrows():
        pm25 = row['predicted_pm25']
        adv = get_pm25_advisory(pm25)
        print(f" Date: {row['date']} | AirSwasthya Predicted PM2.5: {pm25:.2f} µg/m³ | Category: {adv.category} | Risk: {adv.risk_level} | Advice: {adv.message}")
        
    print("\nSARIMAX Overall Metrics on Koraput:")
    sarimax_metrics = run.metrics.get("sarimax", {})
    print(f" MAE:  {sarimax_metrics.get('mae')} µg/m³")
    print(f" RMSE: {sarimax_metrics.get('rmse')} µg/m³")
    print(f" R²:   {sarimax_metrics.get('r2') * 100:.2f}%")


if __name__ == "__main__":
    run_battle()
