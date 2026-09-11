"""Extract official OSPCB district-head-quarter AAQ PDF tables."""

from __future__ import annotations

import re
from pathlib import Path

import pandas as pd
import pdfplumber

from src.config import PROCESSED_DATA_DIR
from src.location_sources import ordered_locations


DEFAULT_OSPCB_DIR = Path("data/external/ospcb")
DEFAULT_OSPCB_OUTPUT = PROCESSED_DATA_DIR / "odisha_dhq_aaq_2026.csv"


def extract_ospcb_dhq_pdfs(
    input_dir: str | Path = DEFAULT_OSPCB_DIR,
    output_path: str | Path = DEFAULT_OSPCB_OUTPUT,
) -> pd.DataFrame:
    """Extract all `*-dhq.pdf` files into a normalized CSV."""

    input_path = Path(input_dir)
    rows: list[dict[str, object]] = []
    for pdf_path in sorted(input_path.glob("2026-*-dhq.pdf")):
        month_start = _month_from_filename(pdf_path.name)
        rows.extend(_extract_pdf_rows(pdf_path, month_start))

    df = pd.DataFrame(rows)
    if not df.empty:
        df = df.sort_values(["date", "district"]).reset_index(drop=True)

    output_file = Path(output_path)
    output_file.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(output_file, index=False)
    return df


def target_area_readiness(ospcb_df: pd.DataFrame) -> pd.DataFrame:
    """Summarize target-area official-data availability."""

    rows: list[dict[str, object]] = []
    for location in ordered_locations():
        direct_names = {name.lower() for name in (location.aliases + ((location.ospcb_district,) if location.ospcb_district else tuple()))}
        direct = pd.DataFrame()
        if not ospcb_df.empty and "district" in ospcb_df.columns:
            direct = ospcb_df[ospcb_df["district"].str.lower().isin(direct_names)]

        proxy = pd.DataFrame()
        if location.proxy_district and not ospcb_df.empty and "district" in ospcb_df.columns:
            proxy = ospcb_df[ospcb_df["district"].str.lower() == location.proxy_district.lower()]

        used = direct if not direct.empty else proxy
        rows.append(
            {
                "area": location.name,
                "priority": location.priority,
                "direct_ospcb_rows": int(len(direct)),
                "proxy_district": location.proxy_district or "",
                "proxy_rows": int(len(proxy)),
                "first_month": "" if used.empty else str(pd.to_datetime(used["date"]).min().date()),
                "latest_month": "" if used.empty else str(pd.to_datetime(used["date"]).max().date()),
                "status": _readiness_status(location.name, direct, proxy),
                "public_audience": location.public_audience,
            }
        )

    return pd.DataFrame(rows)


def _extract_pdf_rows(pdf_path: Path, month_start: pd.Timestamp) -> list[dict[str, object]]:
    rows: list[dict[str, object]] = []
    with pdfplumber.open(pdf_path) as document:
        for page in document.pages:
            for table in page.extract_tables():
                for table_row in table:
                    row = _normalize_table_row(table_row)
                    if row is None:
                        continue
                    rows.append(
                        {
                            "date": month_start.date().isoformat(),
                            "district": row[1],
                            "monitoring_location": row[2],
                            "so2": _to_float(row[3]),
                            "no2": _to_float(row[4]),
                            "pm10": _to_float(row[5]),
                            "pm25": _to_float(row[6]),
                            "aqi": _parse_aqi(row[7]),
                            "prominent_pollutant": _parse_prominent_pollutant(row[7]),
                            "aqi_category": row[8],
                            "source_file": pdf_path.name,
                            "source": "Odisha State Pollution Control Board DHQ AAQ PDF",
                        }
                    )
    return rows


def _normalize_table_row(row: list[str | None]) -> list[str] | None:
    if len(row) < 9 or row[0] is None:
        return None
    serial = _clean_cell(row[0])
    if not re.fullmatch(r"\d+\.?", serial):
        return None
    return [_clean_cell(value) for value in row[:9]]


def _clean_cell(value: object) -> str:
    return " ".join(str(value or "").replace("\n", " ").split())


def _to_float(value: str) -> float | None:
    cleaned = _clean_cell(value).upper()
    if cleaned in {"", "-", "NM", "BDL", "NA", "N/A"}:
        return None
    match = re.search(r"-?\d+(?:\.\d+)?", cleaned)
    return float(match.group(0)) if match else None


def _parse_aqi(value: str) -> float | None:
    return _to_float(value)


def _parse_prominent_pollutant(value: str) -> str:
    normalized = _clean_cell(value).lower().replace(" ", "")
    if "pm2.5" in normalized or "pm)2.5" in normalized or "pm2" in normalized:
        return "PM2.5"
    if "pm10" in normalized or "pm)10" in normalized:
        return "PM10"
    if "no2" in normalized:
        return "NO2"
    if "so2" in normalized:
        return "SO2"
    return ""


def _month_from_filename(filename: str) -> pd.Timestamp:
    match = re.search(r"(?P<year>20\d{2})-(?P<month>\d{2})", filename)
    if not match:
        raise ValueError(f"Cannot infer month from PDF filename: {filename}")
    return pd.Timestamp(year=int(match.group("year")), month=int(match.group("month")), day=1)


def _readiness_status(area: str, direct: pd.DataFrame, proxy: pd.DataFrame) -> str:
    if len(direct) >= 7:
        return "official monthly data present, still too sparse for 7-day ARIMA validation"
    if len(direct) > 0:
        return "official monthly data present, but insufficient for direct 7-day tuning"
    if len(proxy) > 0:
        return "no direct official rows found; proxy district available"
    return "no official rows found in checked 2026 PDFs"


if __name__ == "__main__":
    extracted = extract_ospcb_dhq_pdfs()
    print(f"Extracted {len(extracted)} OSPCB DHQ rows to {DEFAULT_OSPCB_OUTPUT}")
    print(target_area_readiness(extracted).to_string(index=False))
