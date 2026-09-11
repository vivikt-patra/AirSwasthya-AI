# Modeling Notes

## Models Used

The first version uses two models:

1. Linear Regression
2. Random Forest Regressor

## Why Linear Regression

Linear Regression is used as a baseline model. It is easy to explain and helps show whether a simple linear relationship exists between pollutant features and future AQI.

## Why Random Forest

Random Forest is used because pollution and AQI patterns are often non-linear. It can capture more complex relationships while still giving feature importance, which helps with explainability.

## Train/Test Split

The project uses a time-ordered train/test split. This means earlier rows are used for training and later rows are used for testing.

This is important because AQI forecasting should not learn from future data while predicting the past.

## Metrics

The models are compared using:

- MAE: average absolute prediction error
- RMSE: larger errors get stronger penalty
- R2 score: how much variation the model explains

The best model is selected using the lowest RMSE. If there is a tie, the higher R2 score is preferred.

## Saved Model Artifact

The saved model file contains:

- Best trained model
- Model name
- Feature columns used during training
- Target column
- Forecast horizon
- Best model metrics

This makes the Streamlit dashboard easier to build because it can load both the model and the expected feature list.

