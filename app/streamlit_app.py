"""Streamlit dashboard for AirSwasthya AI."""

from __future__ import annotations

import html
import json
import sys
from contextlib import nullcontext
from pathlib import Path

import pandas as pd
import streamlit as st

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from src.aqi_rules import get_pm25_advisory
from src.config import MODELS_DIR, PROCESSED_DATA_DIR, api_credential_status
from src.location_sources import get_location, ordered_locations
from src.weather_client import celsius_to_fahrenheit, fetch_weather_payload, weather_payload_to_frames


OPEN_METEO_DIR = PROCESSED_DATA_DIR / "open_meteo"
FORECAST_DIR = PROCESSED_DATA_DIR / "forecasts"
OSPCB_PATH = PROCESSED_DATA_DIR / "odisha_dhq_aaq_2026.csv"
READINESS_PATH = PROCESSED_DATA_DIR / "target_area_readiness.csv"
TS_METRICS_DIR = MODELS_DIR / "time_series"
REVIEW2_MANIFEST_PATH = MODELS_DIR / "review2_manifest.json"

NAV_ITEMS = (
    ("home", "Home", "home", "nav-home"),
    ("forecast", "Forecast", "query_stats", "nav-forecast"),
    ("flow", "Flow", "conversion_path", "nav-flow"),
    ("evidence", "Evidence", "analytics", "nav-evidence"),
    ("setup", "Setup", "tune", "nav-setup"),
)

FLOW_ROWS = (
    {
        "step": "Area focus",
        "user_view": "Koraput, Nawarangpur, or Gunupur is selected.",
        "purpose": "Keeps the project local and explainable.",
    },
    {
        "step": "Recent air signal",
        "user_view": "Daily PM2.5 and supporting air readings are prepared.",
        "purpose": "Creates the time-series used for forecasting.",
    },
    {
        "step": "Pattern check",
        "user_view": "Trend, seasonality, and sudden shifts are inspected.",
        "purpose": "Matches the problem-statement learning goal.",
    },
    {
        "step": "Seven-day outlook",
        "user_view": "The next 7 days are shown as chart or table.",
        "purpose": "Turns analysis into a readable forecast.",
    },
    {
        "step": "Health action",
        "user_view": "PM2.5 level is converted into simple caution language.",
        "purpose": "Makes the output useful for non-technical users.",
    },
)


st.set_page_config(
    page_title="AirSwasthya AI",
    page_icon=":material/air:",
    layout="wide",
)


