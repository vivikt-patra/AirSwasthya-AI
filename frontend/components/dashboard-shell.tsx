"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import {
  Activity,
  BarChart3,
  Clock3,
  CloudRain,
  Droplets,
  GitBranch,
  Gauge,
  Home,
  LucideIcon,
  RefreshCw,
  Search,
  Settings2,
  ShieldCheck,
  Sun,
  Thermometer,
  Umbrella,
  Wind,
  X
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { create } from "zustand";
import * as THREE from "three";
import {
  formatNumber,
  formatPercent,
  formatTemperature,
  getPm25Advisory
} from "@/lib/aqi";
import type {
  AirDailyRow,
  AreaData,
  CurrentWeather,
  DashboardData,
  DisplayMode,
  ForecastRow,
  LocationSlug,
  NavPage,
  RangeMode,
  TemperatureUnit,
  WeatherDailyRow
} from "@/lib/types";

type UiState = {
  area: LocationSlug;
  page: NavPage;
  range: RangeMode;
  unit: TemperatureUnit;
  forecastMode: DisplayMode;
  flowMode: DisplayMode;
  setArea: (area: LocationSlug) => void;
  setPage: (page: NavPage) => void;
  setRange: (range: RangeMode) => void;
  setUnit: (unit: TemperatureUnit) => void;
  setForecastMode: (mode: DisplayMode) => void;
  setFlowMode: (mode: DisplayMode) => void;
};

const useUiStore = create<UiState>((set) => ({
  area: "koraput",
  page: "home",
  range: "week",
  unit: "C",
  forecastMode: "chart",
  flowMode: "chart",
  setArea: (area) => set({ area }),
  setPage: (page) => set({ page }),
  setRange: (range) => set({ range }),
  setUnit: (unit) => set({ unit }),
  setForecastMode: (forecastMode) => set({ forecastMode }),
  setFlowMode: (flowMode) => set({ flowMode })
}));

const navItems: Array<{
  id: NavPage;
  label: string;
  icon: LucideIcon;
  hover: string;
}> = [
  { id: "home", label: "Home", icon: Home, hover: "hover:from-white hover:to-red-100" },
  { id: "forecast", label: "Forecast", icon: BarChart3, hover: "hover:from-white hover:to-orange-100" },
  { id: "flow", label: "Flow", icon: GitBranch, hover: "hover:from-white hover:to-lime-100" },
  { id: "evidence", label: "Evidence", icon: ShieldCheck, hover: "hover:from-white hover:to-yellow-100" },
  { id: "setup", label: "Setup", icon: Settings2, hover: "hover:from-white hover:to-emerald-100" }
];

const flowRows = [
  {
    step: "Area focus",
    userView: "Select Koraput, then expand to Nawarangpur and Gunupur.",
    purpose: "Keeps the project local and easy to explain."
  },
  {
    step: "Recent air signal",
    userView: "Daily PM2.5 and supporting air values are prepared.",
    purpose: "Builds the time-series used for forecasting."
  },
  {
    step: "Pattern check",
    userView: "Trend, seasonality, and sudden shifts are inspected.",
    purpose: "Matches the problem-statement learning goal."
  },
  {
    step: "Seven-day outlook",
    userView: "The next week is shown as a chart or table.",
    purpose: "Turns analysis into a readable forecast."
  },
  {
    step: "Health action",
    userView: "The PM2.5 level becomes simple caution language.",
    purpose: "Makes output useful for non-technical users."
  }
];

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function DashboardShell({ data }: { data: DashboardData }) {
  const { area, page, setArea } = useUiStore();
  const selectedLocation = data.locations.find((location) => location.slug === area) ?? data.locations[0];
  const areaData = data.areas[selectedLocation.slug];
  const history = areaData.daily.filter((row) => row.dataRole === "history");
  const nextPm25 = getNextPm25(areaData.forecast, history);

  return (
    <main className="relative min-h-screen overflow-hidden px-4 pb-32 pt-5 sm:px-6 lg:px-8">
      <AirScene pm25={nextPm25 ?? 18} />
      <div className="mx-auto max-w-7xl">
        <header className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-sm font-semibold uppercase tracking-normal text-leaf">Odisha-first PM2.5 advisory</p>
            <h1 className="mt-1 text-4xl font-semibold tracking-normal text-ink sm:text-5xl">AirSwasthya AI</h1>
          </motion.div>

          <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto md:items-center">
            <motion.label
              className="glass-panel flex w-full items-center gap-3 rounded-full px-4 py-3 md:w-[360px]"
              whileHover={{ y: -2, boxShadow: "0 18px 42px rgba(47, 125, 91, 0.16)" }}
            >
              <Search className="h-5 w-5 text-leaf" />
              <select
                aria-label="Select priority area"
                value={selectedLocation.slug}
                onChange={(event) => setArea(event.target.value as LocationSlug)}
                className="w-full bg-transparent text-sm font-semibold text-ink outline-none"
              >
                {data.locations.map((location) => (
                  <option key={location.slug} value={location.slug}>
                    {location.name}, Odisha
                  </option>
                ))}
              </select>
            </motion.label>
            <RefreshControl />
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.section
            key={`${page}-${selectedLocation.slug}`}
            initial={{ opacity: 0, y: 18, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -10, filter: "blur(8px)" }}
            transition={{ duration: 0.32, ease: "easeOut" }}
          >
            {page === "home" && <HomePage location={selectedLocation} area={areaData} />}
            {page === "forecast" && <ForecastPage locationName={selectedLocation.name} area={areaData} />}
            {page === "flow" && <FlowPage locationName={selectedLocation.name} area={areaData} />}
            {page === "evidence" && <EvidencePage area={areaData} />}
            {page === "setup" && (
              <SetupPage
                area={areaData}
                providerStatus={data.providerStatus}
                location={selectedLocation}
                generatedAt={data.generatedAt}
              />
            )}
          </motion.section>
        </AnimatePresence>
      </div>

      <BottomNav />
    </main>
  );
}

