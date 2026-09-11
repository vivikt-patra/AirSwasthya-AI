"""EDA visual generation for AirSwasthya AI."""

from __future__ import annotations

from pathlib import Path

import matplotlib.pyplot as plt
import pandas as pd

from src.config import PROCESSED_DATA_DIR, VISUALS_DIR
from src.data_schema import CITY_COLUMN, DATE_COLUMN, POLLUTANT_COLUMNS, TARGET_COLUMN


DEFAULT_CLEAN_DATASET = PROCESSED_DATA_DIR / "clean_aqi_data.csv"
DEFAULT_EDA_DIR = VISUALS_DIR / "eda_graphs"


def generate_eda_visuals(
    clean_dataset_path: str | Path = DEFAULT_CLEAN_DATASET,
    output_dir: str | Path = DEFAULT_EDA_DIR,
) -> list[Path]:
    """Generate basic EDA visuals from cleaned AQI data."""

    dataset_path = Path(clean_dataset_path)
    if not dataset_path.exists():
        raise FileNotFoundError(f"Clean dataset not found at {dataset_path}. Run data cleaning first.")

    df = pd.read_csv(dataset_path, parse_dates=[DATE_COLUMN])
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    generated: list[Path] = []
    generated.append(_save_aqi_trend(df, output_path))
    generated.append(_save_city_average_aqi(df, output_path))
    generated.append(_save_pollutant_correlation(df, output_path))
    generated.append(_save_pollutant_distribution(df, output_path))
    return generated


def _save_aqi_trend(df: pd.DataFrame, output_dir: Path) -> Path:
    daily = df.groupby(DATE_COLUMN, as_index=False)[TARGET_COLUMN].mean()
    fig, ax = plt.subplots(figsize=(10, 5))
    ax.plot(daily[DATE_COLUMN], daily[TARGET_COLUMN], color="#0E7490")
    ax.set_title("Average AQI trend over time")
    ax.set_xlabel("Date")
    ax.set_ylabel("AQI")
    fig.autofmt_xdate()
    return _save_figure(fig, output_dir / "aqi_trend.png")


def _save_city_average_aqi(df: pd.DataFrame, output_dir: Path) -> Path:
    if CITY_COLUMN not in df.columns:
        return _save_empty_note(output_dir / "city_average_aqi_missing.txt", "City column not available.")

    city_avg = df.groupby(CITY_COLUMN, as_index=False)[TARGET_COLUMN].mean().sort_values(TARGET_COLUMN).tail(15)
    fig, ax = plt.subplots(figsize=(10, 6))
    ax.barh(city_avg[CITY_COLUMN], city_avg[TARGET_COLUMN], color="#F97316")
    ax.set_title("Top cities by average AQI")
    ax.set_xlabel("Average AQI")
    return _save_figure(fig, output_dir / "city_average_aqi.png")


def _save_pollutant_correlation(df: pd.DataFrame, output_dir: Path) -> Path:
    columns = [column for column in [*POLLUTANT_COLUMNS, TARGET_COLUMN] if column in df.columns]
    corr = df[columns].corr(numeric_only=True)
    fig, ax = plt.subplots(figsize=(8, 6))
    image = ax.imshow(corr, cmap="YlGnBu")
    ax.set_xticks(range(len(columns)), columns, rotation=45, ha="right")
    ax.set_yticks(range(len(columns)), columns)
    fig.colorbar(image, ax=ax)
    ax.set_title("Pollutant correlation heatmap")
    return _save_figure(fig, output_dir / "pollutant_correlation.png")


def _save_pollutant_distribution(df: pd.DataFrame, output_dir: Path) -> Path:
    columns = [column for column in POLLUTANT_COLUMNS if column in df.columns]
    fig, axes = plt.subplots(2, 3, figsize=(12, 7))
    axes_flat = axes.flatten()

    for index, column in enumerate(columns[:6]):
        axes_flat[index].hist(df[column].dropna(), bins=30, color="#14B8A6")
        axes_flat[index].set_title(column.upper())

    for index in range(len(columns), len(axes_flat)):
        axes_flat[index].axis("off")

    fig.suptitle("Pollutant distributions")
    fig.tight_layout()
    return _save_figure(fig, output_dir / "pollutant_distributions.png")


def _save_figure(fig: plt.Figure, output_path: Path) -> Path:
    fig.tight_layout()
    fig.savefig(output_path, dpi=160)
    plt.close(fig)
    return output_path


def _save_empty_note(output_path: Path, message: str) -> Path:
    output_path.write_text(message, encoding="utf-8")
    return output_path


if __name__ == "__main__":
    paths = generate_eda_visuals()
    print("Generated EDA visuals:")
    for path in paths:
        print(path)

