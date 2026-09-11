# FAQ

## Is this deep learning?

No. Version 1 uses explainable classical ML models: Linear Regression and Random Forest Regressor.

## Why avoid LSTM?

The first version is meant to be clean, explainable, and review-ready. LSTM can be explored later after the team has a strong baseline.

## What does the model predict?

It predicts future AQI for a selected horizon from 1 to 7 days, depending on training configuration.

## How is advice generated?

The predicted AQI is converted into an AQI category, then mapped to a simple health advisory.

## Can the project run without real data?

Yes, the dashboard can open in demo/advisory mode. Real prediction requires a cleaned dataset and trained model.

## Is the advice medical advice?

No. It is a simple educational health-risk advisory based on AQI category.