def inject_design_css() -> None:
    """Install the weather-dashboard visual system."""

    st.markdown(
        """
        <style>
        :root {
            --ink: #14211b;
            --muted: #68766f;
            --green: #2f7d5b;
            --olive: #8b9a4f;
            --amber: #f4b63d;
            --orange: #f08a3e;
            --red: #d95757;
            --card: rgba(255, 255, 255, 0.76);
            --line: rgba(85, 105, 95, 0.16);
            --shadow: 0 24px 60px rgba(54, 68, 61, 0.16);
        }

        .stApp {
            background:
                radial-gradient(circle at 6% 8%, rgba(255, 255, 255, 0.96), rgba(255, 255, 255, 0) 30%),
                radial-gradient(circle at 88% 8%, rgba(244, 182, 61, 0.20), rgba(244, 182, 61, 0) 27%),
                radial-gradient(circle at 86% 84%, rgba(47, 125, 91, 0.16), rgba(47, 125, 91, 0) 34%),
                linear-gradient(135deg, #f8faf8 0%, #eef1ee 45%, #fbf8f1 100%);
            color: var(--ink);
        }

        .main .block-container {
            max-width: 1200px;
            padding-top: 1.2rem;
            padding-bottom: 7.4rem;
        }

        section[data-testid="stSidebar"] {
            background: linear-gradient(180deg, rgba(255,255,255,0.76), rgba(248,251,247,0.92));
            border-right: 1px solid rgba(91, 113, 103, 0.16);
        }

        .stButton > button,
        div[data-testid="stSegmentedControl"] button,
        div[data-testid="stMetric"],
        div[data-testid="stVerticalBlockBorderWrapper"] {
            transition: transform 170ms ease, box-shadow 170ms ease, border-color 170ms ease, background 170ms ease;
        }

        .stButton > button:hover,
        div[data-testid="stSegmentedControl"] button:hover,
        div[data-testid="stMetric"]:hover,
        div[data-testid="stVerticalBlockBorderWrapper"]:hover {
            transform: translateY(-2px);
            box-shadow: 0 16px 40px rgba(57, 76, 66, 0.11);
            border-color: rgba(47, 125, 91, 0.30);
        }

        .hero-shell {
            display: grid;
            grid-template-columns: minmax(285px, 0.92fr) minmax(430px, 1.38fr);
            gap: 1.15rem;
            border: 1px solid rgba(103, 118, 108, 0.16);
            border-radius: 28px;
            padding: 1.1rem;
            background:
                linear-gradient(135deg, rgba(255,255,255,0.92), rgba(255,255,255,0.58)),
                linear-gradient(135deg, rgba(255,255,255,0.32), rgba(154,171,160,0.16));
            box-shadow: var(--shadow);
            backdrop-filter: blur(22px);
            overflow: hidden;
        }

        .weather-side, .detail-side, .glass-card, .metric-glass, .forecast-card, .flow-card {
            background: var(--card);
            border: 1px solid rgba(255, 255, 255, 0.72);
            box-shadow: inset 0 1px 0 rgba(255,255,255,0.84), 0 18px 44px rgba(74, 88, 80, 0.10);
            backdrop-filter: blur(18px);
        }

        .weather-side {
            border-radius: 24px;
            padding: 2rem;
            min-height: 550px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
        }

        .detail-side {
            border-radius: 24px;
            padding: 1.55rem;
        }

        .search-pill {
            display: flex;
            align-items: center;
            gap: 0.55rem;
            width: fit-content;
            padding: 0.66rem 0.9rem;
            border-radius: 999px;
            background: rgba(255,255,255,0.74);
            border: 1px solid rgba(98, 116, 106, 0.13);
            color: #4c5d55;
            font-size: 0.92rem;
        }

        .eyebrow {
            color: var(--muted);
            font-size: 0.82rem;
            font-weight: 800;
            letter-spacing: 0;
            text-transform: uppercase;
        }

        .weather-mark {
            position: relative;
            height: 185px;
            margin: 1.5rem 0 1rem;
        }

        .weather-mark .sun {
            position: absolute;
            left: 54px;
            top: 54px;
            width: 126px;
            height: 126px;
            border-radius: 999px;
            background: radial-gradient(circle at 35% 32%, #fff39a 0, #ffd65f 37%, #ffbd55 72%, #f39a43 100%);
            box-shadow: 0 18px 42px rgba(244, 178, 55, 0.38);
            animation: floatSun 4.2s ease-in-out infinite;
        }

        .weather-mark .cloud {
            position: absolute;
            left: 22px;
            top: 34px;
            width: 120px;
            height: 58px;
            border-radius: 999px;
            background: rgba(250,250,248,0.9);
            box-shadow: inset 0 0 0 10px rgba(226, 229, 224, 0.72);
        }

        .weather-mark .cloud:before {
            content: "";
            position: absolute;
            width: 78px;
            height: 78px;
            left: 34px;
            top: -33px;
            border-radius: 999px;
            background: rgba(250,250,248,0.95);
            box-shadow: inset 0 0 0 10px rgba(226, 229, 224, 0.72);
        }

        .rain-line {
            position: absolute;
            top: 102px;
            width: 8px;
            height: 62px;
            border-radius: 999px;
            background: linear-gradient(180deg, #3f68d6, #3048bc);
            animation: rainPulse 1.8s ease-in-out infinite;
        }

        .rain-line.r1 { left: 160px; animation-delay: 0s; }
        .rain-line.r2 { left: 182px; height: 72px; animation-delay: 0.14s; }
        .rain-line.r3 { left: 204px; height: 88px; animation-delay: 0.28s; }
        .rain-line.r4 { left: 226px; height: 104px; animation-delay: 0.42s; }

        .weather-mark.clear .cloud,
        .weather-mark.clear .rain-line { opacity: 0; }
        .weather-mark.cloud .rain-line { opacity: 0; }
        .weather-mark.rain .rain-line { opacity: 1; }

        .temperature {
            font-size: clamp(3.5rem, 7vw, 5.5rem);
            line-height: 0.96;
            font-weight: 520;
            color: #050706;
            letter-spacing: 0;
        }

        .weather-meta {
            color: var(--muted);
            font-size: 1.02rem;
            margin-top: 0.45rem;
        }

        .mini-list {
            display: grid;
            gap: 0.58rem;
            margin-top: 1.2rem;
            padding-top: 1.2rem;
            border-top: 1px solid var(--line);
        }

        .mini-row {
            display: flex;
            justify-content: space-between;
            gap: 1rem;
            color: #27352f;
            font-size: 0.95rem;
        }

        .place-card {
            margin-top: 1.3rem;
            border-radius: 18px;
            padding: 1rem;
            color: white;
            background:
                linear-gradient(135deg, rgba(35, 59, 47, 0.18), rgba(19, 36, 29, 0.72)),
                linear-gradient(110deg, #886947 0%, #b88c61 32%, #5e8f72 68%, #35665a 100%);
            min-height: 96px;
            display: flex;
            flex-direction: column;
            justify-content: end;
            box-shadow: 0 18px 40px rgba(35, 58, 46, 0.22);
        }

        .weekday-row {
            display: grid;
            grid-template-columns: repeat(7, minmax(86px, 1fr));
            gap: 0.75rem;
            margin-bottom: 1.35rem;
        }

        .weekday-row.today {
            grid-template-columns: minmax(220px, 420px);
        }

        .forecast-card {
            border-radius: 18px;
            padding: 1rem 0.85rem;
            min-height: 132px;
            text-align: center;
            transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
        }

        .forecast-card:hover {
            transform: translateY(-4px) scale(1.015);
            border-color: rgba(244, 182, 61, 0.56);
            box-shadow: 0 20px 42px rgba(97, 111, 99, 0.16);
        }

        .mini-sun {
            width: 34px;
            height: 34px;
            border-radius: 999px;
            margin: 0.7rem auto;
            background: radial-gradient(circle at 35% 28%, #fff4a2, #ffd554 56%, #f5a83c);
            box-shadow: 0 10px 22px rgba(244, 182, 61, 0.28);
        }

        .small-label {
            color: var(--muted);
            font-size: 0.78rem;
        }

        .big-value {
            color: #0d1511;
            font-size: 1.55rem;
            font-weight: 760;
            letter-spacing: 0;
        }

        .highlight-grid {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 0.95rem;
        }

        .metric-glass {
            border-radius: 20px;
            padding: 1.15rem;
            min-height: 132px;
            transition: transform 180ms ease, box-shadow 180ms ease;
        }

        .metric-glass:hover {
            transform: translateY(-3px);
            box-shadow: 0 22px 48px rgba(52, 68, 59, 0.13);
        }

        .metric-glass span {
            display: block;
            color: #89918d;
            font-size: 0.9rem;
            margin-bottom: 0.55rem;
        }

        .metric-glass strong {
            display: block;
            font-size: 2rem;
            line-height: 1;
            letter-spacing: 0;
            color: #060807;
        }

        .metric-glass em {
            display: block;
            margin-top: 0.7rem;
            color: #33433b;
            font-style: normal;
            font-size: 0.92rem;
        }

        .section-title-row {
            display: flex;
            justify-content: space-between;
            align-items: end;
            gap: 1rem;
            margin: 1.35rem 0 0.75rem;
        }

        .glass-card {
            border-radius: 24px;
            padding: 1.35rem;
            margin-bottom: 1rem;
        }

        .flow-grid {
            display: grid;
            grid-template-columns: repeat(5, minmax(0, 1fr));
            gap: 0.75rem;
            align-items: stretch;
        }

        .flow-card {
            border-radius: 20px;
            padding: 1rem;
            min-height: 188px;
            position: relative;
            overflow: hidden;
        }

        .flow-card:before {
            content: "";
            position: absolute;
            inset: 0;
            background: linear-gradient(120deg, rgba(255,255,255,0), rgba(255,255,255,0.54), rgba(255,255,255,0));
            transform: translateX(-115%);
            animation: shimmer 4.8s ease-in-out infinite;
        }

        .flow-number {
            width: 34px;
            height: 34px;
            border-radius: 12px;
            display: grid;
            place-items: center;
            color: white;
            background: linear-gradient(135deg, var(--green), var(--olive));
            font-weight: 800;
            margin-bottom: 1rem;
            position: relative;
            z-index: 1;
        }

        .flow-card h4, .flow-card p {
            position: relative;
            z-index: 1;
        }

        .flow-card h4 {
            margin: 0 0 0.55rem;
            font-size: 1rem;
            color: #101915;
        }

        .flow-card p {
            margin: 0;
            color: #56635d;
            font-size: 0.9rem;
        }

        .nav-dock {
            display: flex;
            justify-content: center;
            pointer-events: none;
        }

        .nav-pill-shell {
            display: flex;
            gap: 0.72rem;
            align-items: center;
            padding: 0.72rem;
            border-radius: 999px;
            background: rgba(255,255,255,0.75);
            border: 1px solid rgba(255,255,255,0.84);
            box-shadow: 0 22px 54px rgba(54, 68, 61, 0.18);
            backdrop-filter: blur(22px);
            pointer-events: auto;
        }

        .nav-item {
            text-decoration: none !important;
            color: #0e1713 !important;
            display: flex;
            align-items: center;
            gap: 0.52rem;
            padding: 0.66rem 0.86rem;
            border-radius: 999px;
            border: 1px solid transparent;
            transition: transform 170ms ease, background 170ms ease, box-shadow 170ms ease;
            font-weight: 700;
            font-size: 0.9rem;
        }

        .nav-icon {
            width: 34px;
            height: 34px;
            border-radius: 14px;
            display: grid;
            place-items: center;
            background: rgba(255,255,255,0.58);
            box-shadow: inset 0 1px 0 rgba(255,255,255,0.78);
            transition: transform 180ms ease, box-shadow 180ms ease, background 180ms ease;
        }

        .nav-item:hover {
            transform: translateY(-3px);
            box-shadow: 0 15px 34px rgba(52, 67, 58, 0.14);
        }

        .nav-item:hover .nav-icon {
            transform: rotate(-6deg) scale(1.08);
            box-shadow: 0 10px 25px rgba(47, 125, 91, 0.18), inset 0 1px 0 rgba(255,255,255,0.9);
        }

        .nav-home:hover { background: linear-gradient(180deg, rgba(255,255,255,0.94), rgba(217,87,87,0.16)); }
        .nav-forecast:hover { background: linear-gradient(180deg, rgba(255,255,255,0.94), rgba(240,138,62,0.18)); }
        .nav-flow:hover { background: linear-gradient(180deg, rgba(255,255,255,0.94), rgba(139,154,79,0.20)); }
        .nav-evidence:hover { background: linear-gradient(180deg, rgba(255,255,255,0.94), rgba(244,182,61,0.22)); }
        .nav-setup:hover { background: linear-gradient(180deg, rgba(255,255,255,0.94), rgba(47,125,91,0.16)); }

        .nav-item.active {
            background: linear-gradient(135deg, rgba(47,125,91,0.16), rgba(244,182,61,0.18));
            border-color: rgba(47,125,91,0.18);
        }

        .material-symbols-rounded {
            font-family: "Material Symbols Rounded";
            font-weight: normal;
            font-style: normal;
            font-size: 22px;
            line-height: 1;
        }

        .loading-strip {
            position: relative;
            overflow: hidden;
            height: 10px;
            border-radius: 999px;
            background: rgba(47,125,91,0.10);
        }

        .loading-strip:after {
            content: "";
            position: absolute;
            inset: 0;
            width: 40%;
            border-radius: inherit;
            background: linear-gradient(90deg, rgba(255,255,255,0), rgba(244,182,61,0.9), rgba(47,125,91,0.66));
            animation: loadingSlide 1.6s ease-in-out infinite;
        }

        @keyframes floatSun {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-7px); }
        }

        @keyframes rainPulse {
            0%, 100% { transform: translateY(0); opacity: 0.88; }
            50% { transform: translateY(8px); opacity: 0.55; }
        }

        @keyframes shimmer {
            0%, 55% { transform: translateX(-115%); }
            100% { transform: translateX(115%); }
        }

        @keyframes loadingSlide {
            0% { transform: translateX(-110%); }
            100% { transform: translateX(260%); }
        }

        @media (max-width: 980px) {
            .hero-shell {
                grid-template-columns: 1fr;
            }

            .weekday-row {
                grid-template-columns: repeat(2, minmax(0, 1fr));
            }

            .highlight-grid, .flow-grid {
                grid-template-columns: 1fr;
            }

            .weather-side {
                min-height: auto;
            }

            .nav-pill-shell {
                width: min(96vw, 560px);
                overflow-x: auto;
                justify-content: flex-start;
            }
        }
        </style>
        """,
        unsafe_allow_html=True,
    )


