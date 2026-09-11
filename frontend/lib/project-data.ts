import { promises as fs } from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";
import type {
  AirDailyRow,
  AreaData,
  CurrentWeather,
  DashboardData,
  ForecastRow,
  LocationProfile,
  LocationSlug,
  MetricsSummary,
  ValidationRow,
  WeatherDailyRow
} from "@/lib/types";

const PROJECT_ROOT = path.resolve(process.cwd(), "..");

const LOCATIONS: LocationProfile[] = [
  {
    name: "Koraput",
    slug: "koraput",
    latitude: 18.81199,
    longitude: 82.71048,
    priority: 1,
    audience: "Students, parents, outdoor workers, asthma-sensitive residents, school administrators, and local civic bodies.",
    note: "Primary target area for Review 2."
  },
  {
    name: "Nawarangpur",
    slug: "nawarangpur",
    latitude: 19.23114,
    longitude: 82.54826,
    priority: 2,
    audience: "District residents, public-health reviewers, students, and field teams who need simple risk language.",
    note: "Second target area after Koraput."
  },
  {
    name: "Gunupur",
    slug: "gunupur",
    latitude: 19.0804,
    longitude: 83.80879,
    priority: 3,
    audience: "Gunupur residents, nearby schools and colleges, transport workers, and local administrators.",
    note: "Third target area, shown with area-level caution boundaries."
  }
];

const WEATHER_CODES: Record<number, string> = {
  0: "Clear",
  1: "Mostly clear",
  2: "Partly cloudy",
  3: "Cloudy",
  45: "Fog",
  48: "Rime fog",
  51: "Light drizzle",
  53: "Drizzle",
  55: "Dense drizzle",
  61: "Light rain",
  63: "Rain",
  65: "Heavy rain",
  80: "Rain showers",
  81: "Rain showers",
  82: "Violent showers",
  95: "Thunderstorm",
  96: "Thunderstorm hail",
  99: "Thunderstorm hail"
};

type OpenMeteoDailyPayload = {
  time?: string[];
  weather_code?: unknown[];
  temperature_2m_max?: unknown[];
  temperature_2m_min?: unknown[];
  precipitation_probability_max?: unknown[];
  uv_index_max?: unknown[];
  sunrise?: Array<string | null>;
  sunset?: Array<string | null>;
  wind_speed_10m_max?: unknown[];
};

type OpenMeteoPayload = {
  current?: Record<string, unknown>;
  daily?: OpenMeteoDailyPayload;
};

export async function getDashboardData(): Promise<DashboardData> {
  const areas = Object.fromEntries(
    await Promise.all(
      LOCATIONS.map(async (location) => [location.slug, await getAreaData(location)] as const)
    )
  ) as Record<LocationSlug, AreaData>;

  return {
    generatedAt: new Date().toISOString(),
    locations: LOCATIONS,
    areas,
    providerStatus: await getProviderStatus()
  };
}

async function getAreaData(location: LocationProfile): Promise<AreaData> {
  const [dailyRows, forecastRows, validationRows, metrics, officialRows, weather] = await Promise.all([
    readDailyRows(location.slug),
    readForecastRows(location.slug),
    readValidationRows(location.slug),
    readMetrics(location.slug),
    countOfficialRows(location.slug),
    fetchWeather(location)
  ]);

  return {
    daily: dailyRows,
    forecast: forecastRows,
    validation: validationRows,
    metrics,
    weather,
    officialRows
  };
}

async function readCsv(relativePath: string): Promise<Record<string, string>[]> {
  try {
    const file = await fs.readFile(path.join(PROJECT_ROOT, relativePath), "utf-8");
    return parse(file, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    }) as Record<string, string>[];
  } catch {
    return [];
  }
}

async function readJson<T>(relativePath: string): Promise<T | null> {
  try {
    const file = await fs.readFile(path.join(PROJECT_ROOT, relativePath), "utf-8");
    return JSON.parse(file) as T;
  } catch {
    return null;
  }
}

async function readDailyRows(slug: LocationSlug): Promise<AirDailyRow[]> {
  const rows = await readCsv(`data/processed/open_meteo/${slug}_daily.csv`);
  return rows.map((row) => ({
    date: row.date,
    city: row.city,
    pm25: toNumber(row.pm25),
    pm10: toNumber(row.pm10),
    no2: toNumber(row.no2),
    so2: toNumber(row.so2),
    o3: toNumber(row.o3),
    co: toNumber(row.co),
    dataRole: row.data_role
  }));
}

async function readForecastRows(slug: LocationSlug): Promise<ForecastRow[]> {
  const rows = await readCsv(`data/processed/forecasts/${slug}_forecast_7_day.csv`);
  return rows.map((row) => ({
    date: row.date,
    predictedPm25: toNumber(row.predicted_pm25)
  }));
}

async function readValidationRows(slug: LocationSlug): Promise<ValidationRow[]> {
  const rows = await readCsv(`data/processed/forecasts/${slug}_validation_7_day.csv`);
  return rows.map((row) => {
    const normalized: ValidationRow = { date: row.date };
    for (const [key, value] of Object.entries(row)) {
      if (key === "date") {
        continue;
      }
      normalized[toCamelKey(key)] = toNumber(value) ?? value;
    }
    return normalized;
  });
}

