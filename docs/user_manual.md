# User manual

## Purpose

The Streamlit dashboard lets a user view AQI trends, pollutant levels, model metrics, feature importance, and health advisory output.

## Running the dashboard

```powershell
.\.venv\Scripts\streamlit.exe run app\streamlit_app.py
```

## Dashboard states

### Demo preview

If no real cleaned dataset exists, the dashboard shows built-in demo values. This mode is useful for checking layout only.

### Advisory only

If no trained model exists, the dashboard uses the manual AQI slider to demonstrate AQI category and health advisory logic.

### Trained model mode

After cleaning the dataset and training the model, the dashboard loads:

- `data/processed/clean_aqi_data.csv`
- `models/best_model.joblib`
- `models/model_metrics.json`

It then displays model-based AQI prediction and related advisory output.

## Expected user flow

1. Open dashboard.
2. Select city from sidebar.
3. Check latest AQI and pollutant profile.
4. Review model comparison.
5. Review feature importance.
6. Read health advisory.

