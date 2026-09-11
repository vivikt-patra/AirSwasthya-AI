# Frontend inspiration links for manual refinement

Use these as inspection references only. Do not copy their full scope into this minor project; our problem statement is still PM2.5 time-series forecasting with explainable 7-day advisory output.

## Strong forecasting references

- Victor Sunarko - Environmental Time-Series Intelligence System  
  https://github.com/VictorSunarko/Environmental-Time-Series-Intelligence-System  
  Useful idea: serious README, stationarity/diagnostics, baseline honesty, model comparison, uncertainty/risk framing.

- FMHemerli - air-quality-forecast  
  https://github.com/FMHemerli/air-quality-forecast  
  Useful idea: strict temporal split, persistence baseline, horizon-specific evaluation, honest threshold mismatch discussion.

- Realtime PM2.5 Concentration Forecasting System  
  https://github.com/trinhnth23521662/Realtime-PM2.5-Concentration-Forecasting-System  
  Live dashboard: https://pm25-forecast-dashboard.streamlit.app/  
  Useful idea: visible architecture flow and live dashboard route, but the stack is too heavy for our minor-project scope.

## Dashboard / map references

- OpenAQ Explorer  
  https://explore.openaq.org/  
  Repo: https://github.com/openaq/openaq-explorer  
  Useful idea: map-first exploration, monitor detail panel, latest readings, patterns, and table toggle.

- AQICN World AQI Map  
  https://aqicn.org/map/world/  
  Tile API notes: https://aqicn.info/faq/2015-09-18/map-web-service-real-time-air-quality-tile-api/  
  Useful idea: dense color-coded station map and simple AQI category language.

- Air Quality Dashboard using AQICN + MongoDB + Streamlit  
  https://github.com/siddharthp1997/Air-Quality-Dashboard  
  Live dashboard link is in its README.  
  Useful idea: city filters, maps, pollutant trend charts, secure API-key handling.

## Visual screenshots to inspect

- OpenAQ Explorer screenshot: https://miro.medium.com/0%2AO24zkKZ6aq_OeQ_T
- AQICN map screenshot: https://us1.discourse-cdn.com/flex020/uploads/purpleair/original/1X/b522fced4d8a62936ad56948fe7d7e8bc131f673.png
- PM2.5 prediction dashboard screenshot: https://d2908q01vomqb2.cloudfront.net/2a459380709e2fe4ac2dae5733c73225ff6cfee1/2026/01/28/bedrock-q-air-quality-dashboard-11.png
- Streamlit air quality dashboard screenshot: https://my-portfolio-website-chi-lake.vercel.app/Air%20Quality%20Streamlit/Streamlit%20Portfolio%20Thumbnail.png

## What we should borrow

- Keep the public dashboard understandable before it becomes technical.
- Keep a dark, interactive signal-board infographic because it explains forecast behavior faster than tables.
- Add a map only if Review 2 has time; do not let mapping distract from the time-series learning goal.
- Preserve model honesty: show baseline, validation window, and limitations clearly.
- Keep API secrets invisible and documented as local setup only.

## What we should avoid

- Do not add Kafka/Spark/Cassandra just to look advanced.
- Do not claim station-level live accuracy for Koraput unless direct sensor history is available.
- Do not show backend names or credentials in the public page.
- Do not over-expand into a generic weather app; weather should support PM2.5 advice, not replace the PS.