async function readMetrics(slug: LocationSlug): Promise<MetricsSummary | null> {
  const raw = await readJson<{
    best_model_name?: string;
    history_rows?: number;
    history_start?: string;
    history_end?: string;
    horizon_days?: number;
    stationarity?: Record<string, string | number | null>;
    metrics_by_model?: Record<string, Record<string, string | number | null>>;
  }>(`models/time_series/${slug}_metrics.json`);

  if (!raw) {
    return null;
  }

  return {
    bestModelName: raw.best_model_name ?? "seasonal forecast",
    historyRows: Number(raw.history_rows ?? 0),
    historyStart: raw.history_start ?? "",
    historyEnd: raw.history_end ?? "",
    horizonDays: Number(raw.horizon_days ?? 7),
    stationarity: raw.stationarity ?? {},
    metricsByModel: raw.metrics_by_model ?? {}
  };
}

async function countOfficialRows(slug: LocationSlug): Promise<number> {
  const rows = await readCsv("data/processed/target_area_readiness.csv");
  const location = LOCATIONS.find((item) => item.slug === slug);
  const found = rows.find((row) => String(row.area ?? "").toLowerCase() === location?.name.toLowerCase());
  return Number(found?.direct_ospcb_rows ?? 0) + Number(found?.proxy_rows ?? 0);
}

async function getProviderStatus(): Promise<DashboardData["providerStatus"]> {
  const envPath = path.join(PROJECT_ROOT, ".env");
  let envText = "";
  try {
    envText = await fs.readFile(envPath, "utf-8");
  } catch {
    envText = "";
  }

  const keys = [
    ["WAQI", "WAQI_API_TOKEN"],
    ["data.gov.in", "DATA_GOV_IN_API_KEY"],
    ["OpenAQ", "OPENAQ_API_KEY"]
  ];

  return keys.map(([provider, key]) => ({
    provider,
    configured: isConfigured(readEnvValue(envText, key)) ? "yes" : "no",
    connection: "not checked"
  }));
}

async function fetchWeather(location: LocationProfile): Promise<AreaData["weather"]> {
  const params = new URLSearchParams({
    latitude: location.latitude.toFixed(5),
    longitude: location.longitude.toFixed(5),
    current: [
      "temperature_2m",
      "relative_humidity_2m",
      "apparent_temperature",
      "is_day",
      "weather_code",
      "cloud_cover",
      "wind_speed_10m",
      "wind_direction_10m"
    ].join(","),
    daily: [
      "weather_code",
      "temperature_2m_max",
      "temperature_2m_min",
      "precipitation_probability_max",
      "uv_index_max",
      "sunrise",
      "sunset",
      "wind_speed_10m_max"
    ].join(","),
    timezone: "auto",
    forecast_days: "7"
  });

  try {
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`weather ${response.status}`);
    }
    const payload = (await response.json()) as OpenMeteoPayload;
    return normalizeWeather(payload);
  } catch (error) {
    return {
      current: {
        temperatureC: null,
        apparentTemperatureC: null,
        humidity: null,
        windSpeedKmh: null,
        windDirection: "unknown",
        condition: "Weather unavailable",
        isDay: true,
        time: null,
        error: error instanceof Error ? error.message : "weather unavailable"
      },
      daily: []
    };
  }
}

function normalizeWeather(payload: OpenMeteoPayload): AreaData["weather"] {
  const current = payload?.current ?? {};
  const daily = payload?.daily ?? {};
  const dailyRows: WeatherDailyRow[] = (daily.time ?? []).map((date: string, index: number) => ({
    date,
    condition: describeWeatherCode(daily.weather_code?.[index]),
    temperatureMaxC: toNumber(daily.temperature_2m_max?.[index]),
    temperatureMinC: toNumber(daily.temperature_2m_min?.[index]),
    rainProbability: toNumber(daily.precipitation_probability_max?.[index]),
    uvIndex: toNumber(daily.uv_index_max?.[index]),
    sunrise: daily.sunrise?.[index] ?? null,
    sunset: daily.sunset?.[index] ?? null,
    windSpeedKmh: toNumber(daily.wind_speed_10m_max?.[index])
  }));

  const currentWeather: CurrentWeather = {
    temperatureC: toNumber(current.temperature_2m),
    apparentTemperatureC: toNumber(current.apparent_temperature),
    humidity: toNumber(current.relative_humidity_2m),
    windSpeedKmh: toNumber(current.wind_speed_10m),
    windDirection: windDirectionLabel(current.wind_direction_10m),
    condition: describeWeatherCode(current.weather_code),
    isDay: Boolean(current.is_day ?? true),
    time: typeof current.time === "string" ? current.time : null
  };

  return { current: currentWeather, daily: dailyRows };
}

function describeWeatherCode(code: unknown): string {
  const parsed = Number(code);
  return WEATHER_CODES[parsed] ?? "Mixed conditions";
}

function windDirectionLabel(value: unknown): string {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return "unknown";
  }
  const labels = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return labels[Math.round((number % 360) / 45) % labels.length];
}

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toCamelKey(value: string): string {
  return value.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
}

function readEnvValue(text: string, key: string): string {
  const line = text.split(/\r?\n/).find((entry) => entry.trim().startsWith(`${key}=`));
  return line?.split("=").slice(1).join("=").trim() ?? "";
}

function isConfigured(value: string): boolean {
  const normalized = value.trim().replace(/^["']|["']$/g, "");
  if (!normalized) {
    return false;
  }
  const lowered = normalized.toLowerCase();
  return !lowered.includes("your_") && !lowered.includes("your-");
}
