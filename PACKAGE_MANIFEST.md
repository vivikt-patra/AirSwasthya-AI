# AirSwasthya AI Package Manifest

This package is a production-ready project showcase and academic evaluation bundle for **AirSwasthya AI: Explainable PM2.5 Forecasting and Health-Risk Advisory System for Southern Odisha**.

## Package Status

Current package type: **Production-Ready Web Dashboard & SARIMAX Machine Learning Pipeline**

The package contains:

- Next.js 16 Web Dashboard (`frontend/`) with React 19, Tailwind CSS, Framer Motion, and 3D Canvas.
- Statsmodels SARIMAX time-series model pipeline (`src/time_series_forecasting.py`).
- Open-Meteo satellite atmospheric reanalysis client (`src/open_meteo_client.py`).
- CPCB health-risk advisory engine (`src/aqi_advisory.py`).
- OSPCB PDF document ingest module (`src/odisha_pdf_ingest.py`).
- Streamlit review console (`app/streamlit_app.py`).
- Automated Python test suite (`tests/`).
- Full GIET student project team documentation (`README.md`, `CONTRIBUTORS.md`, `CREDITS.md`).

## Primary Entry Points

| Purpose | File / Directory |
| --- | --- |
| **Project Overview** | [`README.md`](README.md) |
| **Next.js Web Dashboard** | [`frontend/`](frontend/) |
| **Streamlit Review Console** | [`app/streamlit_app.py`](app/streamlit_app.py) |
| **SARIMAX Forecasting Model** | [`src/time_series_forecasting.py`](src/time_series_forecasting.py) |
| **Satellite Data Ingestion** | [`src/open_meteo_client.py`](src/open_meteo_client.py) |
| **Team & Credits** | [`CONTRIBUTORS.md`](CONTRIBUTORS.md) |
| **Release Changelog** | [`CHANGELOG.md`](CHANGELOG.md) |

## Recommended Evaluator Path

1. Read [`README.md`](README.md).
2. Inspect [`frontend/components/dashboard-shell.tsx`](frontend/components/dashboard-shell.tsx) for web dashboard.
3. Run frontend with `cd frontend && npm run dev`.
4. Run Python backend tests with `pytest`.
5. Launch Streamlit review console with `streamlit run app/streamlit_app.py`.
