# AirSwasthya AI

**Explainable AQI forecasting and health-risk advisory for Odisha review demos.**

AirSwasthya AI is an academic, explainable air-quality project focused on three priority areas: **Koraput**, **Nawarangpur**, and **Gunupur**. It combines data provenance checks, PM2.5 forecasting, AQI-style public advisories, and a polished local dashboard so reviewers can understand both the model output and the limits behind it.

This repository is written to be public-showcase friendly: source code, tests, docs, and safe generated metrics are included; local secrets, raw datasets, build outputs, virtual environments, and release archives are intentionally excluded.

## Current Status

| Area | Honest status |
| --- | --- |
| GitHub publication package | **85% ready**: clean repo, README, docs, tests, frontend checks, private/public split, ignored sensitive artifacts. |
| Review 2 implementation demo | **80% ready**: Odisha-first PM2.5 pipeline, Streamlit console, Next.js demo, generated metrics, and tests are present. |
| Final academic submission | **Not final yet**: final report, final PPT, reviewed screenshots, literature survey, and local ground-sensor validation still need completion. |

## What It Does

- Builds an explainable AQI/PM2.5 project workflow with cleaning, feature engineering, modeling, and advisory rules.
- Prioritizes Koraput first, then Nawarangpur, then Gunupur for Review 2.
- Uses recent Open-Meteo gridded PM2.5 history for the working 7-day PM2.5 forecast demo.
- Uses checked OSPCB 2026 monthly district PDFs as official context where available.
- Compares simple baseline/time-series approaches and stores model metrics for review discussion.
- Presents the result through a Streamlit dashboard and a polished Next.js public demo surface.

## What It Does Not Claim

- It does **not** claim CPCB/OSPCB ground-station daily forecast accuracy for Koraput, Nawarangpur, or Gunupur.
- It does **not** replace official AQI alerts, medical advice, or emergency guidance.
- It does **not** use deep learning or LSTM in the current version.
- It does **not** expose API keys or require provider credentials for the public demo path.
- It does **not** include raw private/local datasets in Git.

## Data Boundary

| Source | Used for | Boundary |
| --- | --- | --- |
| Kaggle/Rohan Rao India AQI CSVs | Historical scaffold and baseline AQI workflow | Historical dataset; target Odisha towns are not direct rows. |
| OSPCB 2026 AAQ/DHQ PDFs | Official monthly district context | Monthly evidence, not enough for direct daily 7-day model validation. |
| Open-Meteo Air Quality API | Recent gridded PM2.5 series for demo forecasts | Model/gridded signal, not a local ground sensor. |

## Review 2 Metrics Snapshot

Generated Review 2 metrics currently use Statsmodels SARIMAX on recent Open-Meteo PM2.5 series:

| Area | Best model | History window | MAE | RMSE | R2 |
| --- | --- | --- | ---: | ---: | ---: |
| Koraput | SARIMAX | 2026-06-08 to 2026-09-07 | 0.8520 | 1.0797 | 0.8974 |
| Nawarangpur | SARIMAX | 2026-06-08 to 2026-09-07 | 1.2185 | 1.4595 | 0.8622 |
| Gunupur | SARIMAX | 2026-06-08 to 2026-09-07 | 1.0420 | 1.1795 | 0.8041 |

These scores validate the recent gridded PM2.5 demo series only. They should not be presented as certified local sensor accuracy.

## Architecture

```text
Raw and reference data
  -> source boundary checks
  -> cleaning and feature engineering
  -> AQI/advisory rules
  -> baseline ML and PM2.5 time-series models
  -> metrics and generated artifacts
  -> Streamlit review console
  -> Next.js public demo dashboard
```

Important implementation files:

- `src/location_sources.py` defines Koraput, Nawarangpur, and Gunupur source profiles.
- `src/open_meteo_client.py` normalizes recent gridded PM2.5/weather data.
- `src/odisha_pdf_ingest.py` extracts OSPCB PDF evidence into structured rows.
- `src/time_series_forecasting.py` trains baseline, ARIMA, SARIMA, and SARIMAX PM2.5 models.
- `scripts/build_review2_pipeline.py` orchestrates Review 2 artifact generation.
- `app/streamlit_app.py` provides the Streamlit review console.
- `frontend/` contains the Next.js/React demo dashboard.

## Tech Stack Actually Used

Python and modeling:

- Python, Pandas, NumPy
- Scikit-learn for baseline regression workflow
- Statsmodels for ARIMA/SARIMA/SARIMAX time-series forecasting
- Joblib for model artifact handling
- Matplotlib/Plotly support for visual analysis
- Pytest for focused tests

Frontend and demo:

- Next.js, React, TypeScript
- Tailwind CSS
- Framer Motion
- Three.js with React Three Fiber
- Zustand for UI state
- Lucide React icons
- Streamlit fallback/review dashboard

Configured but not used for current claims:

- Deep learning, LSTM, production backend deployment, authenticated live APIs, and certified local AQI forecasting.

## Repository Design

The GitHub publishing design follows a public/private split:

- **Private master repo:** full working record, local evidence, ignored raw data, local generated artifacts, and future final-report material.
- **Public showcase repo:** sanitized source, tests, placeholder `.env.example`, public docs, safe generated metrics, and no private artifacts.

See `docs/github_publication_strategy.md` for the exact publishing gate and repository tradeoffs.

## Quick Start

Create a Python environment:

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

Run tests:

```powershell
.\.venv\Scripts\python.exe -m pytest
```

Run the Streamlit review console:

```powershell
.\.venv\Scripts\streamlit.exe run app\streamlit_app.py
```

Run the Next.js demo:

```powershell
cd frontend
npm install --cache .npm-cache
npm run dev -- --port 3000
```

Check the frontend:

```powershell
cd frontend
npm run typecheck
npm run lint
npm run build
```

Rebuild Review 2 artifacts after adding local data:

```powershell
.\.venv\Scripts\python.exe scripts\build_review2_pipeline.py
```

## Local Configuration

Optional provider keys can be placed in a local `.env` file. The file is ignored by Git.

```dotenv
WAQI_API_TOKEN=
DATA_GOV_IN_API_KEY=
OPENAQ_API_KEY=
```

The dashboard reports whether keys are configured, but it does not display key values.

## Verification

Latest local publication gate:

- Python tests: `12 passed`
- Frontend typecheck: passed
- Frontend lint: passed
- Frontend production build: passed
- Secret-pattern scan on committed source: no findings
- Git ignored artifacts checked: `.env`, raw/processed local data, `.venv`, build output, cache folders, and release ZIPs are excluded

## Project Roadmap

1. Add reviewed screenshots for README, report, and PPT.
2. Complete literature survey and dataset license notes.
3. Add final report and final presentation under `reports/`.
4. Replace or calibrate gridded demo forecasts with local ground-sensor daily history if such history becomes available.
5. Add a reproducible release ZIP only after final review artifacts are ready.

## Team

- Person 1: ML model and project lead
- Person 2: Data cleaning, EDA, and graphs
- Person 3: Streamlit UI, report, and PPT

Replace the placeholders with real team names before final submission.

## License

See `LICENSE`.