@st.cache_data(max_entries=32)
def load_csv(path: str) -> pd.DataFrame:
    """Load a CSV with parsed date columns when present."""

    csv_path = Path(path)
    if not csv_path.exists():
        return pd.DataFrame()
    df = pd.read_csv(csv_path)
    for column in ["date", "datetime"]:
        if column in df.columns:
            df[column] = pd.to_datetime(df[column], errors="coerce")
    return df


@st.cache_data(max_entries=16)
def load_json(path: str) -> dict:
    """Load a JSON file when present."""

    json_path = Path(path)
    if not json_path.exists():
        return {}
    return json.loads(json_path.read_text(encoding="utf-8"))


@st.cache_data(ttl=1800, max_entries=12, show_spinner=False)
def load_weather(location_slug: str) -> tuple[dict[str, object], pd.DataFrame]:
    """Fetch live weather summary for the public home page."""

    try:
        current, daily = weather_payload_to_frames(fetch_weather_payload(get_location(location_slug)))
        return current, daily
    except Exception as exc:  # pragma: no cover - protects the UI from network drift.
        return {"error": exc.__class__.__name__, "condition": "Weather unavailable"}, pd.DataFrame()


def ensure_session_defaults() -> None:
    """Initialize per-tab UI state for working controls."""

    st.session_state.setdefault("weather_range", "Week")
    st.session_state.setdefault("temperature_unit", "C")
    st.session_state.setdefault("flow_view", "Infographic")
    st.session_state.setdefault("forecast_view", "Chart")