function HomePage({ location, area }: { location: DashboardData["locations"][number]; area: AreaData }) {
  const { range, unit, setRange, setUnit } = useUiStore();
  const [activeAction, setActiveAction] = useState<DailyAction | null>(null);
  const history = area.daily.filter((row) => row.dataRole === "history");
  const next = getNextPm25(area.forecast, history);
  const advisory = getPm25Advisory(next);
  const rows = buildOutlookRows(area.weather.daily, area.forecast);
  const current = area.weather.current;
  const condition = current.condition || rows[0]?.condition || "Air outlook";
  const actions = buildDailyActions({
    locationName: location.name,
    pm25: next,
    advisory,
    today: rows[0],
    current
  });

  return (
    <>
      <div className="metal-panel grid gap-4 rounded-[32px] p-4 lg:grid-cols-[0.85fr_1.55fr]">
        <motion.aside
          className="glass-panel flex min-h-[580px] flex-col justify-between rounded-[28px] p-8"
          whileHover={{ y: -3 }}
        >
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm">
              <Search className="h-4 w-4" />
              {location.name} local air and weather
            </div>

            <WeatherGlyph condition={condition} isDay={current.isDay} />

            <motion.div
              className="text-7xl font-medium leading-none tracking-normal text-black sm:text-8xl"
              key={`${unit}-${current.temperatureC}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22 }}
            >
              {formatTemperature(current.temperatureC, unit)}
            </motion.div>
            <p className="mt-3 text-lg text-slate-500">{condition} | updated {formatTime(current.time)}</p>

            <div className="mt-7 grid gap-3 border-t border-slate-200/80 pt-6 text-sm">
              <MiniLine label="Feels like" value={formatTemperature(current.apparentTemperatureC, unit)} />
              <MiniLine label="PM2.5 forecast" value={`${formatNumber(next)} ug/m3`} />
              <MiniLine label="Rain chance" value={formatPercent(rows[0]?.rainProbability)} />
            </div>

            <ActionStrip actions={actions} onOpen={setActiveAction} />
          </div>

          <motion.div
            className="rounded-3xl bg-[linear-gradient(135deg,rgba(35,59,47,0.18),rgba(19,36,29,0.74)),linear-gradient(110deg,#886947_0%,#b88c61_32%,#5e8f72_68%,#35665a_100%)] p-5 text-white shadow-focusLift"
            whileHover={{ y: -3, scale: 1.01 }}
          >
            <p className="text-lg font-semibold">{location.name}, Odisha</p>
            <p className="mt-1 text-sm text-white/82">{readableCoordinate(location.latitude, location.longitude)}</p>
            <p className="mt-2 text-sm text-white/72">Area-level signal, not a personal home-location reading.</p>
          </motion.div>
        </motion.aside>

        <section className="glass-panel rounded-[28px] p-6">
          <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-normal text-slate-500">PM2.5 early warning</p>
              <h2 className="mt-1 text-3xl font-semibold tracking-normal text-ink">Today and week outlook</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              <Segmented
                label="Weather range"
                value={range}
                options={[
                  ["today", "Today"],
                  ["week", "Week"]
                ]}
                onChange={(value) => setRange(value as RangeMode)}
              />
              <Segmented
                label="Temperature unit"
                value={unit}
                options={[
                  ["C", "C"],
                  ["F", "F"]
                ]}
                onChange={(value) => setUnit(value as TemperatureUnit)}
              />
            </div>
          </div>

          <WeekCards rows={rows} range={range} unit={unit} />

          <div className="mb-3 mt-8 flex items-end justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-normal text-slate-500">Today highlights</p>
              <h3 className="text-2xl font-semibold tracking-normal text-ink">What matters now</h3>
            </div>
            <span className={cn("rounded-full bg-white/70 px-3 py-1 text-sm font-semibold", advisory.color)}>
              {advisory.category}
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <HighlightCard icon={Gauge} label="PM2.5 outlook" value={`${formatNumber(next)} ug/m3`} note={advisory.category} />
            <HighlightCard icon={Wind} label="Wind status" value={`${formatNumber(current.windSpeedKmh)} km/h`} note={current.windDirection} />
            <HighlightCard icon={Sun} label="Sunrise and sunset" value={formatTime(rows[0]?.sunrise)} note={`Sunset ${formatTime(rows[0]?.sunset)}`} />
            <HighlightCard icon={Droplets} label="Humidity" value={formatPercent(current.humidity)} note="Local comfort reading" />
            <HighlightCard icon={CloudRain} label="Rain chance" value={formatPercent(rows[0]?.rainProbability)} note="Daily maximum probability" />
            <HighlightCard icon={Thermometer} label="Feels like" value={formatTemperature(current.apparentTemperatureC, unit)} note="Perceived outdoor heat" />
          </div>

          <motion.div className="mt-5 rounded-3xl border border-white/70 bg-white/66 p-5" whileHover={{ y: -2 }}>
            <p className="font-semibold text-ink">Health advisory</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">{advisory.message}</p>
            <p className="mt-2 text-xs text-slate-500">PM2.5 concentration guidance, not a full AQI replacement.</p>
          </motion.div>
        </section>
      </div>

      <ActionDrawer action={activeAction} onClose={() => setActiveAction(null)} />
    </>
  );
}

function ForecastPage({ locationName, area }: { locationName: string; area: AreaData }) {
  const { forecastMode, setForecastMode } = useUiStore();
  const history = area.daily.filter((row) => row.dataRole === "history");
  const latest = getLatestPm25(history);
  const next = getNextPm25(area.forecast, history);
  const advisory = getPm25Advisory(next);

  return (
    <div className="space-y-5">
      <PageHeading
        kicker="Seven-day outlook"
        title={`${locationName} PM2.5 forecast`}
        text="This public page keeps the result readable: recent air signal, next-week outlook, and health category."
      />

      <div className="grid gap-4 md:grid-cols-4">
        <Kpi label="Latest PM2.5" value={`${formatNumber(latest)} ug/m3`} note="Recent day" />
        <Kpi label="Next-day forecast" value={`${formatNumber(next)} ug/m3`} note={advisory.category} />
        <Kpi label="History window" value={`${area.metrics?.historyRows ?? 0} days`} note={area.metrics?.historyEnd || "not ready"} />
        <Kpi label="Forecast horizon" value="7 days" note="Daily PM2.5" />
      </div>

      <div className="glass-panel rounded-[28px] p-5">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h3 className="text-2xl font-semibold tracking-normal">Forecast display</h3>
          <Segmented
            label="Forecast display"
            value={forecastMode}
            options={[
              ["chart", "Chart"],
              ["table", "Table"]
            ]}
            onChange={(value) => setForecastMode(value as DisplayMode)}
          />
        </div>

        {forecastMode === "chart" ? (
          <ForecastChart history={history} forecast={area.forecast} />
        ) : (
          <ForecastTable forecast={area.forecast} />
        )}
      </div>

      <AirQualityInfographic locationName={locationName} area={area} />

      <div className="glass-panel rounded-[28px] p-5">
        <h3 className="mb-3 text-2xl font-semibold tracking-normal">Supporting pollutant view</h3>
        <DataTable
          rows={area.daily
            .filter((row) => row.dataRole === "forecast_api")
            .slice(0, 7)
            .map((row) => ({
              Date: shortDate(row.date),
              "PM2.5": formatNumber(row.pm25),
              PM10: formatNumber(row.pm10),
              NO2: formatNumber(row.no2),
              SO2: formatNumber(row.so2),
              O3: formatNumber(row.o3)
            }))}
        />
      </div>
    </div>
  );
}

function FlowPage({ locationName, area }: { locationName: string; area: AreaData }) {
  const { flowMode, setFlowMode } = useUiStore();

  return (
    <div className="space-y-5">
      <PageHeading
        kicker="Infographic"
        title="PM2.5 forecast signal board"
        text="This is the review-facing visual story: exposure trend, daily forecast bars, and explainable markers in one panel."
      />

      <div className="glass-panel rounded-[28px] p-5">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h3 className="text-2xl font-semibold tracking-normal">Infographic display</h3>
          <Segmented
            label="Flow display"
            value={flowMode}
            options={[
              ["chart", "Infographic"],
              ["table", "Table"]
            ]}
            onChange={(value) => setFlowMode(value as DisplayMode)}
          />
        </div>

        {flowMode === "chart" ? (
          <AirQualityInfographic locationName={locationName} area={area} compact />
        ) : (
          <DataTable rows={flowRows.map((row) => ({ Step: row.step, "User view": row.userView, Purpose: row.purpose }))} />
        )}
      </div>
    </div>
  );
}

function EvidencePage({ area }: { area: AreaData }) {
  const modelRows = Object.entries(area.metrics?.metricsByModel ?? {}).map(([key, value]) => ({
    Model: modelLabel(key),
    MAE: formatNumber(Number(value.mae), 3),
    RMSE: formatNumber(Number(value.rmse), 3),
    "R score": formatNumber(Number(value.r2), 3),
    "Spike MAE": formatNumber(Number(value.spike_mae), 3)
  }));

  return (
    <div className="space-y-5">
      <PageHeading
        kicker="Review evidence"
        title="Model behavior and validation"
        text="This section is for academic review, so it includes the time-series checks required by the problem statement."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="glass-panel rounded-[28px] p-5">
          <h3 className="text-xl font-semibold">Stationarity passport</h3>
          <DataTable
            rows={Object.entries(area.metrics?.stationarity ?? {}).map(([key, value]) => ({
              Check: sentenceKey(key),
              Result: String(value ?? "--")
            }))}
          />
        </div>
        <div className="glass-panel rounded-[28px] p-5">
          <h3 className="text-xl font-semibold">Current boundary</h3>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            The result is a review-grade area forecast, not a certified government warning. Stronger direct sensor history
            will improve local accuracy claims.
          </p>
          <div className="mt-4 rounded-2xl bg-white/65 p-4 text-sm text-slate-700">
            Official rows checked: <strong>{area.officialRows}</strong>
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-[28px] p-5">
        <h3 className="mb-3 text-xl font-semibold">Model comparison</h3>
        <DataTable rows={modelRows} />
      </div>

      <div className="glass-panel rounded-[28px] p-5">
        <h3 className="mb-3 text-xl font-semibold">Last validation window</h3>
        <DataTable
          rows={area.validation.slice(-7).map((row) => ({
            Date: shortDate(row.date),
            Actual: formatNumber(Number(row.actualPm25 ?? row.actual_pm25)),
            Predicted: formatNumber(Number(row.predictedPm25 ?? row.predicted_pm25)),
            Error: formatNumber(Number(row.error))
          }))}
        />
      </div>
    </div>
  );
}

function SetupPage({
  area,
  providerStatus,
  location,
  generatedAt
}: {
  area: AreaData;
  providerStatus: DashboardData["providerStatus"];
  location: DashboardData["locations"][number];
  generatedAt: string;
}) {
  return (
    <div className="space-y-5">
      <PageHeading
        kicker="Setup"
        title="Readiness and access choice"
        text="For Review 2, the frontend is read-only. Login is not needed unless this becomes a hosted multi-user product."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Kpi label="Selected area" value={location.name} note={`Priority ${location.priority}`} />
        <Kpi label="History rows" value={`${area.metrics?.historyRows ?? 0}`} note={area.metrics?.historyEnd || "not ready"} />
        <Kpi label="Updated" value={shortDate(generatedAt)} note="Frontend data load" />
      </div>

      <div className="glass-panel rounded-[28px] p-5">
        <h3 className="mb-3 text-xl font-semibold">Human-readable coordinate</h3>
        <p className="text-sm leading-6 text-slate-600">{readableCoordinate(location.latitude, location.longitude)}</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">{location.audience}</p>
      </div>

      <div className="glass-panel rounded-[28px] p-5">
        <h3 className="mb-3 text-xl font-semibold">Provider key readiness</h3>
        <DataTable rows={providerStatus.map((row) => ({ Provider: row.provider, Configured: row.configured, Connection: row.connection }))} />
        <p className="mt-3 text-xs text-slate-500">The frontend does not display secret names or key values.</p>
      </div>
    </div>
  );
}

function BottomNav() {
  const { page, setPage } = useUiStore();

  return (
    <nav className="fixed inset-x-0 bottom-5 z-30 flex justify-center px-4">
      <div className="glass-panel flex max-w-[96vw] gap-2 overflow-x-auto rounded-full p-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = page === item.id;
          return (
            <motion.button
              key={item.id}
              type="button"
              onClick={() => setPage(item.id)}
              className={cn(
                "group flex items-center gap-2 rounded-full bg-gradient-to-b px-3 py-2 text-sm font-semibold text-ink transition-colors",
                item.hover,
                active && "from-emerald-50 to-amber-50 shadow-focusLift"
              )}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.96 }}
              aria-current={active ? "page" : undefined}
            >
              <motion.span
                className="grid h-10 w-10 place-items-center rounded-2xl bg-white/70 shadow-inner transition-colors group-hover:bg-white"
                whileHover={{ rotate: -7, scale: 1.08 }}
              >
                <Icon className="h-5 w-5" />
              </motion.span>
              <span className="hidden sm:inline">{item.label}</span>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
}

function RefreshControl() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isCycling, setIsCycling] = useState(false);
  const active = isCycling || isPending;

  function refreshData() {
    if (active) {
      return;
    }
    setIsCycling(true);
    startTransition(() => {
      router.refresh();
    });
    window.setTimeout(() => {
      window.location.reload();
    }, 950);
  }

  return (
    <motion.button
      type="button"
      aria-label="Refresh latest air and weather data"
      data-testid="refresh-button"
      className={cn("refresh-boat-button", active && "cycling")}
      onClick={refreshData}
      disabled={active}
      whileHover={{ y: -2, scale: 1.01 }}
      whileTap={{ scale: 0.97 }}
    >
      <span className="boat-lane" aria-hidden="true">
        <span className="boat-wake" />
        <span className="boat-body">
          <span className="boat-sail" />
        </span>
      </span>
      <span className="flex items-center gap-2">
        <RefreshCw className={cn("h-4 w-4", active && "animate-spin")} />
        {active ? "Refreshing" : "Refresh"}
      </span>
    </motion.button>
  );
}

function Segmented({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: string;
  options: Array<[string, string]>;
  onChange: (value: string) => void;
}) {
  return (
    <div aria-label={label} className="inline-flex rounded-full border border-white/70 bg-white/60 p-1 shadow-sm">
      {options.map(([optionValue, optionLabel]) => {
        const active = value === optionValue;
        return (
          <motion.button
            key={optionValue}
            type="button"
            onClick={() => onChange(optionValue)}
            className={cn(
              "relative min-w-16 rounded-full px-4 py-2 text-sm font-bold transition-colors",
              active ? "text-white" : "text-slate-500 hover:text-ink"
            )}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.96 }}
          >
            {active && (
              <motion.span
                layoutId={`${label}-indicator`}
                className="absolute inset-0 rounded-full bg-gradient-to-br from-ink to-leaf shadow-focusLift"
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
              />
            )}
            <span className="relative z-10">{optionLabel}</span>
          </motion.button>
        );
      })}
    </div>
  );
}

type WeatherMood = "clear" | "partly" | "cloudy" | "rain" | "heavy-rain" | "storm" | "fog";

type DailyAction = {
  id: string;
  title: string;
  badge: string;
  summary: string;
  detail: string;
  icon: LucideIcon;
  tone: string;
};

function WeatherGlyph({ condition, isDay = true }: { condition: string; isDay?: boolean }) {
  const mood = classifyWeather(condition);

  return (
    <div className={cn("weather-glyph my-8", mood, !isDay && "night")} aria-label={condition} role="img">
      <span className="cloud" />
      <span className="cloud second" />
      <span className="sun" />
      <span className="mist m1" />
      <span className="mist m2" />
      <span className="rain-line r1" />
      <span className="rain-line r2" />
      <span className="rain-line r3" />
      <span className="rain-line r4" />
      <span className="bolt" />
    </div>
  );
}

function MiniWeatherGlyph({ condition }: { condition: string }) {
  const mood = classifyWeather(condition);

  return (
    <span className={cn("mini-weather", mood)} aria-hidden="true">
      <span className="mini-sun" />
      <span className="mini-cloud" />
      <span className="mini-rain" />
    </span>
  );
}

function WeekCards({ rows, range, unit }: { rows: OutlookRow[]; range: RangeMode; unit: TemperatureUnit }) {
  const visible = rows.slice(0, range === "today" ? 1 : 7);

  return (
    <div className={cn("grid gap-3", range === "today" ? "max-w-md grid-cols-1" : "grid-cols-2 xl:grid-cols-7")}>
      {visible.map((row) => (
        <motion.div
          key={row.date}
          className="glass-panel rounded-3xl p-4 text-center"
          whileHover={{ y: -5, scale: 1.015, boxShadow: "0 20px 42px rgba(97,111,99,0.16)" }}
        >
          <p className="text-xs font-semibold text-slate-500">{weekday(row.date)}</p>
          <motion.div className="mx-auto my-3 grid h-10 w-14 place-items-center" whileHover={{ rotate: 5, scale: 1.06 }}>
            <MiniWeatherGlyph condition={row.condition} />
          </motion.div>
          <p className="text-xl font-bold text-ink">{formatTemperature(row.temperatureMaxC, unit)}</p>
          <p className="mt-1 text-xs text-slate-500">
            {formatTemperature(row.temperatureMinC, unit)} | {formatNumber(row.predictedPm25)} ug/m3
          </p>
          <p className="mt-1 text-xs text-slate-500">{row.condition}</p>
        </motion.div>
      ))}
    </div>
  );
}

function ActionStrip({ actions, onOpen }: { actions: DailyAction[]; onOpen: (action: DailyAction) => void }) {
  return (
    <div className="mt-6 space-y-3" data-testid="action-strip">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-ink">Today needs</p>
        <span className="rounded-full bg-white/65 px-3 py-1 text-xs font-semibold text-slate-500">Tap for detail</span>
      </div>
      <div className="grid gap-3">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <motion.button
              key={action.id}
              type="button"
              data-testid={`action-${action.id}`}
              onClick={() => onOpen(action)}
              className="group relative overflow-hidden rounded-3xl border border-white/72 bg-white/58 p-4 text-left shadow-sm transition-colors hover:bg-white/82"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06, duration: 0.28 }}
              whileHover={{ y: -3, scale: 1.012 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className={cn("absolute inset-y-0 left-0 w-1.5", action.tone)} />
              <span className="flex items-start gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/76 text-leaf shadow-inner transition-transform group-hover:scale-110">
                  <Icon className="h-5 w-5" />
                </span>
                <span>
                  <span className="text-xs font-bold uppercase tracking-normal text-slate-500">{action.badge}</span>
                  <span className="mt-1 block text-sm font-bold leading-5 text-ink">{action.title}</span>
                  <span className="mt-1 block text-sm leading-5 text-slate-600">{action.summary}</span>
                </span>
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

function ActionDrawer({ action, onClose }: { action: DailyAction | null; onClose: () => void }) {
  return (
    <AnimatePresence>
      {action && (
        <motion.div className="fixed inset-0 z-40 flex items-end justify-center px-4 pb-5 sm:items-center" role="dialog" aria-modal="true">
          <motion.button
            type="button"
            className="absolute inset-0 bg-slate-950/38 backdrop-blur-sm"
            aria-label="Close advisory"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.article
            className="relative w-full max-w-xl overflow-hidden rounded-[30px] border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.94),rgba(234,241,235,0.82))] p-6 shadow-[0_34px_90px_rgba(10,28,18,0.3)]"
            data-testid="action-drawer"
            initial={{ opacity: 0, y: 34, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 360, damping: 34 }}
          >
            {(() => {
              const Icon = action.icon;
              return (
                <>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-leaf shadow-inner">
                  <Icon className="h-6 w-6" />
                </span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-normal text-slate-500">{action.badge}</p>
                  <h3 className="text-2xl font-semibold tracking-normal text-ink">{action.title}</h3>
                </div>
              </div>
              <motion.button
                type="button"
                aria-label="Close advisory"
                className="grid h-10 w-10 place-items-center rounded-full bg-white/80 text-slate-600 shadow-sm"
                onClick={onClose}
                whileHover={{ rotate: 8, scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <X className="h-5 w-5" />
              </motion.button>
            </div>
            <p className="mt-5 text-base leading-7 text-slate-700">{action.detail}</p>
            <div className="mt-5 rounded-2xl border border-white/80 bg-white/70 p-4 text-sm leading-6 text-slate-600">
              This is an advisory from local weather and PM2.5 forecast signals. For emergencies, official alerts should
              be treated as final.
            </div>
                </>
              );
            })()}
          </motion.article>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function HighlightCard({ icon: Icon, label, value, note }: { icon: LucideIcon; label: string; value: string; note: string }) {
  return (
    <motion.div className="glass-panel rounded-3xl p-5" whileHover={{ y: -4, boxShadow: "0 22px 48px rgba(52,68,59,0.13)" }}>
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/70 text-leaf shadow-inner">
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-semibold tracking-normal text-black">{value}</p>
      <p className="mt-3 text-sm text-slate-600">{note}</p>
    </motion.div>
  );
}

function Kpi({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <motion.div className="glass-panel rounded-3xl p-5" whileHover={{ y: -3 }}>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-normal text-ink">{value}</p>
      <p className="mt-2 text-sm text-slate-500">{note}</p>
    </motion.div>
  );
}

function PageHeading({ kicker, title, text }: { kicker: string; title: string; text: string }) {
  return (
    <div className="metal-panel rounded-[28px] p-6">
      <p className="text-xs font-bold uppercase tracking-normal text-leaf">{kicker}</p>
      <h2 className="mt-1 text-3xl font-semibold tracking-normal text-ink">{title}</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{text}</p>
    </div>
  );
}

function MiniLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 text-slate-700">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function AirQualityInfographic({
  locationName,
  area,
  compact = false
}: {
  locationName: string;
  area: AreaData;
  compact?: boolean;
}) {
  const [activePoint, setActivePoint] = useState<InfographicPoint | null>(null);
  const [activeSeries, setActiveSeries] = useState<InfographicSeries>("forecast");
  const history = area.daily.filter((row) => row.dataRole === "history");
  const points = buildInfographicPoints(history, area.forecast);
  const milestones = buildMilestones(points);

  if (!points.length) {
    return <EmptyState text="No PM2.5 infographic can be drawn until forecast artifacts exist." />;
  }

  const width = 1120;
  const cumulativeTop = 70;
  const cumulativeHeight = 250;
  const dailyTop = 400;
  const dailyHeight = 210;
  const left = 70;
  const right = 32;
  const chartWidth = width - left - right;
  const height = 680;
  const maxCumulative = Math.max(...points.map((point) => point.cumulative), 1);
  const maxDaily = Math.max(...points.map((point) => point.value), 30);
  const xFor = (index: number) => left + (index / Math.max(points.length - 1, 1)) * chartWidth;
  const cumulativeY = (value: number) => cumulativeTop + cumulativeHeight - (value / maxCumulative) * cumulativeHeight;
  const dailyY = (value: number) => dailyTop + dailyHeight - (value / maxDaily) * dailyHeight;
  const observedPoints = points.filter((point) => point.kind === "history");
  const forecastPoints = points.filter((point) => point.kind === "forecast");
  const connector = observedPoints.at(-1);
  const forecastLinePoints = connector ? [connector, ...forecastPoints] : forecastPoints;
  const observedLine = observedPoints.map((point) => `${xFor(point.index)},${cumulativeY(point.cumulative)}`).join(" ");
  const forecastLine = forecastLinePoints.map((point) => `${xFor(point.index)},${cumulativeY(point.cumulative)}`).join(" ");
  const labels = axisLabels(points);
  const thresholdY = dailyY(30);
  const displayPoint = activePoint ?? forecastPoints[0] ?? points.at(-1) ?? points[0];

  return (
    <motion.section
      className={cn(
        "overflow-hidden rounded-[30px] border border-emerald-300/15 bg-[#071d12] p-5 text-emerald-50 shadow-[0_28px_90px_rgba(5,31,19,0.28)]",
        compact ? "mt-0" : "mt-5"
      )}
      data-testid="air-infographic"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.35 }}
    >
      <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/15 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-normal text-emerald-200">
            <Activity className="h-4 w-4" />
            Forecast infographic
          </div>
          <h3 className="mt-3 text-2xl font-semibold tracking-normal text-white">{locationName} PM2.5 signal board</h3>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-emerald-100/72">
            The top panel shows cumulative exposure pressure. The lower panel shows day-by-day PM2.5, with markers for
            history start, forecast start, peak risk, and day 7.
          </p>
        </div>
        <div className="flex flex-col gap-3 md:items-end">
          <InfographicStatus point={displayPoint} series={activeSeries} />
          <div className="flex flex-wrap gap-2 text-xs font-semibold">
            <Legend color="#4fc3dc" label="Recent PM2.5" />
            <Legend color="#f06ba8" label="7-day forecast" />
            <Legend color="#d7d95a" label="Risk markers" />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-3xl border border-emerald-200/10 bg-[#092817] p-3">
        <svg viewBox={`0 0 ${width} ${height}`} className="min-w-[980px]">
          <defs>
            <linearGradient id="aqLine" x1="0" x2="1">
              <stop offset="0%" stopColor="#4fc3dc" />
              <stop offset="100%" stopColor="#70f0b7" />
            </linearGradient>
            <linearGradient id="forecastLine" x1="0" x2="1">
              <stop offset="0%" stopColor="#f06ba8" />
              <stop offset="100%" stopColor="#f4b63d" />
            </linearGradient>
            <linearGradient id="dailyBar" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#54d1e3" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#54d1e3" stopOpacity="0.24" />
            </linearGradient>
            <linearGradient id="forecastBar" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#f06ba8" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#f4b63d" stopOpacity="0.25" />
            </linearGradient>
          </defs>

          <text x={left} y="24" fill="#d8f8e5" fontSize="17" fontWeight="700">
            Cumulative PM2.5 exposure, ug/m3-days
          </text>
          <text x={left} y="354" fill="#d8f8e5" fontSize="17" fontWeight="700">
            Daily PM2.5, ug/m3
          </text>

          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = cumulativeTop + cumulativeHeight * ratio;
            const value = maxCumulative * (1 - ratio);
            return (
              <g key={`cum-${ratio}`}>
                <line x1={left} x2={width - right} y1={y} y2={y} stroke="rgba(168, 220, 189, 0.13)" />
                <text x="18" y={y + 5} fill="rgba(216, 248, 229, 0.62)" fontSize="12">
                  {Math.round(value)}
                </text>
              </g>
            );
          })}

          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = dailyTop + dailyHeight * ratio;
            const value = maxDaily * (1 - ratio);
            return (
              <g key={`daily-${ratio}`}>
                <line x1={left} x2={width - right} y1={y} y2={y} stroke="rgba(168, 220, 189, 0.13)" />
                <text x="24" y={y + 5} fill="rgba(216, 248, 229, 0.62)" fontSize="12">
                  {Math.round(value)}
                </text>
              </g>
            );
          })}

          <line x1={left} x2={width - right} y1={thresholdY} y2={thresholdY} stroke="#d7d95a" strokeDasharray="7 8" strokeOpacity="0.62" />
          <text x={width - 175} y={thresholdY - 8} fill="#d7d95a" fontSize="12">
            Good upper band
          </text>

          <motion.polyline
            points={observedLine}
            fill="none"
            stroke="url(#aqLine)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="cursor-crosshair"
            onMouseEnter={() => {
              setActiveSeries("recent");
              setActivePoint(observedPoints.at(-1) ?? null);
            }}
            onClick={() => {
              setActiveSeries("recent");
              setActivePoint(observedPoints.at(-1) ?? null);
            }}
            initial={{ pathLength: 0, opacity: 0.35 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.1, ease: "easeOut" }}
          />
          <motion.polyline
            points={forecastLine}
            fill="none"
            stroke="url(#forecastLine)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="10 8"
            className="cursor-crosshair"
            onMouseEnter={() => {
              setActiveSeries("forecast");
              setActivePoint(forecastPoints[0] ?? forecastLinePoints.at(-1) ?? null);
            }}
            onClick={() => {
              setActiveSeries("forecast");
              setActivePoint(forecastPoints[0] ?? forecastLinePoints.at(-1) ?? null);
            }}
            initial={{ pathLength: 0, opacity: 0.35 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.1, delay: 0.15, ease: "easeOut" }}
          />
          <polyline
            points={observedLine}
            fill="none"
            stroke="transparent"
            strokeWidth="22"
            pointerEvents="stroke"
            onMouseEnter={() => {
              setActiveSeries("recent");
              setActivePoint(observedPoints.at(-1) ?? null);
            }}
            onClick={() => {
              setActiveSeries("recent");
              setActivePoint(observedPoints.at(-1) ?? null);
            }}
          />
          <polyline
            points={forecastLine}
            fill="none"
            stroke="transparent"
            strokeWidth="22"
            pointerEvents="stroke"
            onMouseEnter={() => {
              setActiveSeries("forecast");
              setActivePoint(forecastPoints[0] ?? forecastLinePoints.at(-1) ?? null);
            }}
            onClick={() => {
              setActiveSeries("forecast");
              setActivePoint(forecastPoints[0] ?? forecastLinePoints.at(-1) ?? null);
            }}
          />

          {points.map((point) => {
            const barWidth = Math.max(chartWidth / points.length - 2, 4);
            const x = xFor(point.index) - barWidth / 2;
            const y = dailyY(point.value);
            const active = displayPoint.index === point.index;
            return (
              <motion.rect
                key={`${point.date}-${point.kind}`}
                data-testid={`infographic-bar-${point.index}`}
                x={x}
                y={y}
                width={barWidth}
                height={dailyTop + dailyHeight - y}
                rx="2"
                fill={point.kind === "forecast" ? "url(#forecastBar)" : "url(#dailyBar)"}
                opacity={active ? 1 : 0.82}
                className="cursor-crosshair"
                onMouseEnter={() => {
                  setActiveSeries(point.kind === "forecast" ? "forecast" : "recent");
                  setActivePoint(point);
                }}
                onClick={() => {
                  setActiveSeries(point.kind === "forecast" ? "forecast" : "recent");
                  setActivePoint(point);
                }}
                initial={{ scaleY: 0, transformOrigin: "bottom" }}
                animate={{ scaleY: 1 }}
                transition={{ duration: 0.42, delay: Math.min(point.index * 0.008, 0.35) }}
              />
            );
          })}

          {points.map((point) => {
            const active = displayPoint.index === point.index;
            const x = xFor(point.index);
            const y = cumulativeY(point.cumulative);
            return (
              <g
                key={`${point.date}-${point.kind}-point`}
                tabIndex={0}
                role="button"
                aria-label={`${point.kind === "forecast" ? "Forecast" : "Recent"} point ${shortDate(point.date)} PM2.5 ${formatNumber(point.value)} ug/m3`}
                className="cursor-crosshair outline-none"
                onMouseEnter={() => {
                  setActiveSeries(point.kind === "forecast" ? "forecast" : "recent");
                  setActivePoint(point);
                }}
                onFocus={() => {
                  setActiveSeries(point.kind === "forecast" ? "forecast" : "recent");
                  setActivePoint(point);
                }}
                onClick={() => {
                  setActiveSeries(point.kind === "forecast" ? "forecast" : "recent");
                  setActivePoint(point);
                }}
              >
                <circle
                  data-testid={`infographic-point-${point.index}`}
                  cx={x}
                  cy={y}
                  r="14"
                  fill="rgba(255,255,255,0.001)"
                  onMouseEnter={() => {
                    setActiveSeries(point.kind === "forecast" ? "forecast" : "recent");
                    setActivePoint(point);
                  }}
                  onClick={() => {
                    setActiveSeries(point.kind === "forecast" ? "forecast" : "recent");
                    setActivePoint(point);
                  }}
                />
                <motion.circle
                  cx={x}
                  cy={y}
                  r={active ? 7 : 3.5}
                  fill={point.kind === "forecast" ? "#f4b63d" : "#70f0b7"}
                  stroke={active ? "#ffffff" : "transparent"}
                  strokeWidth="2"
                  animate={{ opacity: active ? 1 : 0.72 }}
                />
                <title>{`${shortDate(point.date)}: PM2.5 ${formatNumber(point.value)} ug/m3, ${getPm25Advisory(point.value).category}`}</title>
              </g>
            );
          })}

          {displayPoint && (
            <g>
              <line
                x1={xFor(displayPoint.index)}
                x2={xFor(displayPoint.index)}
                y1={cumulativeTop}
                y2={dailyTop + dailyHeight}
                stroke="#ffffff"
                strokeOpacity="0.28"
                strokeDasharray="4 8"
              />
              <circle
                cx={xFor(displayPoint.index)}
                cy={dailyY(displayPoint.value)}
                r="7"
                fill="none"
                stroke="#ffffff"
                strokeOpacity="0.72"
                strokeWidth="2"
              />
            </g>
          )}

          {milestones.map((marker) => {
            const point = points[marker.index];
            const x = xFor(marker.index);
            return (
              <g key={marker.label}>
                <line x1={x} x2={x} y1={cumulativeTop} y2={dailyTop + dailyHeight + 8} stroke="rgba(215,217,90,0.14)" />
                <circle cx={x} cy={dailyTop + dailyHeight + 25} r="13" fill="rgba(215,217,90,0.12)" stroke="#d7d95a" />
                <circle cx={x} cy={dailyTop + dailyHeight + 25} r="4" fill="#d7d95a" />
                <text x={x - 42} y={dailyTop + dailyHeight + 51} fill="rgba(216,248,229,0.72)" fontSize="11">
                  {marker.label}
                </text>
                <title>{`${marker.label}: ${shortDate(point.date)}, PM2.5 ${formatNumber(point.value)} ug/m3`}</title>
              </g>
            );
          })}

          {labels.map((label) => (
            <text key={label.index} x={xFor(label.index) - 18} y={height - 18} fill="rgba(216,248,229,0.68)" fontSize="12">
              {label.label}
            </text>
          ))}
        </svg>
      </div>
    </motion.section>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200/10 bg-white/5 px-3 py-1 text-emerald-100/82">
      <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

type InfographicSeries = "recent" | "forecast";

type InfographicPoint = {
  date: string;
  value: number;
  kind: "history" | "forecast";
  cumulative: number;
  index: number;
};

function InfographicStatus({ point, series }: { point: InfographicPoint; series: InfographicSeries }) {
  const advisory = getPm25Advisory(point.value);

  return (
    <motion.div
      key={`${point.index}-${series}`}
      className="min-w-[260px] rounded-3xl border border-emerald-200/14 bg-white/[0.07] p-4 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.22 }}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-bold uppercase tracking-normal text-emerald-100/62">
          {series === "forecast" ? "Forecast line" : "Recent line"}
        </span>
        <span className="rounded-full bg-emerald-100/10 px-3 py-1 text-xs font-semibold text-emerald-100">
          {shortDate(point.date)}
        </span>
      </div>
      <div className="mt-3 flex items-end gap-2">
        <span className="text-3xl font-semibold tracking-normal text-white">{formatNumber(point.value)}</span>
        <span className="pb-1 text-sm text-emerald-100/70">ug/m3 PM2.5</span>
      </div>
      <p className={cn("mt-2 text-sm font-semibold", darkAdvisoryText(point.value))}>{advisory.category}</p>
      <p className="mt-1 text-sm leading-5 text-emerald-100/68">{advisory.message}</p>
    </motion.div>
  );
}

function buildInfographicPoints(history: AirDailyRow[], forecast: ForecastRow[]): InfographicPoint[] {
  const historyPoints = history
    .slice(-75)
    .filter((row) => row.pm25 !== null)
    .map((row) => ({ date: row.date, value: row.pm25 as number, kind: "history" as const }));
  const forecastPoints = forecast
    .filter((row) => row.predictedPm25 !== null)
    .map((row) => ({ date: row.date, value: row.predictedPm25 as number, kind: "forecast" as const }));
  let cumulative = 0;

  return [...historyPoints, ...forecastPoints].map((point, index) => {
    cumulative += point.value;
    return { ...point, cumulative, index };
  });
}

function buildMilestones(points: InfographicPoint[]) {
  if (!points.length) {
    return [];
  }

  const forecastStart = points.findIndex((point) => point.kind === "forecast");
  const peak = points.reduce((best, point) => (point.value > best.value ? point : best), points[0]);
  const indexes = [
    { index: 0, label: "history" },
    { index: Math.max(forecastStart, 0), label: "forecast" },
    { index: peak.index, label: "peak" },
    { index: points.length - 1, label: "day 7" }
  ];

  const seen = new Set<number>();
  return indexes.filter((marker) => {
    if (seen.has(marker.index)) {
      return false;
    }
    seen.add(marker.index);
    return marker.index >= 0;
  });
}

function darkAdvisoryText(value: number): string {
  if (value <= 30) {
    return "text-emerald-200";
  }
  if (value <= 60) {
    return "text-lime-200";
  }
  if (value <= 90) {
    return "text-amber-200";
  }
  if (value <= 120) {
    return "text-orange-200";
  }
  return "text-red-200";
}

function axisLabels(points: InfographicPoint[]) {
  const indexes = new Set<number>();
  const step = Math.max(Math.floor(points.length / 6), 1);
  for (let index = 0; index < points.length; index += step) {
    indexes.add(index);
  }
  indexes.add(points.length - 1);
  return [...indexes].sort((a, b) => a - b).map((index) => ({ index, label: shortDate(points[index].date) }));
}

function ForecastChart({ history, forecast }: { history: AirDailyRow[]; forecast: ForecastRow[] }) {
  const points = [
    ...history.slice(-35).map((row) => ({ date: row.date, value: row.pm25, kind: "Recent PM2.5" })),
    ...forecast.map((row) => ({ date: row.date, value: row.predictedPm25, kind: "7-day forecast" }))
  ].filter((row) => row.value !== null) as Array<{ date: string; value: number; kind: string }>;

  if (!points.length) {
    return <EmptyState text="No forecast chart is available yet." />;
  }

  const width = 900;
  const height = 320;
  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const spread = Math.max(max - min, 1);
  const coords = points.map((point, index) => {
    const x = (index / Math.max(points.length - 1, 1)) * width;
    const y = height - ((point.value - min) / spread) * (height - 40) - 20;
    return `${x},${y}`;
  });
  const forecastStart = history.slice(-35).filter((row) => row.pm25 !== null).length;
  const recentCoords = coords.slice(0, forecastStart).join(" ");
  const forecastCoords = coords.slice(Math.max(forecastStart - 1, 0)).join(" ");

  return (
    <div className="overflow-hidden rounded-3xl bg-white/60 p-4">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-[320px] w-full">
        <defs>
          <linearGradient id="forecastFill" x1="0" x2="1">
            <stop offset="0%" stopColor="#2f7d5b" />
            <stop offset="100%" stopColor="#f4b63d" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3].map((line) => (
          <line
            key={line}
            x1="0"
            x2={width}
            y1={20 + line * 86}
            y2={20 + line * 86}
            stroke="rgba(90,105,96,0.14)"
          />
        ))}
        <polyline points={recentCoords} fill="none" stroke="#2f7d5b" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points={forecastCoords} fill="none" stroke="url(#forecastFill)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="9 8" />
      </svg>
      <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-600">
        <span className="inline-flex items-center gap-2"><span className="h-2 w-6 rounded-full bg-leaf" />Recent PM2.5</span>
        <span className="inline-flex items-center gap-2"><span className="h-2 w-6 rounded-full bg-amberAir" />7-day forecast</span>
      </div>
    </div>
  );
}

function ForecastTable({ forecast }: { forecast: ForecastRow[] }) {
  return (
    <DataTable
      rows={forecast.map((row) => ({
        Date: shortDate(row.date),
        "Predicted PM2.5": `${formatNumber(row.predictedPm25)} ug/m3`,
        Category: getPm25Advisory(row.predictedPm25).category
      }))}
    />
  );
}

function DataTable({ rows }: { rows: Array<Record<string, string | number | null | undefined>> }) {
  if (!rows.length) {
    return <EmptyState text="No rows are available yet." />;
  }

  const columns = Object.keys(rows[0]);
  return (
    <div className="overflow-x-auto rounded-3xl border border-white/70 bg-white/66">
      <table className="min-w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200/80 text-slate-500">
            {columns.map((column) => (
              <th className="whitespace-nowrap px-4 py-3 font-semibold" key={column}>
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr className="border-b border-slate-100/90 last:border-0" key={index}>
              {columns.map((column) => (
                <td className="whitespace-nowrap px-4 py-3 text-slate-700" key={column}>
                  {String(row[column] ?? "--")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/70 bg-white/60 p-6">
      <div className="loading-strip relative mb-4 h-2 overflow-hidden rounded-full bg-emerald-100" />
      <p className="text-sm text-slate-500">{text}</p>
    </div>
  );
}

type OutlookRow = WeatherDailyRow & { predictedPm25: number | null };

function classifyWeather(condition: string): WeatherMood {
  const text = condition.toLowerCase();

  if (text.includes("thunder") || text.includes("storm")) {
    return "storm";
  }
  if (text.includes("heavy") || text.includes("violent")) {
    return "heavy-rain";
  }
  if (text.includes("rain") || text.includes("drizzle") || text.includes("shower")) {
    return "rain";
  }
  if (text.includes("fog") || text.includes("mist")) {
    return "fog";
  }
  if (text.includes("partly") || text.includes("mostly clear")) {
    return "partly";
  }
  if (text.includes("cloud") || text.includes("overcast")) {
    return "cloudy";
  }
  if (text.includes("clear") || text.includes("sunny")) {
    return "clear";
  }
  return "partly";
}

function buildDailyActions({
  locationName,
  pm25,
  advisory,
  today,
  current
}: {
  locationName: string;
  pm25: number | null;
  advisory: ReturnType<typeof getPm25Advisory>;
  today?: OutlookRow;
  current: CurrentWeather;
}): DailyAction[] {
  const condition = today?.condition || current.condition || "mixed conditions";
  const rainProbability = Number(today?.rainProbability ?? 0);
  const heavyRain = classifyWeather(condition) === "heavy-rain" || classifyWeather(condition) === "storm" || rainProbability >= 75;
  const moderateRain = heavyRain || classifyWeather(condition) === "rain" || rainProbability >= 45;
  const mask = maskAdvice(pm25);
  const timing = timingAdvice(pm25, rainProbability, today);

  return [
    {
      id: "rain",
      title: heavyRain ? "Rain gear is important today" : moderateRain ? "Keep rain cover ready" : "Rain risk is low",
      badge: `${formatPercent(today?.rainProbability)} rain chance`,
      summary: heavyRain
        ? `${locationName} may see heavy rain signals. Keep an umbrella or raincoat ready.`
        : moderateRain
          ? `Rain is possible in ${locationName}. Carry a light umbrella if you travel.`
          : `No strong rain signal is visible right now.`,
      detail: heavyRain
        ? `Today's weather signal for ${locationName} shows ${condition.toLowerCase()} with ${formatPercent(today?.rainProbability)} rain chance. Carry an umbrella or raincoat, protect your phone and bag, and avoid unnecessary two-wheeler travel during strong showers.`
        : moderateRain
          ? `Today may bring ${condition.toLowerCase()} around ${locationName}. Keep a compact umbrella ready and prefer covered routes if you commute.`
          : `Rain risk appears low for ${locationName}. You can travel normally, but keep checking the day panel if the weather updates.`,
      icon: Umbrella,
      tone: heavyRain ? "bg-sky-600" : moderateRain ? "bg-sky-400" : "bg-emerald-400"
    },
    {
      id: "mask",
      title: mask.title,
      badge: `${advisory.category} PM2.5`,
      summary: mask.summary,
      detail: `${mask.detail} Current next-day PM2.5 forecast is ${formatNumber(pm25)} ug/m3, so the public status is ${advisory.category.toLowerCase()}. ${advisory.message}`,
      icon: ShieldCheck,
      tone: mask.tone
    },
    {
      id: "timing",
      title: timing.title,
      badge: "Outdoor timing",
      summary: timing.summary,
      detail: timing.detail,
      icon: Clock3,
      tone: timing.tone
    }
  ];
}

