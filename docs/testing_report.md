# Testing report

## Current automated tests

| Test file | Coverage |
| --- | --- |
| `tests/test_aqi_rules.py` | AQI category thresholds and advisory output |
| `tests/test_data_pipeline.py` | Column cleaning, missing-value filling, future target creation |

## Manual verification already performed

- Project dependencies were installed in `.venv`.
- Synthetic AQI training test passed.
- Temporary model artifact was created and loaded.
- Prediction returned AQI category and health advisory.

## Required tests before final release

- Real dataset cleaning test
- Real model training test
- Dashboard launch test
- Screenshot validation
- EDA visual generation test
- Reproducibility test from fresh ZIP extraction

## Command

```powershell
.\.venv\Scripts\python.exe -m pytest
```