def query_value(name: str, default: str) -> str:
    """Return a query parameter value."""

    raw_value = st.query_params.get(name, default)
    if isinstance(raw_value, list):
        return raw_value[0] if raw_value else default
    return str(raw_value or default)


def clean_page_slug(value: str) -> str:
    """Return a known page slug."""

    pages = {slug for slug, *_ in NAV_ITEMS}
    normalized = value.strip().lower()
    return normalized if normalized in pages else "home"


def metric_rows(metrics: dict) -> pd.DataFrame:
    """Convert model metrics JSON into a display dataframe."""

    rows: list[dict[str, object]] = []
    for model_name, values in metrics.get("metrics_by_model", {}).items():
        rows.append(
            {
                "model": model_name,
                "mae": values.get("mae"),
                "rmse": values.get("rmse"),
                "r2": values.get("r2"),
                "spike days": values.get("spike_day_count"),
                "spike mae": values.get("spike_mae"),
                "normal mae": values.get("normal_day_mae"),
                "status": values.get("error", "trained"),
            }
        )
    return pd.DataFrame(rows)


def source_badges(daily_df: pd.DataFrame, ospcb_df: pd.DataFrame, location_slug: str) -> None:
    """Show compact source status badges."""

    location = get_location(location_slug)
    has_recent_series = not daily_df.empty
    has_direct_ospcb = False
    if not ospcb_df.empty and location.ospcb_district:
        has_direct_ospcb = bool(
            ospcb_df["district"].astype(str).str.lower().eq(location.ospcb_district.lower()).any()
        )

    st.badge(
        "Recent PM2.5 series" if has_recent_series else "No recent PM2.5 CSV",
        icon=":material/query_stats:",
        color="green" if has_recent_series else "red",
    )
    st.badge(
        "Official Odisha rows" if has_direct_ospcb else "Official proxy/none",
        icon=":material/verified:",
        color="green" if has_direct_ospcb else "orange",
    )


def api_status_panel() -> None:
    """Show provider-key presence without exposing secrets or env names."""

    rows = api_credential_status()
    configured_count = sum(row["configured"] == "yes" for row in rows)
    badge_color = "green" if configured_count == len(rows) else "orange"
    safe_rows = [
        {
            "provider": row["provider"],
            "configured": row["configured"],
            "connection": row["connection"],
        }
        for row in rows
    ]

    st.badge(
        f"Provider keys configured: {configured_count}/{len(rows)}",
        icon=":material/key:",
        color=badge_color,
    )
    with st.expander("Provider setup status", icon=":material/admin_panel_settings:"):
        st.dataframe(pd.DataFrame(safe_rows), hide_index=True)
        st.caption("Credential presence only. Authentication and Koraput coverage checks are a separate data chunk.")


def filtered_official_rows(ospcb_df: pd.DataFrame, location_slug: str) -> pd.DataFrame:
    """Return direct or proxy official rows for the selected target area."""

    if ospcb_df.empty:
        return pd.DataFrame()

    location = get_location(location_slug)
    target_names = list(location.aliases)
    if location.ospcb_district:
        target_names.append(location.ospcb_district)
    if location.proxy_district:
        target_names.append(location.proxy_district)

    target_lookup = {name.lower() for name in target_names}
    return ospcb_df[ospcb_df["district"].astype(str).str.lower().isin(target_lookup)].copy()


def artifact_missing_state() -> None:
    """Explain how to generate artifacts when the Review 2 pipeline has not run."""

    st.warning(
        "Review 2 artifacts are not generated yet. Run `python scripts/build_review2_pipeline.py`.",
        icon=":material/warning:",
    )


def html_text(value: object) -> str:
    """Escape values before placing them in custom HTML."""

    return html.escape("" if value is None else str(value))


def format_number(value: object, suffix: str = "", decimals: int = 1) -> str:
    """Format numeric values for compact cards."""

    try:
        number = float(value)
    except (TypeError, ValueError):
        return "--"
    return f"{number:.{decimals}f}{suffix}"


def format_percent(value: object) -> str:
    """Format percentage values."""

    try:
        return f"{float(value):.0f}%"
    except (TypeError, ValueError):
        return "--"