function maskAdvice(pm25: number | null): Pick<DailyAction, "title" | "summary" | "detail" | "tone"> {
  const value = Number(pm25 ?? 0);

  if (value <= 30) {
    return {
      title: "Mask is optional for most people",
      summary: "Normal outdoor movement is acceptable unless you are dust-sensitive.",
      detail: "A mask is usually not necessary for most people at this PM2.5 level. Dust-sensitive or asthma-sensitive users can still carry a simple mask near traffic, construction, or dusty roads.",
      tone: "bg-emerald-400"
    };
  }
  if (value <= 60) {
    return {
      title: "Sensitive users should carry a mask",
      summary: "Use a simple well-fitted mask near traffic or dust-heavy roads.",
      detail: "For normal walking this level is usually manageable. Children, elders, and asthma-sensitive users should keep a well-fitted mask ready near traffic, markets, road dust, or construction zones.",
      tone: "bg-lime-500"
    };
  }
  if (value <= 90) {
    return {
      title: "Prefer N95 or KN95 near traffic",
      summary: "Use better filtration during long outdoor travel or crowded roads.",
      detail: "For prolonged outdoor activity, a well-fitted N95 or KN95 style mask is a stronger choice than a loose cloth mask. This matters most during school travel, market visits, traffic exposure, and dusty roads.",
      tone: "bg-amber-400"
    };
  }
  return {
    title: "Use N95 or KN95 and reduce exposure",
    summary: "Avoid long outdoor exertion; sensitive users should stay indoors where possible.",
    detail: "A well-fitted N95 or KN95 style mask is recommended for necessary outdoor movement. Avoid long exertion and prefer indoor or covered spaces, especially for children, elders, and people with breathing sensitivity.",
    tone: "bg-red-500"
  };
}

