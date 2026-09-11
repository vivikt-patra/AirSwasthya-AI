# Review 2 execution plan

## Stack decision

Backend/modeling:

- Python
- Pandas and NumPy for data preparation
- Statsmodels for ADF, KPSS, seasonal decomposition, ARIMA, SARIMA, and SARIMAX
- Scikit-learn for the existing national baseline models and metrics helpers
- Joblib and JSON/CSV artifacts for reproducible outputs

Frontend:

- Streamlit for the demo console
- Native Streamlit charts, metrics, segmented controls, badges, and dataframes

Data sources:

- Kaggle/Rohan Rao India AQI dataset as historical national baseline, 2015-2020, not live data
- Odisha State Pollution Control Board 2026 AAQ PDFs as official Odisha monthly evidence
- Open-Meteo Air Quality API as no-key recent PM2.5 time series for Koraput, Nawarangpur, and Gunupur demo behavior

## Optimized way to use the stack

The project should not train one generic model and claim local accuracy everywhere. It should use a source ladder:

1. If a target town has enough daily ground-station history, tune a local model for that town.
2. If official data exists only monthly, use it as credibility evidence and calibration context, not as 7-day training data.
3. If no local ground-sensor history exists, use gridded Open-Meteo PM2.5 by exact coordinates for the working demo and clearly label it.

For Review 2, Koraput is the first test area. Nawarangpur and Gunupur reuse the same workflow only after Koraput artifacts are validated.

## Essential workflow

Inspired pattern from stronger implementations:

- Keep source provenance visible.
- Test stationarity before modeling.
- Compare a naive baseline against ARIMA, SARIMA, and SARIMAX.
- Use walk-forward style last-7-day validation.
- Score sudden-change days separately from normal days.
- Show a forecast passport in the dashboard instead of only a single number.

## Step-by-step flow

1. Import data:
   - Extract Kaggle India AQI CSVs into `data/raw/`.
   - Download OSPCB monthly DHQ PDFs into `data/external/ospcb/`.
   - Fetch recent Open-Meteo hourly data for priority areas.

2. Normalize data:
   - Convert Open-Meteo hourly values to daily PM2.5 and pollutants.
   - Extract OSPCB PDF tables into `data/processed/odisha_dhq_aaq_2026.csv`.
   - Create `data/processed/target_area_readiness.csv`.

3. Model:
   - Build daily PM2.5 series per area.
   - Run ADF and KPSS stationarity checks.
   - Build trend-seasonal decomposition.
   - Compare naive, ARIMA, SARIMA, and SARIMAX.
   - Save 7-day validation and 7-day forecast artifacts.

4. Demo:
   - Show Koraput first.
   - Let the user switch to Nawarangpur and Gunupur.
   - Display source status, model metrics, sudden-change score, official rows, and target-audience explanation.

5. Review log:
   - Update `docs/review2_build_log.md` after every completed chunk.
   - Avoid full rescans unless a blocker appears.

## Innovation points

1. Sudden-change score:
   - Separates spike-day MAE from normal-day MAE.
   - Directly matches the problem statement's focus on sudden atmospheric changes.

2. Forecast passport:
   - Shows stationarity result, model used, validation metrics, forecast horizon, source type, and local-data limitation.
   - Makes the demo explainable for reviewers.
