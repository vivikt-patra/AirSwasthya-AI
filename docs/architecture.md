# Architecture explanation

## High-level architecture

AirSwasthya AI uses a modular Python architecture.

```text
Raw AQI CSV
  -> data loading
  -> cleaning
  -> feature engineering
  -> model training
  -> evaluation
  -> saved model artifact
  -> Streamlit dashboard
  -> AQI category and health advisory
```

## Main components

| Component | Files | Responsibility |
| --- | --- | --- |
| Data schema | `src/data_schema.py` | Standardizes expected column names |
| Data loading | `src/data_loader.py` | Reads raw CSV dataset |
| Data cleaning | `src/data_cleaning.py` | Parses dates, removes invalid values, fills missing pollutant values |
| Feature engineering | `src/feature_engineering.py` | Adds date, lag, rolling-average, and future-target features |
| Model evaluation | `src/evaluate_model.py` | Computes MAE, RMSE, and R2 |
| Model training | `src/train_model.py` | Trains Linear Regression and Random Forest, saves best model |
| Time-series forecasting | `src/time_series_forecasting.py` | Runs stationarity checks, decomposition, ARIMA, SARIMA, SARIMAX, and 7-day PM2.5 validation |
| Odisha source extraction | `src/odisha_pdf_ingest.py` | Extracts OSPCB 2026 district-head-quarter AAQ PDF rows |
| Recent target-area data | `src/open_meteo_client.py` | Fetches no-key recent Open-Meteo gridded PM2.5 data for Koraput, Nawarangpur, and Gunupur |
| Prediction | `src/predict.py` | Loads saved model and predicts AQI |
| AQI advisory | `src/aqi_rules.py` | Converts AQI to category and health advice |
| EDA visuals | `src/eda.py` | Generates common exploratory graphs |
| Dashboard | `app/streamlit_app.py` | Displays prediction, category, graphs, metrics, and status |

## Review 2 Odisha-first workflow

```text
Kaggle historical India AQI CSVs
  -> national baseline and data reference

OSPCB 2026 DHQ AAQ PDFs
  -> official monthly Odisha evidence
  -> target-area readiness table

Open-Meteo no-key air-quality API
  -> recent coordinate-level PM2.5 series
  -> stationarity tests
  -> decomposition
  -> naive/ARIMA/SARIMA/SARIMAX comparison
  -> 7-day PM2.5 forecast
  -> Streamlit target-area dashboard
```

## Model artifact structure

The saved Joblib file contains:

- Trained model
- Model name
- Feature column list
- Target column name
- Forecast horizon
- Best-model metrics

This allows the dashboard to know exactly which input columns the trained model expects.

## Current deployment strategy

The first version is deployed locally using Streamlit:

```powershell
streamlit run app/streamlit_app.py
```

Cloud deployment can be added later after dataset licensing, model artifacts, and secrets/configuration are finalized.
