# Maintenance guide

## Updating dataset

1. Replace or add raw CSV in `data/raw/`.
2. Document source and date in `docs/dataset_notes.md`.
3. Run cleaning.
4. Regenerate EDA visuals.
5. Retrain model.
6. Update metrics and screenshots.

## Updating model

1. Add or tune model in `src/train_model.py`.
2. Run tests.
3. Train on cleaned dataset.
4. Compare metrics.
5. Update `docs/modeling_notes.md`.

## Updating dashboard

1. Edit `app/streamlit_app.py`.
2. Run dashboard locally.
3. Capture screenshots.
4. Update `docs/visual_asset_requirements.md`.

## Release process

1. Run tests.
2. Run compile check.
3. Update changelog.
4. Create release ZIP.
5. Extract ZIP in a temporary folder and verify setup instructions.

