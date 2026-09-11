# Dataset Notes

## Recommended Dataset Type

Use an India AQI dataset from a Kaggle/CPCB-based source. The common format is a city-wise daily AQI CSV, often named something like `city_day.csv`.

Place the raw CSV here:

```text
data/raw/city_day.csv
```

## Expected Columns

The data-cleaning module is designed to accept common column names and convert them into a standard internal format.

| Meaning | Common raw names | Standard name |
| --- | --- | --- |
| Date | Date, date | date |
| City | City, city | city |
| PM2.5 | PM2.5, PM2_5, PM25 | pm25 |
| PM10 | PM10 | pm10 |
| Nitrogen dioxide | NO2 | no2 |
| Sulfur dioxide | SO2 | so2 |
| Carbon monoxide | CO | co |
| Ozone | O3 | o3 |
| Air Quality Index | AQI | aqi |
| AQI category | AQI_Bucket, AQI Bucket | aqi_bucket |

## Cleaning Rules

The first version uses explainable cleaning rules:

1. Standardize column names.
2. Convert date into datetime format.
3. Convert pollutant and AQI columns into numeric values.
4. Treat negative pollutant/AQI values as invalid.
5. Drop rows without date or AQI.
6. Fill missing pollutant values using city-wise median where possible.
7. Fill remaining missing pollutant values using global median.
8. Add AQI category using standard India AQI ranges.

## Why This Is Easy To Explain

The model should learn from realistic pollution readings. Invalid or missing values can confuse the model, so the cleaning stage makes the dataset consistent before training. Median filling is used because pollution values can contain spikes, and median is less affected by extreme values than mean.

## Optional Weather Features

Weather features can be added later from Open-Meteo or NASA POWER:

- Temperature
- Humidity
- Wind speed

For version 1, pollutant-only forecasting is enough and easier to defend during review.