def format_temp(value_c: object, unit: str) -> str:
    """Format temperature in Celsius or Fahrenheit."""

    try:
        value = float(value_c)
    except (TypeError, ValueError):
        return "--"
    if unit == "F":
        converted = celsius_to_fahrenheit(value)
        return f"{converted:.0f} F" if converted is not None else "--"
    return f"{value:.0f} C"


def format_datetime_time(value: object) -> str:
    """Render a timestamp as local clock time."""

    parsed = pd.to_datetime(value, errors="coerce")
    if pd.isna(parsed):
        return "--"
    return parsed.strftime("%I:%M %p").lstrip("0")


def condition_modifier(condition: object) -> str:
    """Choose a CSS weather icon modifier."""

    normalized = str(condition or "").lower()
    if "rain" in normalized or "drizzle" in normalized or "thunder" in normalized:
        return "rain"
    if "cloud" in normalized or "fog" in normalized:
        return "cloud"
    return "clear"


def readable_area_note(location_slug: str) -> str:
    """Make coordinates understandable for non-technical users."""

    location = get_location(location_slug)
    lat_dir = "N" if location.latitude >= 0 else "S"
    lon_dir = "E" if location.longitude >= 0 else "W"
    return f"{abs(location.latitude):.3f} {lat_dir}, {abs(location.longitude):.3f} {lon_dir} near the town center"


def split_history_and_api_forecast(daily_df: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame]:
    """Split generated area data into history and API forecast rows."""

    if not daily_df.empty and "data_role" in daily_df.columns:
        history_df = daily_df[daily_df["data_role"] == "history"].copy()
        api_forecast_df = daily_df[daily_df["data_role"] == "forecast_api"].copy()
        return history_df, api_forecast_df
    return pd.DataFrame(), pd.DataFrame()


def latest_pm25_value(history_df: pd.DataFrame) -> float | None:
    """Return the latest valid PM2.5 value from history."""

    if history_df.empty or "pm25" not in history_df.columns:
        return None
    values = history_df["pm25"].dropna()
    if values.empty:
        return None
    return float(values.iloc[-1])


def next_forecast_pm25(forecast_df: pd.DataFrame, fallback: float | None = None) -> float | None:
    """Return the next model forecast value."""

    if not forecast_df.empty and "predicted_pm25" in forecast_df.columns:
        values = forecast_df["predicted_pm25"].dropna()
        if not values.empty:
            return float(values.iloc[0])
    return fallback


def forecast_display_rows(weather_daily: pd.DataFrame, forecast_df: pd.DataFrame) -> pd.DataFrame:
    """Join public weather forecast rows with the PM2.5 outlook."""

    forecast = forecast_df.copy()
    if not forecast.empty and "date" in forecast.columns:
        forecast["date"] = pd.to_datetime(forecast["date"], errors="coerce").dt.normalize()
        forecast = forecast[["date", "predicted_pm25"]]
    else:
        forecast = pd.DataFrame(columns=["date", "predicted_pm25"])

    if weather_daily.empty:
        display = forecast.copy()
        display["condition"] = "Air-quality forecast"
        display["temperature_max_c"] = None
        display["temperature_min_c"] = None
        display["rain_probability"] = None
        display["uv_index"] = None
        display["sunrise"] = None
        display["sunset"] = None
        display["wind_speed_kmh"] = None
        return display

    weather = weather_daily.copy()
    weather["date"] = pd.to_datetime(weather["date"], errors="coerce").dt.normalize()
    return weather.merge(forecast, on="date", how="left")


def render_weather_icon(condition: object) -> str:
    """Return the animated CSS weather mark."""

    return f"""
        <div class="weather-mark {condition_modifier(condition)}" aria-hidden="true">
            <span class="cloud"></span>
            <span class="sun"></span>
            <span class="rain-line r1"></span>
            <span class="rain-line r2"></span>
            <span class="rain-line r3"></span>
            <span class="rain-line r4"></span>
        </div>
    """


def render_week_cards(display_rows: pd.DataFrame, unit: str, view_range: str) -> None:
    """Render the Today/Week forecast cards."""

    rows = display_rows.head(1 if view_range == "Today" else 7)
    cards: list[str] = []
    for _, row in rows.iterrows():
        date_value = pd.to_datetime(row.get("date"), errors="coerce")
        day_name = date_value.strftime("%a") if not pd.isna(date_value) else "Day"
        date_label = date_value.strftime("%d %b") if not pd.isna(date_value) else "--"
        temp_high = format_temp(row.get("temperature_max_c"), unit)
        temp_low = format_temp(row.get("temperature_min_c"), unit)
        pm25 = format_number(row.get("predicted_pm25"), " ug/m3")
        condition = html_text(row.get("condition") or "Air outlook")

        cards.append(
            f"""
            <div class="forecast-card">
                <div class="small-label">{html_text(day_name)} | {html_text(date_label)}</div>
                <div class="mini-sun"></div>
                <div class="big-value">{html_text(temp_high)}</div>
                <div class="small-label">{html_text(temp_low)} | PM2.5 {html_text(pm25)}</div>
                <div class="small-label">{condition}</div>
            </div>
            """
        )

    if not cards:
        cards.append(
            """
            <div class="forecast-card">
                <div class="small-label">Forecast</div>
                <div class="mini-sun"></div>
                <div class="big-value">--</div>
                <div class="small-label">Run the data pipeline</div>
            </div>
            """
        )

    row_class = "today" if view_range == "Today" else "week"
    st.markdown(f'<div class="weekday-row {row_class}">{"".join(cards)}</div>', unsafe_allow_html=True)


