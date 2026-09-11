# Developer manual

## Environment setup

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

## Local verification

```powershell
.\.venv\Scripts\python.exe -m pytest
.\.venv\Scripts\python.exe -m compileall src app scripts
```

## Demo data workflow

Create synthetic data:

```powershell
.\.venv\Scripts\python.exe scripts\create_sample_data.py
```

Clean it:

```powershell
.\.venv\Scripts\python.exe -m src.data_cleaning data\raw\sample_city_day.csv
```

The default cleaning module expects `data/raw/city_day.csv`. For custom paths, use the Python function `clean_dataset(input_path, output_path)`.

## Real data workflow

1. Place real India AQI CSV at `data/raw/city_day.csv`.
2. Run data cleaning:

```powershell
.\.venv\Scripts\python.exe -m src.data_cleaning
```

3. Train model:

```powershell
.\.venv\Scripts\python.exe -m src.train_model
```

4. Generate EDA visuals:

```powershell
.\.venv\Scripts\python.exe -m src.eda
```

5. Run dashboard:

```powershell
.\.venv\Scripts\streamlit.exe run app\streamlit_app.py
```

## Adding a new model

Add a candidate model in `get_candidate_models()` inside `src/train_model.py`. Keep the model explainable and update `docs/modeling_notes.md`.

