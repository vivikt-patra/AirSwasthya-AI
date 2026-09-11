# Implementation Explanation

## Simple Explanation For Review

AirSwasthya AI works in five main steps:

1. It reads historical AQI and pollutant data.
2. It cleans the data by fixing column names, dates, missing values, and invalid readings.
3. It creates useful features such as month, weekday, previous AQI values, and rolling pollution averages.
4. It trains simple machine-learning models and compares them using MAE, RMSE, and R2 score.
5. It predicts AQI, converts it into an AQI category, and shows health advice on the dashboard.

## Why The Project Is Explainable

The first version uses Linear Regression and Random Forest Regressor:

- Linear Regression is easy to explain as a baseline model.
- Random Forest is stronger for non-linear pollutant patterns and gives feature importance.

The project avoids deep learning in version 1 because the team needs a clean and review-ready implementation that can be explained confidently.

## Data Pipeline

```text
Raw CSV
  -> data_loader.py
  -> data_cleaning.py
  -> feature_engineering.py
  -> train_model.py
  -> saved model
  -> Streamlit dashboard
  -> AQI category and health advisory
```

## Frontend Explanation

The Streamlit dashboard is the user interface. It does not magically create predictions by itself. It loads the trained model, sends input values to the prediction code, receives predicted AQI, and displays:

- AQI value
- AQI category
- Health advisory
- Graphs
- Feature importance

So yes, the frontend also needs to be explainable, but at the workflow level. The team should know what each dashboard section does and which backend module it uses.