def render_highlights(
    current_weather: dict[str, object],
    display_rows: pd.DataFrame,
    next_pm25: float | None,
    latest_pm25: float | None,
) -> None:
    """Render home-page highlights without exposing internal tech names."""

    first_row = display_rows.iloc[0].to_dict() if not display_rows.empty else {}
    advice = get_pm25_advisory(next_pm25 or latest_pm25 or 0)
    sunrise = format_datetime_time(first_row.get("sunrise"))
    sunset = format_datetime_time(first_row.get("sunset"))
    humidity = format_percent(current_weather.get("relative_humidity_2m"))
    wind = format_number(current_weather.get("wind_speed_10m"), " km/h")
    wind_direction = html_text(current_weather.get("wind_direction_label", "unknown"))
    rain = format_percent(first_row.get("rain_probability"))
    uv_index = format_number(first_row.get("uv_index"), decimals=1)

    st.markdown(
        f"""
        <div class="highlight-grid">
            <div class="metric-glass">
                <span>PM2.5 outlook</span>
                <strong>{html_text(format_number(next_pm25, " ug/m3"))}</strong>
                <em>{html_text(advice.category)}</em>
            </div>
            <div class="metric-glass">
                <span>Wind status</span>
                <strong>{html_text(wind)}</strong>
                <em>{wind_direction}</em>
            </div>
            <div class="metric-glass">
                <span>Sunrise and sunset</span>
                <strong>{html_text(sunrise)}</strong>
                <em>Sunset {html_text(sunset)}</em>
            </div>
            <div class="metric-glass">
                <span>Humidity</span>
                <strong>{html_text(humidity)}</strong>
                <em>Local comfort reading</em>
            </div>
            <div class="metric-glass">
                <span>Rain chance</span>
                <strong>{html_text(rain)}</strong>
                <em>Daily maximum probability</em>
            </div>
            <div class="metric-glass">
                <span>UV index</span>
                <strong>{html_text(uv_index)}</strong>
                <em>Outdoor caution signal</em>
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )


def render_home(
    selected_location,
    history_df: pd.DataFrame,
    forecast_df: pd.DataFrame,
    current_weather: dict[str, object],
    weather_daily: pd.DataFrame,
) -> None:
    """Render the public weather-style landing dashboard."""

    view_range = st.session_state.weather_range
    unit = st.session_state.temperature_unit
    latest_pm25 = latest_pm25_value(history_df)
    next_pm25 = next_forecast_pm25(forecast_df, latest_pm25)
    display_rows = forecast_display_rows(weather_daily, forecast_df)
    condition = current_weather.get("condition") or (
        display_rows.iloc[0].get("condition") if not display_rows.empty else "Air-quality outlook"
    )
    temperature = format_temp(current_weather.get("temperature_2m"), unit)
    apparent = format_temp(current_weather.get("apparent_temperature"), unit)
    current_time = format_datetime_time(current_weather.get("time"))
    rain_label = format_percent(display_rows.iloc[0].get("rain_probability")) if not display_rows.empty else "--"

    st.markdown(
        f"""
        <div class="hero-shell">
            <div class="weather-side">
                <div>
                    <div class="search-pill">
                        <span class="material-symbols-rounded">search</span>
                        <span>{html_text(selected_location.name)} local air and weather</span>
                    </div>
                    {render_weather_icon(condition)}
                    <div class="temperature">{html_text(temperature)}</div>
                    <div class="weather-meta">{html_text(condition)} | updated {html_text(current_time)}</div>
                    <div class="mini-list">
                        <div class="mini-row"><span>Feels like</span><strong>{html_text(apparent)}</strong></div>
                        <div class="mini-row"><span>PM2.5 forecast</span><strong>{html_text(format_number(next_pm25, " ug/m3"))}</strong></div>
                        <div class="mini-row"><span>Rain chance</span><strong>{html_text(rain_label)}</strong></div>
                    </div>
                </div>
                <div class="place-card">
                    <strong>{html_text(selected_location.name)}, Odisha</strong>
                    <span>{html_text(readable_area_note(selected_location.slug))}</span>
                    <span>Area-level signal, not a personal home-location reading.</span>
                </div>
            </div>
            <div class="detail-side">
                <div class="section-title-row" style="margin-top:0;">
                    <div>
                        <div class="eyebrow">PM2.5 early warning</div>
                        <h2 style="margin:0.2rem 0 0; letter-spacing:0;">Today and week outlook</h2>
                    </div>
                </div>
        """,
        unsafe_allow_html=True,
    )

    left, right = st.columns([1, 1], vertical_alignment="center")
    with left:
        st.segmented_control("Weather range", ["Today", "Week"], key="weather_range")
    with right:
        st.segmented_control("Temperature unit", ["C", "F"], key="temperature_unit")

    render_week_cards(display_rows, unit, view_range)
    st.markdown('<div class="section-title-row"><h3>Today highlights</h3></div>', unsafe_allow_html=True)
    render_highlights(current_weather, display_rows, next_pm25, latest_pm25)
    st.markdown("</div></div>", unsafe_allow_html=True)

    advice = get_pm25_advisory(next_pm25 or latest_pm25 or 0)
    with st.container(border=True):
        st.subheader("Health advisory")
        st.write(advice.message)
        st.caption("This is PM2.5 concentration guidance, not a full AQI replacement.")


def render_forecast_page(
    selected_location,
    history_df: pd.DataFrame,
    forecast_df: pd.DataFrame,
    api_forecast_df: pd.DataFrame,
    metrics: dict,
) -> None:
    """Render the public forecast page."""

    st.subheader(f"{selected_location.name} 7-day PM2.5 outlook")
    st.caption("Public view keeps the result simple: recent air signal, next-week outlook, and health category.")

    latest_pm25 = latest_pm25_value(history_df)
    next_pm25 = next_forecast_pm25(forecast_df, latest_pm25)
    advice = get_pm25_advisory(next_pm25 or 0)
    history_trend = history_df["pm25"].dropna().tail(14).round(2).tolist() if not history_df.empty else []

    with st.container(horizontal=True):
        st.metric("Latest PM2.5", format_number(latest_pm25, " ug/m3"), "Recent day", border=True, chart_data=history_trend)
        st.metric("Next-day forecast", format_number(next_pm25, " ug/m3"), advice.category, border=True)
        st.metric("History window", str(metrics.get("history_rows", 0)), metrics.get("history_end", ""), border=True)
        st.metric("Forecast horizon", "7 days", "Daily PM2.5", border=True)

    display_mode = st.segmented_control("Forecast display", ["Chart", "Table"], key="forecast_view")

    if display_mode == "Chart":
        with st.container(border=True):
            st.subheader("Recent history and forecast")
            chart_rows = []
            if not history_df.empty:
                recent = history_df[["date", "pm25"]].tail(45).copy()
                recent["series"] = "Recent PM2.5"
                recent = recent.rename(columns={"pm25": "pm25_value"})
                chart_rows.append(recent[["date", "pm25_value", "series"]])
            if not forecast_df.empty:
                forecast_chart = forecast_df[["date", "predicted_pm25"]].copy()
                forecast_chart["series"] = "7-day forecast"
                forecast_chart = forecast_chart.rename(columns={"predicted_pm25": "pm25_value"})
                chart_rows.append(forecast_chart[["date", "pm25_value", "series"]])
            if chart_rows:
                st.line_chart(
                    pd.concat(chart_rows, ignore_index=True),
                    x="date",
                    y="pm25_value",
                    color="series",
                    y_label="PM2.5 ug/m3",
                )
            else:
                st.info("No forecast chart is available yet.", icon=":material/info:")
    else:
        with st.container(border=True):
            st.subheader("Forecast table")
            if forecast_df.empty:
                st.info("No forecast table is available yet.", icon=":material/info:")
            else:
                display = forecast_df[["date", "predicted_pm25"]].copy()
                display["category"] = display["predicted_pm25"].apply(lambda value: get_pm25_advisory(float(value)).category)
                st.dataframe(
                    display,
                    hide_index=True,
                    column_config={
                        "date": st.column_config.DateColumn("Date"),
                        "predicted_pm25": st.column_config.NumberColumn("Predicted PM2.5", format="%.2f ug/m3"),
                        "category": st.column_config.TextColumn("Health category"),
                    },
                )

    with st.container(border=True):
        st.subheader("Supporting pollutant view")
        if api_forecast_df.empty:
            st.info("No supporting daily pollutant rows are available yet.", icon=":material/info:")
        else:
            display = api_forecast_df.dropna(subset=["pm25"])[["date", "pm25", "pm10", "no2", "so2", "o3"]].head(7)
            st.dataframe(
                display,
                hide_index=True,
                column_config={
                    "date": st.column_config.DateColumn("Date"),
                    "pm25": st.column_config.NumberColumn("PM2.5", format="%.2f"),
                    "pm10": st.column_config.NumberColumn("PM10", format="%.2f"),
                    "no2": st.column_config.NumberColumn("NO2", format="%.2f"),
                    "so2": st.column_config.NumberColumn("SO2", format="%.2f"),
                    "o3": st.column_config.NumberColumn("O3", format="%.2f"),
                },
            )


def render_flow_page() -> None:
    """Render the graphical flow and table toggle."""

    st.subheader("How the forecast becomes advice")
    st.caption("This view explains the workflow without showing internal platform or credential details.")
    flow_view = st.segmented_control("Flow display", ["Infographic", "Table"], key="flow_view")

    if flow_view == "Infographic":
        cards = []
        for index, row in enumerate(FLOW_ROWS, start=1):
            cards.append(
                f"""
                <div class="flow-card">
                    <div class="flow-number">{index}</div>
                    <h4>{html_text(row["step"])}</h4>
                    <p>{html_text(row["user_view"])}</p>
                </div>
                """
            )
        st.markdown(f'<div class="glass-card"><div class="flow-grid">{"".join(cards)}</div></div>', unsafe_allow_html=True)
    else:
        st.dataframe(pd.DataFrame(FLOW_ROWS), hide_index=True)

    with st.container(border=True):
        st.subheader("Why this flow is review-ready")
        st.write(
            "It starts from a selected Odisha area, builds a daily time-series, checks pattern behavior, "
            "forecasts seven days, and translates the result into a health action."
        )


def render_evidence_page(
    selected_location,
    metrics: dict,
    validation_df: pd.DataFrame,
    decomposition_df: pd.DataFrame,
    ospcb_df: pd.DataFrame,
    readiness_df: pd.DataFrame,
    manifest: dict,
) -> None:
    """Render reviewer-facing evidence and official-data views."""

    st.subheader("Reviewer evidence")
    st.caption("This page is for academic review, so it includes the technical evidence required by the problem statement.")

    left, right = st.columns(2)
    with left:
        with st.container(border=True):
            st.subheader("Stationarity passport")
            stationarity = metrics.get("stationarity", {})
            st.write(
                {
                    "ADF p-value": stationarity.get("adf_p_value"),
                    "ADF reading": stationarity.get("adf_interpretation"),
                    "KPSS p-value": stationarity.get("kpss_p_value"),
                    "KPSS reading": stationarity.get("kpss_interpretation"),
                }
            )

    with right:
        with st.container(border=True):
            st.subheader("Sudden-change scoring")
            rows = metric_rows(metrics)
            if rows.empty:
                st.info("Metrics are not available yet.", icon=":material/info:")
            else:
                best = rows[rows["model"] == metrics.get("best_model_name")]
                st.dataframe(best if not best.empty else rows.head(1), hide_index=True)

    with st.container(border=True):
        st.subheader("Model comparison")
        rows = metric_rows(metrics)
        if rows.empty:
            st.info("Run the Review 2 pipeline to create model metrics.", icon=":material/info:")
        else:
            st.dataframe(rows, hide_index=True)

    with st.container(border=True):
        st.subheader("Last 7-day validation")
        if validation_df.empty:
            st.info("Validation rows are not available yet.", icon=":material/info:")
        else:
            st.dataframe(validation_df, hide_index=True)

    with st.container(border=True):
        st.subheader("Trend-seasonal decomposition")
        if decomposition_df.empty:
            st.info("Decomposition rows are not available yet.", icon=":material/info:")
        else:
            plot_df = decomposition_df.tail(60).melt(
                id_vars=["date"],
                value_vars=["observed", "trend", "seasonal"],
                var_name="component",
                value_name="value",
            )
            st.line_chart(plot_df, x="date", y="value", color="component")

    with st.container(border=True):
        st.subheader("Official Odisha data")
        if readiness_df.empty:
            st.info("Run the Review 2 pipeline to generate readiness rows.", icon=":material/info:")
        else:
            st.dataframe(readiness_df, hide_index=True)

        official_rows = filtered_official_rows(ospcb_df, selected_location.slug)
        if official_rows.empty:
            st.info("No direct/proxy official rows are available for this area yet.", icon=":material/info:")
        else:
            st.dataframe(
                official_rows[
                    ["date", "district", "monitoring_location", "pm25", "pm10", "aqi", "aqi_category", "source_file"]
                ],
                hide_index=True,
            )

    with st.expander("Artifact manifest", icon=":material/folder:"):
        st.write(manifest or {"manifest": "not generated"})


def render_setup_page(selected_location, daily_df: pd.DataFrame, ospcb_df: pd.DataFrame) -> None:
    """Render local setup and data-readiness status."""

    st.subheader("Setup and data readiness")
    st.caption("The demo is intentionally read-only. Credentials stay private on this machine.")

    with st.container(border=True):
        st.subheader("Selected area")
        st.write(
            {
                "area": selected_location.name,
                "priority": selected_location.priority,
                "readable coordinate": readable_area_note(selected_location.slug),
                "public purpose": selected_location.public_audience,
            }
        )

    with st.container(border=True):
        st.subheader("Source status")
        source_badges(daily_df, ospcb_df, selected_location.slug)
        api_status_panel()

    with st.container(border=True):
        st.subheader("Authentication choice")
        st.write(
            "For Review 2, keep the app read-only and unauthenticated. Add login only if it becomes a hosted multi-user product."
        )


def render_bottom_nav(page: str, area_slug: str) -> None:
    """Render the rounded bottom navigation panel from the supplied design direction."""

    links: list[str] = []
    for slug, label, icon, css_class in NAV_ITEMS:
        active = " active" if slug == page else ""
        links.append(
            f"""
            <a class="nav-item {css_class}{active}" href="?page={slug}&area={html_text(area_slug)}">
                <span class="nav-icon"><span class="material-symbols-rounded">{html_text(icon)}</span></span>
                <span>{html_text(label)}</span>
            </a>
            """
        )

    nav_html = f'<div class="nav-dock"><div class="nav-pill-shell">{"".join(links)}</div></div>'
    bottom_container = st.bottom() if hasattr(st, "bottom") else st.container()
    with bottom_container:
        st.markdown(nav_html, unsafe_allow_html=True)


inject_design_css()
ensure_session_defaults()

locations = ordered_locations()
location_names = [location.name for location in locations]
location_by_slug = {location.slug: location for location in locations}
area_from_query = query_value("area", "koraput")
default_index = 0
if area_from_query in location_by_slug:
    default_index = locations.index(location_by_slug[area_from_query])

page = clean_page_slug(query_value("page", "home"))

with st.sidebar:
    st.header("Controls")
    selected_name = st.selectbox("Priority area", location_names, index=default_index)
    selected_location = next(location for location in locations if location.name == selected_name)
    st.caption("Koraput first, then Nawarangpur, then Gunupur.")
    st.caption("Home is user-facing. Evidence and setup are reviewer/internal views.")

st.title("AirSwasthya AI")
st.caption("Odisha-first PM2.5 forecasting and public health-risk advisory")

daily_df = load_csv(str(OPEN_METEO_DIR / f"{selected_location.slug}_daily.csv"))
forecast_df = load_csv(str(FORECAST_DIR / f"{selected_location.slug}_forecast_7_day.csv"))
validation_df = load_csv(str(FORECAST_DIR / f"{selected_location.slug}_validation_7_day.csv"))
decomposition_df = load_csv(str(FORECAST_DIR / f"{selected_location.slug}_decomposition.csv"))
ospcb_df = load_csv(str(OSPCB_PATH))
readiness_df = load_csv(str(READINESS_PATH))
metrics = load_json(str(TS_METRICS_DIR / f"{selected_location.slug}_metrics.json"))
manifest = load_json(str(REVIEW2_MANIFEST_PATH))
history_df, api_forecast_df = split_history_and_api_forecast(daily_df)

if daily_df.empty or forecast_df.empty or not metrics:
    artifact_missing_state()

weather_context = st.skeleton(height=320) if hasattr(st, "skeleton") else nullcontext()
with weather_context:
    current_weather, weather_daily = load_weather(selected_location.slug)

if current_weather.get("error"):
    st.markdown('<div class="glass-card"><div class="loading-strip"></div></div>', unsafe_allow_html=True)
    st.caption("Live weather could not be refreshed. Air-quality forecast artifacts are still available.")

if page == "home":
    render_home(selected_location, history_df, forecast_df, current_weather, weather_daily)
elif page == "forecast":
    render_forecast_page(selected_location, history_df, forecast_df, api_forecast_df, metrics)
elif page == "flow":
    render_flow_page()
elif page == "evidence":
    render_evidence_page(
        selected_location,
        metrics,
        validation_df,
        decomposition_df,
        ospcb_df,
        readiness_df,
        manifest,
    )
else:
    render_setup_page(selected_location, daily_df, ospcb_df)

render_bottom_nav(page, selected_location.slug)
