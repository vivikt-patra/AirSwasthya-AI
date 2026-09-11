# Review 2 build log

Use this file as the working memory for the next chunks. Update it after each completed chunk instead of rescanning the whole project.

## 2026-09-08 - source decision and implementation start

Decisions:

- Kaggle/Rohan Rao India AQI data is historical, not live. Local file `kaggle_Dataset_2015-25.zip` actually contains 2020-era CSV timestamps and the known `city_day`, `city_hour`, `station_day`, `station_hour`, and `stations` files.
- Kaggle city/station coverage does not include Koraput, Nawarangpur/Nabarangpur, or Gunupur. It only has Odisha cities Brajrajnagar and Talcher.
- OSPCB 2026 DHQ PDFs include monthly rows for Koraput and Nawarangapur from January to May 2026.
- Gunupur was not found in the checked OSPCB Jan-May 2026 AAQ/DHQ PDFs. Rayagada is used only as a district proxy for official monthly context.
- Open-Meteo Air Quality API provides no-key recent gridded PM2.5 data by coordinates and is used for the working target-area forecast demo.

Implemented:

- Added `statsmodels`, `pypdf`, and `pdfplumber` to dependencies.
- Extracted Kaggle CSVs to `data/raw/`.
- Saved OSPCB 2026 AAQ/DHQ PDFs under `data/external/ospcb/`.
- Added target-location profiles in `src/location_sources.py`.
- Added Open-Meteo ingestion in `src/open_meteo_client.py`.
- Added OSPCB PDF extraction in `src/odisha_pdf_ingest.py`.
- Added Statsmodels PM2.5 forecasting in `src/time_series_forecasting.py`.
- Added orchestration script `scripts/build_review2_pipeline.py`.
- Added tests for PM2.5 advisory, Open-Meteo normalization, OSPCB readiness, and time-series helpers.
- Rebuilt `app/streamlit_app.py` as an Odisha-first PM2.5 demo console.

Generated artifacts:

- `data/processed/open_meteo/koraput_daily.csv`
- `data/processed/open_meteo/nawarangpur_daily.csv`
- `data/processed/open_meteo/gunupur_daily.csv`
- `data/processed/odisha_dhq_aaq_2026.csv`
- `data/processed/target_area_readiness.csv`
- `data/processed/forecasts/*_forecast_7_day.csv`
- `data/processed/forecasts/*_validation_7_day.csv`
- `data/processed/forecasts/*_decomposition.csv`
- `models/time_series/*_metrics.json`
- `models/review2_manifest.json`

Current metrics:

| Area | Best model | History | MAE | RMSE | R2 | Spike MAE |
| --- | --- | --- | ---: | ---: | ---: | ---: |
| Koraput | SARIMAX | 2026-06-08 to 2026-09-07 | 0.8520 | 1.0797 | 0.8974 | 0.0754 |
| Nawarangpur | SARIMAX | 2026-06-08 to 2026-09-07 | 1.2185 | 1.4595 | 0.8622 | 0.9596 |
| Gunupur | SARIMAX | 2026-06-08 to 2026-09-07 | 1.0420 | 1.1795 | 0.8041 | 0.9363 |

Boundary:

- These metrics validate the recent Open-Meteo gridded PM2.5 series, not CPCB/OSPCB ground-station daily accuracy.
- Koraput and Nawarangpur have official OSPCB monthly evidence, but not enough daily official rows for direct 7-day ARIMA tuning.
- Gunupur currently has no direct official OSPCB row in the checked 2026 PDFs.

Next chunks:

1. Run full tests and repair any failures.
2. Run Streamlit smoke test.
3. Start local Streamlit server for demo.
4. Add Review 2 screenshot/report material after the dashboard is verified.

## 2026-09-08 - verification

Checks passed:

- `python -m compileall src app scripts tests`
- `python -m pytest`
- Streamlit `AppTest.from_file("app/streamlit_app.py")`

Result:

- 9 pytest tests passed.
- Streamlit smoke test reported 0 app exceptions.
- Dashboard rendered 1 title and 4 metric cards in the default Koraput view.

Next chunk:

- Start the local Streamlit demo server.
- Capture screenshots/report material after visual review.

## 2026-09-08 - demo server and browser check

Server:

- Started Streamlit on `http://localhost:8501`.

Browser verification:

- Default Koraput view loads.
- Source badges show recent PM2.5 series and official OSPCB rows.
- KPI cards show latest PM2.5, next-day forecast, best model, and history used.
- Combined recent-history plus Statsmodels forecast chart renders numeric PM2.5 values.
- Open-Meteo API comparison table no longer includes empty PM2.5 forecast rows.

Fix made during browser check:

- Renamed chart value column from `PM2.5` to `pm25_value` to avoid Vega rendering/accessibility confusion.
- Dropped daily Open-Meteo rows with missing PM2.5 before assigning history/forecast roles.

## 2026-09-09 - API credential slots

Implemented:

- Added `.env.example` with empty WAQI, data.gov.in, and OpenAQ key slots.
- Added local `.env` with empty ignored key slots for the user's machine.
- Added safe `.env` parsing and credential-status helpers in `src/config.py`.
- Added Streamlit API setup status that reports configured/missing only, never secret values.

Boundary:

- Key presence is now detectable.
- Real provider authentication, station coverage, and PM2.5 history checks are still pending.

Verification:

- `python -m compileall src app scripts tests` passed.
- `python -m pytest` passed with 9 tests.
- Streamlit AppTest loaded `app/streamlit_app.py` with 0 exceptions.

## 2026-09-09 - Next.js frontend and interactive infographic

Implemented:

- Added a separate `frontend/` Next.js dashboard for the Review 2 demo.
- Added animated Home, Forecast, Flow, Evidence, and Setup panels.
- Added bottom navigation with animated icon buttons.
- Added Today/Week and C/F controls.
- Added weather-aware visual states for clear, partly cloudy, cloudy, rain, heavy rain, storm, fog, and night.
- Added clickable daily guidance cards for rain gear, mask choice, and outdoor timing.
- Added an animated advisory drawer with simple public-facing explanations.
- Added a dark PM2.5 signal-board infographic with cumulative exposure line, daily PM2.5 bars, forecast markers, and point-level status.
- Added chart/table toggles for both the forecast and infographic flow.
- Kept provider status public-facing only; secret variable names and key values are not shown in the frontend.

Verification:

- `npm run typecheck` passed.
- `npm run build` passed.
- Browser check confirmed advisory drawer opens, Today/Week works, Fahrenheit conversion works, the dark infographic renders, and infographic point selection updates the status card.

Boundary:

- The Next.js frontend is a polished local demo surface. It reads generated project artifacts and safe credential readiness, but it does not expose API keys or internal backend package names.

## 2026-09-10 - refresh interaction and final frontend validation

Implemented:

- Added a real frontend refresh control beside the priority-area selector.
- The refresh button calls the Next.js route refresh and then performs a hard page reload so the user visibly gets a fresh page.
- Weather fetches now use `no-store`, so refresh is not hidden behind the previous 30-minute weather cache.
- Added a boat-cycle animation with water/wake motion for hover and refresh states.
- Temperature formatting now displays degree symbols, for example `22°C` and `75°F`.
- Kept the interaction public-facing: it says Refresh and does not expose provider names, cache internals, or backend implementation details.

Verification:

- `npm run typecheck` passed.
- `npm run lint` passed.
- `npm run build` passed.
- Local server started on `http://localhost:3000`.
- Route smoke check returned HTTP 200 and confirmed the rendered page contains `AirSwasthya AI`, `Refresh`, and `°C`.