function timingAdvice(pm25: number | null, rainProbability: number, today?: OutlookRow): Pick<DailyAction, "title" | "summary" | "detail" | "tone"> {
  const value = Number(pm25 ?? 0);
  const sunrise = formatTime(today?.sunrise);
  const sunset = formatTime(today?.sunset);

  if (rainProbability >= 70) {
    return {
      title: "Plan outdoor work between showers",
      summary: "Keep travel flexible and avoid exposed roads during heavy rain.",
      detail: `Sunrise is around ${sunrise} and sunset is around ${sunset}. Because rain probability is high, keep outdoor work flexible and avoid exposed roads during strong showers. If PM2.5 rises, combine this with mask guidance.`,
      tone: "bg-sky-500"
    };
  }
  if (value > 90) {
    return {
      title: "Keep outdoor activity short",
      summary: "Prefer necessary travel only and avoid high-exertion work outside.",
      detail: `Sunrise is around ${sunrise} and sunset is around ${sunset}. Keep outdoor exposure short, avoid high-exertion work near traffic or dusty roads, and use the mask guidance for necessary travel.`,
      tone: "bg-orange-500"
    };
  }
  return {
    title: "Use cooler, cleaner windows",
    summary: "Morning or late-afternoon movement is usually easier than midday heat.",
    detail: `Sunrise is around ${sunrise} and sunset is around ${sunset}. Prefer cooler morning or late-afternoon windows for outdoor work, and avoid road-dust exposure when traffic is heavy.`,
    tone: "bg-emerald-500"
  };
}

