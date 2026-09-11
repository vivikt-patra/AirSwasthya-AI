"""Build Review 2 Odisha-first PM2.5 forecasting artifacts."""

from __future__ import annotations

import json
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import pandas as pd

from src.config import MODELS_DIR, PROCESSED_DATA_DIR
from src.location_sources import ordered_locations
from src.odisha_pdf_ingest import extract_ospcb_dhq_pdfs, target_area_readiness
from src.open_meteo_client import fetch_and_save_location_data
from src.time_series_forecasting import train_time_series_models


def main() -> None:
    """Fetch data, extract official PDFs, train forecasts, and save a manifest."""

    ospcb_df = extract_ospcb_dhq_pdfs()
    readiness_df = target_area_readiness(ospcb_df)
    readiness_path = PROCESSED_DATA_DIR / "target_area_readiness.csv"
    readiness_df.to_csv(readiness_path, index=False)

    manifest: dict[str, object] = {
        "status": "review_2_odisha_forecasting_artifacts",
        "ground_truth_note": (
            "OSPCB PDFs provide official monthly district readings for Koraput and Nawarangpur. "
            "Open-Meteo provides recent gridded PM2.5 time series for all priority areas and is "
            "used for the 7-day demo forecast until daily local ground-sensor history is available."
        ),
        "ospcb_rows": int(len(ospcb_df)),
        "readiness_csv": str(readiness_path),
        "locations": {},
    }

    for location in ordered_locations():
        _hourly_path, daily_path = fetch_and_save_location_data(location)
        daily_df = pd.read_csv(daily_path, parse_dates=["date"])
        run = train_time_series_models(daily_df, location_slug=location.slug)
        manifest["locations"][location.slug] = {
            "name": location.name,
            "priority": location.priority,
            "best_model_name": run.best_model_name,
            "metrics_path": str(run.metrics_path),
            "forecast_path": str(run.forecast_path),
            "validation_path": str(run.validation_path),
            "decomposition_path": str(run.decomposition_path),
            "model_note": location.model_note,
        }

    manifest_path = MODELS_DIR / "review2_manifest.json"
    manifest_path.parent.mkdir(parents=True, exist_ok=True)
    manifest_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")

    print("Review 2 pipeline complete")
    print(f"OSPCB rows: {len(ospcb_df)}")
    print(f"Readiness: {readiness_path}")
    print(f"Manifest: {manifest_path}")


if __name__ == "__main__":
    main()
