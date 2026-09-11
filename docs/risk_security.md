# Risk analysis and security considerations

## Technical risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Missing or incompatible dataset columns | Cleaning/training fails | Use `docs/dataset_notes.md` and `src/data_schema.py` aliases |
| Data leakage | Unrealistic model performance | Use time-ordered split and shifted future target |
| Weak real-world accuracy | Poor advice quality | Report metrics honestly and avoid medical claims |
| Overclaiming health advice | Ethical/review risk | Keep advisory simple and non-diagnostic |
| Dashboard without model | Demo confusion | Dashboard clearly shows data/model status badges |

## Security considerations

- No secrets should be committed.
- `.streamlit/secrets.toml` is ignored.
- The project currently runs locally and does not expose a public API.
- User-uploaded files should be validated before future upload support is added.
- Model artifacts loaded with Joblib should come only from trusted sources.

## Ethical limitations

AirSwasthya AI is an educational advisory tool, not a medical device. It should not replace official government AQI alerts, doctor advice, or emergency guidance.

