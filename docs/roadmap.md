# AirSwasthya AI Implementation Roadmap

## Phase 1: Project Foundation

Goal: Make the project structure clean enough for the team to work in and for reviewers to understand.

Deliverables:

- Folder structure
- Requirements file
- README
- Review-wise roadmap
- Team ownership documents
- AQI category and advisory rules

## Phase 2: Dataset Collection

Goal: Add an India AQI dataset from a Kaggle/CPCB-based source.

Expected columns:

- Date
- City or station
- PM2.5
- PM10
- NO2
- SO2
- CO
- O3
- AQI

Optional columns:

- Temperature
- Humidity
- Wind speed

Deliverables:

- Dataset in `data/raw/`
- Dataset note in `docs/dataset_notes.md`
- Column understanding table

## Phase 3: Data Cleaning

Goal: Convert raw data into a usable ML-ready dataset.

Tasks:

- Parse date column
- Handle missing values
- Remove impossible pollutant values
- Standardize column names
- Save cleaned file into `data/processed/`

Deliverables:

- `src/data_cleaning.py`
- Cleaned dataset
- Cleaning summary for Review 2

## Phase 4: EDA

Goal: Create graphs that explain the problem and data patterns.

Graphs:

- AQI trend over time
- Pollutant distribution
- Pollutant correlation heatmap
- City-wise AQI comparison
- Pollutant vs AQI relationship

Deliverables:

- EDA notebook
- Saved graphs in `visuals/eda_graphs/`
- Short explanation for each graph

## Phase 5: Model Training

Goal: Train simple, explainable models.

Models:

- Linear Regression
- Random Forest Regressor
- Optional XGBoost only if needed

Metrics:

- MAE
- RMSE
- R2 score

Deliverables:

- `src/train_model.py`
- `src/evaluate_model.py`
- Saved best model in `models/`
- Metrics JSON/table

## Phase 6: Streamlit Dashboard

Goal: Create a clean frontend for demonstration.

Dashboard sections:

- AQI prediction
- AQI category
- Health advisory
- Pollutant trend graph
- Feature importance
- Model comparison

Deliverables:

- `app/streamlit_app.py`
- Dashboard screenshots
- Review 2 demo material

## Phase 7: Final Review Material

Goal: Make the report and PPT polished after the system works.

Deliverables:

- Final report
- Premium final PPT
- Demo script
- Viva/review Q&A notes