function buildOutlookRows(weather: WeatherDailyRow[], forecast: ForecastRow[]): OutlookRow[] {
  const forecastMap = new Map(forecast.map((row) => [row.date.slice(0, 10), row.predictedPm25]));
  if (weather.length) {
    return weather.map((row) => ({
      ...row,
      predictedPm25: forecastMap.get(row.date.slice(0, 10)) ?? null
    }));
  }

  return forecast.map((row) => ({
    date: row.date,
    condition: "Air outlook",
    temperatureMaxC: null,
    temperatureMinC: null,
    rainProbability: null,
    uvIndex: null,
    sunrise: null,
    sunset: null,
    windSpeedKmh: null,
    predictedPm25: row.predictedPm25
  }));
}

function getLatestPm25(history: AirDailyRow[]): number | null {
  const values = history.map((row) => row.pm25).filter((value): value is number => value !== null);
  return values.at(-1) ?? null;
}

function getNextPm25(forecast: ForecastRow[], history: AirDailyRow[]): number | null {
  return forecast.find((row) => row.predictedPm25 !== null)?.predictedPm25 ?? getLatestPm25(history);
}

function readableCoordinate(latitude: number, longitude: number): string {
  const lat = latitude >= 0 ? "N" : "S";
  const lon = longitude >= 0 ? "E" : "W";
  return `${Math.abs(latitude).toFixed(3)} ${lat}, ${Math.abs(longitude).toFixed(3)} ${lon}, near the town center`;
}

