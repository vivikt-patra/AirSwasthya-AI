# Module documentation

## `src.aqi_rules`

Purpose: Converts numeric AQI into category, risk level, message, and color.

Important functions:

- `classify_aqi(aqi)`
- `get_health_advisory(aqi)`

## `src.data_schema`

Purpose: Defines standard column names and aliases for raw datasets.

Important function:

- `normalize_column_name(column_name)`

## `src.data_loader`

Purpose: Loads raw AQI CSV files.

Important function:

- `load_raw_dataset(path)`

## `src.data_cleaning`

Purpose: Converts raw AQI data into a clean training-ready dataset.

Important functions:

- `standardize_columns(df)`
- `validate_required_columns(df)`
- `clean_aqi_dataframe(df)`
- `clean_dataset(input_path, output_path)`

## `src.feature_engineering`

Purpose: Creates calendar, lag, rolling-average, and future-target features.

Important functions:

- `add_date_features(df)`
- `add_lag_features(df)`
- `add_rolling_features(df)`
- `create_forecast_target(df, forecast_horizon_days)`
- `build_model_frame(df, forecast_horizon_days)`

## `src.evaluate_model`

Purpose: Calculates regression metrics and selects best model.

Important functions:

- `calculate_regression_metrics(y_true, y_pred)`
- `select_best_model(metrics_by_model)`

## `src.train_model`

Purpose: Trains candidate models and saves the best model artifact.

Important functions:

- `get_candidate_models(random_state)`
- `train_and_select_model(...)`
- `time_ordered_train_test_split(df, test_size)`

## `src.predict`

Purpose: Loads saved model artifact and produces AQI predictions.

Important functions:

- `load_model_artifact(model_path)`
- `predict_aqi(model_input, model_path)`
- `predict_with_advisory(model_input, model_path)`

## `src.eda`

Purpose: Generates EDA graph images from the cleaned dataset.

Important function:

- `generate_eda_visuals(clean_dataset_path, output_dir)`

