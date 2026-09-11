# Folder structure explanation

```text
AirSwasthya_AI/
  app/                         Streamlit dashboard
  data/
    raw/                       Original datasets
    processed/                 Cleaned datasets
    external/                  Optional external weather data
  docs/                        Technical and review documentation
  metadata/                    Project manifest and package metadata
  models/                      Saved model artifacts and metrics
  notebooks/                   Optional experimentation notebooks
  reports/                     Review PPT/report outputs
  scripts/                     Utility scripts
  src/                         Core Python implementation
  tests/                       Automated tests
  visuals/
    dashboard_screenshots/     Dashboard screenshots for Review 2/final review
    diagrams/                  Mermaid architecture/workflow diagrams
    eda_graphs/                Generated EDA graphs
    model_comparison/          Model comparison visuals
```

## Release package rule

The release ZIP should include source code, docs, scripts, placeholders, and generated review artifacts. It should not include `.venv`, `__pycache__`, `.git`, temporary files, or unrelated local machine files.

