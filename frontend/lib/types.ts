export type LocationSlug = "koraput" | "nawarangpur" | "gunupur";

export type NavPage = "home" | "forecast" | "flow" | "evidence" | "setup";

export type RangeMode = "today" | "week";

export type TemperatureUnit = "C" | "F";

export type DisplayMode = "chart" | "table";

export interface LocationProfile {
  name: string;
  slug: LocationSlug;
  latitude: number;
  longitude: number;
  priority: number;
  audience: string;
  note: string;
}

export interface AirDailyRow {
  date: string;
  city: string;
  pm25: number | null;
  pm10: number | null;
  no2: number | null;
  so2: number | null;
  o3: number | null;
  co: number | null;
  dataRole: "history" | "forecast_api" | string;
}

export interface ForecastRow {
  date: string;
  predictedPm25: number | null;
}

export interface ValidationRow {
  date: string;
  actualPm25?: number | null;
  predictedPm25?: number | null;
  error?: number | null;
  [key: string]: string | number | null | undefined;
}

export interface MetricsSummary {
  bestModelName: string;
  historyRows: number;
  historyStart: string;
  historyEnd: string;
  horizonDays: number;
  stationarity: Record<string, string | number | null>;
  metricsByModel: Record<string, Record<string, string | number | null>>;
}

export interface WeatherDailyRow {
  date: string;
  condition: string;
  temperatureMaxC: number | null;
  temperatureMinC: number | null;
  rainProbability: number | null;
  uvIndex: number | null;
  sunrise: string | null;
  sunset: string | null;
  windSpeedKmh: number | null;
}

export interface CurrentWeather {
  temperatureC: number | null;
  apparentTemperatureC: number | null;
  humidity: number | null;
  windSpeedKmh: number | null;
  windDirection: string;
  condition: string;
  isDay: boolean;
  time: string | null;
  error?: string;
}

export interface AreaData {
  daily: AirDailyRow[];
  forecast: ForecastRow[];
  validation: ValidationRow[];
  metrics: MetricsSummary | null;
  weather: {
    current: CurrentWeather;
    daily: WeatherDailyRow[];
  };
  officialRows: number;
}

export interface DashboardData {
  generatedAt: string;
  locations: LocationProfile[];
  areas: Record<LocationSlug, AreaData>;
  providerStatus: Array<{
    provider: string;
    configured: string;
    connection: string;
  }>;
}
