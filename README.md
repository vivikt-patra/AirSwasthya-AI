# AirSwasthya AI

**Detailed title:** AirSwasthya AI: Explainable AQI Forecasting and Health-Risk Advisory System for Urban Safety

AirSwasthya AI is a minor project for forecasting Air Quality Index (AQI) from historical pollutant data and generating simple health-risk advice for urban users. The first version is intentionally clean, explainable, and review-ready.

## Core Idea

The system analyzes pollutants such as PM2.5, PM10, NO2, SO2, CO, and O3, predicts AQI for the next 1-7 days, classifies air quality, and gives advice such as:

- Safe
- Wear mask
- Reduce outdoor activity
- Avoid outdoor activity

## First-Version Scope

Included:

- India AQI dataset from Kaggle/CPCB-style source
- Data cleaning and preprocessing
- EDA graphs
- Linear Regression model
- Random Forest Regressor model
- Model comparison using MAE, RMSE, and R2 score
- Streamlit dashboard
- AQI category and health advisory logic
- Feature importance for explainability

Not included in version 1:

- Deep learning
- LSTM
- Overcomplicated deployment
- Unexplainable model choices

## Tech Stack

Backend / modeling used:

- Python
- Pandas
- NumPy
- Scikit-learn
- Statsmodels
- Joblib

Data and analysis used:

- Historical India AQI CSVs
- Recent Open-Meteo PM2.5 and weather series
- OSPCB monthly PDF evidence
- Matplotlib
- Plotly

Frontend demo used:

- Next.js
- React
- TypeScript
- Tailwind CSS
- Framer Motion
- Three.js / React Three Fiber
- Zustand
- Lucide icons
- Streamlit fallback dashboard

## Team Roles

- Person 1: ML model and project lead
- Person 2: Data cleaning, EDA, and graphs
- Person 3: Streamlit UI, report, and PPT

## Planned Workflow

1. Collect and understand dataset.
2. Clean missing and invalid values.
3. Perform exploratory data analysis.
4. Engineer simple time-based and pollutant-based features.
5. Train baseline and tree-based models.
6. Compare models.
7. Save the best model.
8. Build Streamlit dashboard.
9. Prepare review-wise PPT/report material.

## Run Targets

Create and use the project environment:

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

After placing the raw dataset at `data/raw/city_day.csv`, run:

```powershell
.\.venv\Scripts\python.exe -m src.data_cleaning
.\.venv\Scripts\python.exe -m src.train_model
.\.venv\Scripts\python.exe -m src.eda
.\.venv\Scripts\streamlit.exe run app\streamlit_app.py
```

Run the Review 2 Next.js frontend demo:

```powershell
cd frontend
npm install --cache .npm-cache
npm run dev -- --port 3000
```

Build-check the frontend:

```powershell
cd frontend
npm run typecheck
npm run build
```

Run tests:

```powershell
.\.venv\Scripts\python.exe -m pytest
```

## Optional API Keys

For provider checks, place keys in the local `.env` file. This file is ignored by Git.

```dotenv
WAQI_API_TOKEN=
DATA_GOV_IN_API_KEY=
OPENAQ_API_KEY=
```

The dashboard shows whether each key is present. It does not display the key values.

Build the Odisha-first Review 2 artifacts:

```powershell
.\.venv\Scripts\python.exe scripts\build_review2_pipeline.py
.\.venv\Scripts\streamlit.exe run app\streamlit_app.py
```

## Review 2 Odisha-first update

The project now focuses the demo on these priority areas:

1. Koraput
2. Nawarangpur
3. Gunupur

Important source boundary:

- The Kaggle/Rohan Rao India AQI dataset is historical data, not current live data.
- The extracted Kaggle files cover 2015-2020 style India AQI records and do not contain Koraput, Nawarangpur, or Gunupur as direct city/station rows.
- Official OSPCB 2026 DHQ PDFs provide monthly district evidence for Koraput and Nawarangpur/Nawarangapur.
- Gunupur has no direct official row in the checked Jan-May 2026 OSPCB PDFs, so Rayagada is shown only as district proxy evidence.
- Open-Meteo Air Quality API is used as a no-key recent gridded PM2.5 source for the working 7-day target-area forecast demo.

Current generated Review 2 model results use Statsmodels SARIMAX on recent Open-Meteo PM2.5 series:

| Area | Best model | History window | MAE | RMSE | R2 |
| --- | --- | --- | ---: | ---: | ---: |
| Koraput | SARIMAX | 2026-06-08 to 2026-09-07 | 0.8520 | 1.0797 | 0.8974 |
| Nawarangpur | SARIMAX | 2026-06-08 to 2026-09-07 | 1.2185 | 1.4595 | 0.8622 |
| Gunupur | SARIMAX | 2026-06-08 to 2026-09-07 | 1.0420 | 1.1795 | 0.8041 |

For implementation decisions and progress, read `docs/review2_execution_plan.md` and `docs/review2_build_log.md`.

Create a clean release ZIP:

```powershell
.\.venv\Scripts\python.exe scripts\create_release_zip.py
```

## Review Strategy

The project is built in phases:

- Review 1: idea, problem, objectives, methodology, dataset, timeline
- Review 2: cleaning, EDA, model used, initial result, dashboard screenshots
- Final Review: full report, premium PPT, working demo, result comparison, future scope
