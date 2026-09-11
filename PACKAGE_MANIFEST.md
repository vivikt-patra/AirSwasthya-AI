# AirSwasthya AI package manifest

This package is a professional project scaffold and Review 1/Review 2 preparation bundle for **AirSwasthya AI: Explainable AQI Forecasting and Health-Risk Advisory System for Urban Safety**.

## Package status

Current package type: **implementation scaffold with verified synthetic pipeline**

The package contains code for:

- AQI data loading
- Data cleaning
- Feature engineering
- Regression model training
- Model evaluation
- Saved-model prediction
- AQI category and health advisory
- Streamlit dashboard shell
- EDA graph generation
- Unit tests
- Release documentation

The package does not yet contain:

- Real AQI dataset
- Final trained model from real data
- Final dashboard screenshots
- Final report
- Final PPT
- Real benchmark results

## Primary entry points

| Purpose | File |
| --- | --- |
| Project overview | `README.md` |
| Dashboard | `app/streamlit_app.py` |
| Data cleaning | `src/data_cleaning.py` |
| Feature engineering | `src/feature_engineering.py` |
| Training | `src/train_model.py` |
| Prediction | `src/predict.py` |
| EDA visuals | `src/eda.py` |
| Release audit | `docs/release_readiness_audit.md` |
| Package script | `scripts/create_release_zip.py` |

## Recommended evaluator path

1. Read `README.md`.
2. Read `docs/executive_summary.md`.
3. Inspect `docs/architecture.md`.
4. Run tests with `python -m pytest`.
5. Add real dataset at `data/raw/city_day.csv`.
6. Run cleaning and training commands.
7. Run the Streamlit dashboard.