function formatTime(value: string | null | undefined): string {
  if (!value) {
    return "--";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "--";
  }
  return date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
}

function shortDate(value: string | null | undefined): string {
  if (!value) {
    return "--";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

function weekday(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Day";
  }
  return date.toLocaleDateString("en-IN", { weekday: "short" });
}

function sentenceKey(value: string): string {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function modelLabel(value: string): string {
  const labels: Record<string, string> = {
    naive_last_value: "Persistence baseline",
    arima: "Autoregressive",
    sarima: "Seasonal autoregressive",
    sarimax: "Seasonal model with supporting context"
  };
  return labels[value] ?? sentenceKey(value);
}

function AirScene({ pm25 }: { pm25: number }) {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 opacity-75">
      <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[4, 5, 4]} intensity={1.3} />
        <FloatingCore pm25={pm25} />
        <ParticleField pm25={pm25} />
      </Canvas>
    </div>
  );
}

function FloatingCore({ pm25 }: { pm25: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const intensity = Math.min(Math.max(pm25 / 90, 0.18), 1);

  useFrame((state) => {
    if (!ref.current) {
      return;
    }
    ref.current.rotation.x = state.clock.elapsedTime * 0.18;
    ref.current.rotation.y = state.clock.elapsedTime * 0.24;
    ref.current.position.y = Math.sin(state.clock.elapsedTime * 0.7) * 0.18;
  });

  return (
    <mesh ref={ref} position={[2.6, 1.15, -1.6]}>
      <torusKnotGeometry args={[1.1, 0.22, 140, 16]} />
      <meshStandardMaterial color={new THREE.Color().setHSL(0.33 - intensity * 0.14, 0.58, 0.58)} roughness={0.32} metalness={0.46} transparent opacity={0.32} />
    </mesh>
  );
}

function ParticleField({ pm25 }: { pm25: number }) {
  const ref = useRef<THREE.Points>(null);
  const count = 140;
  const positions = useMemo(() => {
    const values = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      values[i * 3] = (seededUnit(i, 1) - 0.5) * 10;
      values[i * 3 + 1] = (seededUnit(i, 2) - 0.5) * 6;
      values[i * 3 + 2] = (seededUnit(i, 3) - 0.5) * 5;
    }
    return values;
  }, []);

  useFrame((state) => {
    if (!ref.current) {
      return;
    }
    ref.current.rotation.y = state.clock.elapsedTime * 0.025;
    ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.16) * 0.035;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color={pm25 > 90 ? "#d95757" : pm25 > 60 ? "#f08a3e" : "#2f7d5b"}
        size={0.035}
        sizeAttenuation
        transparent
        opacity={0.48}
      />
    </points>
  );
}

function seededUnit(index: number, salt: number): number {
  const value = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453;
  return value - Math.floor(value);
}
